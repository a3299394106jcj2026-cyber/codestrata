import assert from "node:assert/strict"
import test from "node:test"
import { offlineDemoSnapshot } from "../../app/scripts/data/offline-demo.js"
import { assessRepositoryRisk } from "../../app/scripts/risk.js"
import { generateReport } from "../../app/scripts/report.js"

function createReport() {
  const risk = assessRepositoryRisk({
    profile: offlineDemoSnapshot.insight.profile,
    contributors: offlineDemoSnapshot.insight.contributors,
    insight: offlineDemoSnapshot.insight,
    asOf: offlineDemoSnapshot.fetchedAt
  })
  return generateReport({
    snapshot: offlineDemoSnapshot,
    risk,
    createdAt: "2026-11-01T15:30:00Z"
  })
}

test("generateReport preserves repository facts, provenance, and dates", () => {
  const report = createReport()

  assert.equal(report.repository, "satnaing/shadcn-admin")
  assert.equal(report.createdAt, "2026-11-01T15:30:00Z")
  assert.match(report.markdown, /# satnaing\/shadcn-admin 二次开发考古报告/)
  assert.match(report.markdown, /数据来源：内置离线演示数据/)
  assert.match(report.markdown, /快照时间：2026-11-01 14:30 UTC/)
  assert.match(report.markdown, /报告生成：2026-11-01 15:30 UTC/)
  assert.match(report.markdown, /许可证：MIT/)
  assert.match(report.markdown, /Stars：16,339/)
  assert.match(report.markdown, /峰值月份：2026-04/)
  assert.match(report.markdown, /283 次提交 · 90\.1%/)
})

test("generateReport separates verifiable facts from engineering recommendations", () => {
  const report = createReport()

  assert.deepEqual(report.sections, [
    "仓库事实",
    "仓库结构",
    "近期提交",
    "时间地层",
    "维护结构",
    "风险判断",
    "二次开发建议",
    "数据来源与边界"
  ])
  assert.match(report.markdown, /## 仓库事实/)
  assert.match(report.markdown, /## 仓库结构\n- 默认分支：main/)
  assert.match(report.markdown, /顶层目录：\.github、\.vscode、public、src/)
  assert.match(report.markdown, /## 近期提交/)
  assert.match(report.markdown, /bump @clerk\/react from 6\.4\.2 to 6\.4\.3/)
  assert.match(report.markdown, /## 二次开发建议\n以下内容是基于公开元数据的工程判断/)
  assert.match(report.markdown, /保留 LICENSE 与上游署名/)
  assert.match(report.markdown, /只展示公开元数据，不读取或分发仓库源码/)
})
