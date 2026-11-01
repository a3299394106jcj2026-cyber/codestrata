import assert from "node:assert/strict"
import test from "node:test"
import { assessRepositoryRisk } from "../../app/scripts/risk.js"

const baseProfile = { license: null, sizeKb: 0 }

test("missing license is caution and contributes to overall caution", () => {
  const result = assessRepositoryRisk({
    profile: { ...baseProfile, license: null },
    contributors: [],
    insight: { activeMonths: 0, gapCount: 0, peakMonth: null, sampledTo: null },
    asOf: "2026-11-01T00:00:00Z"
  })

  assert.equal(result.license.level, "caution")
  assert.equal(result.overall, "caution")
})

test("MIT license is permissive", () => {
  const result = assessRepositoryRisk({
    profile: { ...baseProfile, license: { name: "MIT License", spdx: "MIT", url: "" } },
    contributors: [],
    insight: { activeMonths: 0, gapCount: 0, peakMonth: null, sampledTo: null },
    asOf: "2026-11-01T00:00:00Z"
  })

  assert.equal(result.license.level, "ok")
  assert.match(result.license.title, /MIT/)
})

test("top contributor above 80 percent triggers caution", () => {
  const contributors = [
    { login: "alice", contributions: 90 },
    { login: "bob", contributions: 10 }
  ]

  const result = assessRepositoryRisk({
    profile: { ...baseProfile, license: { spdx: "MIT" }, sizeKb: 500 },
    contributors,
    insight: { activeMonths: 3, gapCount: 0, peakMonth: "2025-01", sampledTo: "2025-01-31T00:00:00Z" },
    asOf: "2025-02-01T00:00:00Z"
  })

  assert.equal(result.maintenance.level, "caution")
  assert.match(result.maintenance.title, /alice/)
  assert.match(result.maintenance.detail, /90/)
})

test("small size and continuous growth without gap is ok overall", () => {
  const contributors = [
    { login: "alice", contributions: 50 },
    { login: "bob", contributions: 50 }
  ]

  const result = assessRepositoryRisk({
    profile: { ...baseProfile, license: { spdx: "MIT" }, sizeKb: 400 },
    contributors,
    insight: { activeMonths: 5, gapCount: 0, peakMonth: "2025-05", sampledTo: "2025-05-31T00:00:00Z" },
    asOf: "2025-06-01T00:00:00Z"
  })

  assert.equal(result.overall, "ok")
})

test("a repository without a public push for more than a year is marked stale", () => {
  const result = assessRepositoryRisk({
    profile: {
      ...baseProfile,
      license: { spdx: "MIT" },
      sizeKb: 500,
      pushedAt: "2025-08-21T10:56:30Z"
    },
    contributors: [
      { login: "alice", contributions: 50 },
      { login: "bob", contributions: 50 }
    ],
    insight: {
      activeMonths: 5,
      gapCount: 0,
      peakMonth: "2025-08",
      sampledTo: "2025-08-21T10:56:30Z"
    },
    asOf: "2026-11-01T00:00:00Z"
  })

  assert.equal(result.activity.level, "caution")
  assert.match(result.activity.title, /15 个月/)
  assert.equal(result.overall, "caution")
})
