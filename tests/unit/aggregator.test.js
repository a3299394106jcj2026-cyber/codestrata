import assert from "node:assert/strict"
import test from "node:test"
import { aggregateCommitStrata } from "../../app/scripts/aggregator.js"

test("aggregateCommitStrata fills calendar months, marks peaks, and counts gaps", () => {
  const result = aggregateCommitStrata({
    commits: [
      { sha: "a", date: "2025-01-02T00:00:00Z", author: "alice" },
      { sha: "b", date: "2025-01-10T00:00:00Z", author: "bob" },
      { sha: "c", date: "2025-03-05T00:00:00Z", author: "alice" }
    ],
    releases: []
  })

  assert.equal(result.strata.length, 3)
  assert.equal(result.activeMonths, 2)
  assert.equal(result.gapCount, 1)
  assert.equal(result.peakMonth, "2025-01")
  assert.deepEqual(result.strata.map(month => month.commitCount), [2, 0, 1])
  assert.equal(result.strata[1].isGap, true)
  assert.equal(result.strata[1].gapRunLength, 1)
  assert.equal(result.strata[0].isPeak, true)
})

test("aggregateCommitStrata attaches releases to UTC month", () => {
  const result = aggregateCommitStrata({
    commits: [
      { sha: "a", date: "2025-02-10T00:00:00Z", author: "alice" }
    ],
    releases: [
      { id: "1", tagName: "v1", name: "v1", publishedAt: "2025-02-20T00:00:00Z", htmlUrl: "https://example.com" }
    ]
  })

  assert.equal(result.releases.length, 1)
  assert.equal(result.releases[0].yearMonth, "2025-02")
})

test("aggregateCommitStrata returns a valid empty insight when there are no commits", () => {
  const result = aggregateCommitStrata({ commits: [], releases: [] })
  assert.deepEqual(result.strata, [])
  assert.equal(result.activeMonths, 0)
  assert.equal(result.gapCount, 0)
  assert.equal(result.peakMonth, null)
  assert.equal(result.isSampledHistory, true)
})

test("aggregateCommitStrata keeps the earliest tied peak and records complete gap runs", () => {
  const result = aggregateCommitStrata({
    commits: [
      { sha: "a", date: "2025-01-03T00:00:00Z", author: "alice" },
      { sha: "b", date: "2025-01-19T00:00:00Z", author: "bob" },
      { sha: "c", date: "2025-04-04T00:00:00Z", author: "alice" },
      { sha: "d", date: "2025-04-20T00:00:00Z", author: "carol" }
    ],
    releases: [
      { id: "r1", tagName: "v1", name: "v1", publishedAt: "2025-03-10T00:00:00Z", htmlUrl: "https://example.com/release" }
    ]
  })

  assert.equal(result.peakMonth, "2025-01")
  assert.equal(result.strata.filter(month => month.isPeak).length, 1)
  assert.equal(result.strata[0].isPeak, true)
  assert.equal(result.strata[3].isPeak, false)
  assert.deepEqual(result.strata.slice(1, 3).map(month => month.gapRunLength), [1, 2])
  assert.equal(result.gapCount, 1)
  assert.equal(result.releases[0].yearMonth, "2025-03")
})
