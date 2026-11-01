const SOURCE_LABELS = {
  live: "GitHub 实时数据",
  cache: "本地缓存",
  "offline-demo": "内置离线演示数据"
}

export function generateReport({ snapshot, risk, createdAt = new Date().toISOString() }) {
  if (!snapshot?.insight?.profile || !risk) {
    throw new Error("REPORT_INPUT_INCOMPLETE")
  }

  const insight = snapshot.insight
  const profile = insight.profile
  const contributors = insight.contributors ?? []
  const totalContributions = contributors.reduce((sum, item) => sum + item.contributions, 0)
  const top = contributors.length > 0
    ? [...contributors].sort((a, b) => b.contributions - a.contributions)[0]
    : null
  const topShare = top && totalContributions > 0
    ? Math.round((top.contributions / totalContributions) * 1000) / 10
    : null

  const sections = [
    "仓库事实",
    "仓库结构",
    "近期提交",
    "时间地层",
    "维护结构",
    "风险判断",
    "二次开发建议",
    "数据来源与边界"
  ]

  const recommendations = [...new Set([
    risk.license.recommendation,
    risk.maintenance.recommendation,
    risk.activity.recommendation
  ])]

  const markdown = [
    `# ${profile.fullName} 二次开发考古报告`,
    "",
    `> 数据来源：${SOURCE_LABELS[snapshot.sourceType] ?? snapshot.sourceName}`,
    `> 快照时间：${formatUtc(snapshot.fetchedAt)}`,
    `> 报告生成：${formatUtc(createdAt)}`,
    "",
    "## 仓库事实",
    `- 仓库：${profile.fullName}`,
    `- 公开地址：${profile.htmlUrl}`,
    `- 仓库描述：${profile.description ?? "无仓库描述"}`,
    `- 主要语言：${profile.language ?? "未知"}`,
    `- 许可证：${profile.license?.spdx ?? "许可证信息不可用"}`,
    `- Stars：${profile.stars.toLocaleString()}`,
    `- Forks：${profile.forks.toLocaleString()}`,
    `- 仓库体积：${profile.sizeKb.toLocaleString()} KB`,
    `- 创建时间：${formatDate(profile.createdAt)}`,
    `- 最近推送：${formatDate(profile.pushedAt)}`,
    "",
    "## 仓库结构",
    `- 默认分支：${profile.defaultBranch ?? "未知"}`,
    `- 开放议题：${profile.openIssues ?? "未知"}`,
    `- 顶层目录：${listNames(insight.rootContents, "dir")}`,
    `- 顶层文件：${listNames(insight.rootContents, "file")}`,
    "",
    "## 近期提交",
    ...formatRecentCommits(insight.recentCommits),
    "",
    "## 时间地层",
    `- 采样范围：${formatMonth(insight.sampledFrom)} ~ ${formatMonth(insight.sampledTo)}`,
    `- 活跃月份：${insight.activeMonths}`,
    `- 停更断层：${insight.gapCount}`,
    `- 峰值月份：${insight.peakMonth ?? "无"}`,
    `- 公开 Release：${insight.releases?.length ?? 0}`,
    `- 数据边界：${insight.isSampledHistory ? "有界提交样本，不是完整历史" : "完整采样范围"}`,
    "",
    "## 维护结构",
    `- 贡献者样本：${contributors.length}`,
    top
      ? `- 最高贡献者：${top.login ?? "匿名贡献者"} · ${top.contributions} 次提交 · ${topShare}%`
      : "- 最高贡献者：贡献者数据不可用",
    "",
    "## 风险判断",
    `- 综合判断：${overallTitle(risk.overall)}`,
    `- 许可证：${risk.license.title}。${risk.license.detail}`,
    `- 维护集中度：${risk.maintenance.title}。${risk.maintenance.detail}`,
    `- 项目体量：${risk.scale.title}。${risk.scale.detail}`,
    `- 活跃节奏：${risk.activity.title}。${risk.activity.detail}`,
    "",
    "## 二次开发建议",
    "以下内容是基于公开元数据的工程判断，不等同于对许可证条款的法律解释：",
    ...recommendations.map(item => `- ${item}`),
    "",
    "## 数据来源与边界",
    `- 数据来源：${SOURCE_LABELS[snapshot.sourceType] ?? snapshot.sourceName}`,
    `- 上游仓库：${profile.htmlUrl}`,
    `- 快照时间：${formatUtc(snapshot.fetchedAt)}`,
    "- 数据范围：公开 GitHub 元数据、贡献者快照、最多两页提交样本和公开 Release。",
    "- 使用边界：只展示公开元数据，不读取或分发仓库源码。",
    ""
  ].join("\n")

  return {
    repository: profile.fullName,
    markdown,
    sections,
    createdAt
  }
}

function overallTitle(level) {
  return {
    ok: "适合作为复用基线",
    watch: "先验证关键模块，再决定复用",
    caution: "谨慎复用，优先抽取结构"
  }[level] ?? "等待完整数据"
}

function formatUtc(value) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ") + " UTC"
}

function formatDate(value) {
  return value ? value.slice(0, 10) : "未知"
}

function formatMonth(value) {
  return value ? value.slice(0, 7) : "未知"
}

function listNames(entries, type) {
  const names = (entries ?? []).filter(entry => entry.type === type).map(entry => entry.name)
  return names.length > 0 ? names.join("、") : "无"
}

function formatRecentCommits(commits) {
  if (!Array.isArray(commits) || commits.length === 0) return ["- 采样范围内没有提交记录。"]
  return commits.slice(0, 5).map(commit => (
    `- ${formatDate(commit.date)} · ${commit.author ?? "匿名"} · ${commit.message ?? "无提交说明"}`
  ))
}
