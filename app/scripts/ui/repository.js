export function renderRepositoryProfile(container, profile) {
  if (!container || !profile) return

  container.innerHTML = ""

  const head = document.createElement("div")
  head.className = "repo-profile__head"

  const identity = document.createElement("div")
  const label = document.createElement("p")
  label.className = "repo-profile__label"
  label.textContent = "公开仓库档案"
  const name = document.createElement("h2")
  name.textContent = profile.fullName
  identity.append(label, name)

  const link = document.createElement("a")
  link.className = "repo-profile__link"
  link.href = profile.htmlUrl
  link.target = "_blank"
  link.rel = "noopener noreferrer"
  link.textContent = "在 GitHub 打开 ↗"

  head.append(identity, link)

  const metrics = document.createElement("div")
  metrics.className = "repo-profile__metrics"
  const metricDefs = [
    ["Stars", profile.stars.toLocaleString()],
    ["Forks", profile.forks.toLocaleString()],
    ["主要语言", profile.language ?? "未知"],
    ["许可证", profile.license?.spdx ?? "不可用"]
  ]

  for (const [metricLabel, metricValue] of metricDefs) {
    const metric = document.createElement("div")
    metric.className = "repo-metric"
    const labelElement = document.createElement("span")
    labelElement.textContent = metricLabel
    const valueElement = document.createElement("strong")
    valueElement.textContent = metricValue
    metric.append(labelElement, valueElement)
    metrics.append(metric)
  }

  const facts = document.createElement("div")
  facts.className = "repo-facts"
  facts.innerHTML = `
    <span>仓库体积<strong>${profile.sizeKb.toLocaleString()} KB</strong></span>
    <span>默认分支<strong>${profile.defaultBranch ?? "未知"}</strong></span>
    <span>开放议题<strong>${profile.openIssues ?? "未知"}</strong></span>
    <span>创建于<strong>${profile.createdAt.slice(0, 10)}</strong></span>
    <span>最近推送<strong>${profile.pushedAt.slice(0, 10)}</strong></span>
  `

  const purpose = document.createElement("section")
  purpose.className = "repo-purpose"
  const purposeHeader = document.createElement("div")
  purposeHeader.className = "repo-purpose__heading"
  const purposeLabel = document.createElement("strong")
  purposeLabel.textContent = "这个项目是做什么的"
  const purposeSource = document.createElement("span")
  purposeSource.textContent = "来自 GitHub 简介与 Topics"
  purposeHeader.append(purposeLabel, purposeSource)

  const purposeText = document.createElement("p")
  purposeText.className = "repo-purpose__description"
  purposeText.textContent = profile.description
    ?? (profile.topics?.length > 0
      ? `GitHub 未提供文字简介；项目标签为 ${profile.topics.join("、")}。`
      : "GitHub 未提供项目简介，可结合根目录和 README 进一步判断。")

  const tags = document.createElement("div")
  tags.className = "repo-purpose__tags"
  for (const topic of (profile.topics ?? []).slice(0, 8)) {
    const tag = document.createElement("span")
    tag.textContent = topic
    tags.append(tag)
  }

  const scope = document.createElement("p")
  scope.className = "repo-purpose__scope"
  scope.textContent = "CodeStrata 判断的是许可证、维护结构、项目体量、活跃节奏和二次开发边界，不把 Star 数或单一指标当作代码质量总分。"
  purpose.append(purposeHeader, purposeText)
  if (tags.childElementCount > 0) purpose.append(tags)
  purpose.append(scope)

  container.append(head, metrics, facts, purpose)
}

export function renderRepositoryContents(container, entries) {
  if (!container) return
  container.innerHTML = ""

  const sorted = [...(entries ?? [])].sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1
    return a.name.localeCompare(b.name)
  })
  container.append(createPanelHeader(
    "仓库根目录",
    `${sorted.length} 项`,
    "只读取根目录名称、类型和大小；文件内容仍保留在 GitHub。"
  ))

  if (sorted.length === 0) {
    container.append(createEmpty("GitHub 未返回可展示的根目录内容。"))
    return
  }

  const list = document.createElement("div")
  list.className = "repo-tree"
  for (const entry of sorted.slice(0, 30)) {
    const link = document.createElement("a")
    link.className = "repo-tree__entry"
    link.href = entry.htmlUrl
    link.target = "_blank"
    link.rel = "noopener noreferrer"

    const kind = document.createElement("span")
    kind.className = `repo-tree__kind repo-tree__kind--${entry.type}`
    kind.textContent = entry.type === "dir" ? "目录" : "文件"

    const name = document.createElement("strong")
    name.textContent = entry.name

    const meta = document.createElement("small")
    meta.textContent = entry.type === "dir" ? "打开目录 ↗" : `${formatBytes(entry.size)} · 打开文件 ↗`

    link.append(kind, name, meta)
    list.append(link)
  }
  container.append(list)

  if (sorted.length > 30) {
    const more = document.createElement("p")
    more.className = "panel-footnote"
    more.textContent = `另有 ${sorted.length - 30} 个顶层条目，请在 GitHub 仓库中查看。`
    container.append(more)
  }
}

export function renderRecentCommits(container, commits) {
  if (!container) return
  container.innerHTML = ""
  container.append(createPanelHeader(
    "近期提交",
    `${commits?.length ?? 0} 条样本`,
    "展示采样到的最近提交，完整历史仍以 GitHub 为准。"
  ))

  if (!Array.isArray(commits) || commits.length === 0) {
    container.append(createEmpty("采样范围内没有提交记录。"))
    return
  }

  const list = document.createElement("ol")
  list.className = "commit-list"
  for (const commit of commits) {
    const item = document.createElement("li")
    const main = document.createElement("div")
    const link = document.createElement(commit.htmlUrl ? "a" : "span")
    link.className = "commit-list__message"
    link.textContent = commit.message ?? "无提交说明"
    if (commit.htmlUrl) {
      link.href = commit.htmlUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
    }
    const meta = document.createElement("small")
    meta.textContent = `${commit.author ?? "匿名"} · ${commit.date.slice(0, 10)} · ${commit.sha.slice(0, 7)}`
    main.append(link, meta)
    item.append(main)
    list.append(item)
  }
  container.append(list)
}

export function renderReleases(container, releases) {
  if (!container) return
  container.innerHTML = ""
  container.append(createPanelHeader(
    "版本记录",
    `${releases?.length ?? 0} 个 Release`,
    "版本列表来自 GitHub Releases，按发布时间从新到旧展示。"
  ))

  if (!Array.isArray(releases) || releases.length === 0) {
    container.append(createEmpty("采样范围内没有公开 Release。"))
    return
  }

  const list = document.createElement("ol")
  list.className = "release-list"
  const sorted = [...releases].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  for (const release of sorted.slice(0, 6)) {
    const item = document.createElement("li")
    const link = document.createElement("a")
    link.href = release.htmlUrl
    link.target = "_blank"
    link.rel = "noopener noreferrer"
    link.textContent = release.tagName || release.name || "Release"

    const date = document.createElement("span")
    date.textContent = release.publishedAt?.slice(0, 10) ?? "日期未知"
    item.append(link, date)
    list.append(item)
  }
  container.append(list)
}

export function renderContributors(container, contributors) {
  if (!container) return
  container.innerHTML = ""

  const title = document.createElement("h2")
  title.textContent = "贡献者构成"
  container.append(title)

  if (!Array.isArray(contributors) || contributors.length === 0) {
    const empty = document.createElement("p")
    empty.className = "empty-note"
    empty.textContent = "贡献者数据不可用。"
    container.append(empty)
    return
  }

  const sorted = [...contributors].sort((a, b) => b.contributions - a.contributions)
  const total = sorted.reduce((sum, item) => sum + item.contributions, 0)
  const list = document.createElement("ul")
  list.className = "repository__contributors"

  for (const contributor of sorted.slice(0, 12)) {
    const share = total > 0 ? Math.round((contributor.contributions / total) * 1000) / 10 : 0
    const item = document.createElement("li")

    const login = document.createElement(contributor.htmlUrl ? "a" : "span")
    login.className = "contributor-row__name"
    login.textContent = contributor.login ?? "匿名贡献者"
    if (contributor.htmlUrl) {
      login.href = contributor.htmlUrl
      login.target = "_blank"
      login.rel = "noopener noreferrer"
    }

    const count = document.createElement("span")
    count.textContent = `${contributor.contributions} 次 · ${share}%`

    const bar = document.createElement("span")
    bar.className = "contributor-row__bar"
    bar.innerHTML = `<i style="--share:${Math.min(share, 100)}%"></i>`

    item.append(login, count, bar)
    list.append(item)
  }

  container.append(list)
}

function createPanelHeader(title, meta, description) {
  const header = document.createElement("div")
  header.className = "panel-heading"
  const copy = document.createElement("div")
  const heading = document.createElement("h2")
  heading.textContent = title
  const detail = document.createElement("p")
  detail.textContent = description
  copy.append(heading, detail)
  const count = document.createElement("span")
  count.className = "panel-heading__meta"
  count.textContent = meta
  header.append(copy, count)
  return header
}

function createEmpty(message) {
  const empty = document.createElement("p")
  empty.className = "empty-note"
  empty.textContent = message
  return empty
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "大小未知"
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / 1024 / 1024).toFixed(1)} MB`
}

export function renderRisk(container, risk) {
  if (!container) return
  container.innerHTML = ""

  const label = document.createElement("p")
  label.className = "inspector-section__label"
  label.textContent = "维护风险"

  if (!risk) {
    const empty = document.createElement("p")
    empty.className = "empty-note"
    empty.textContent = "风险数据尚未生成。"
    container.append(label, empty)
    return
  }

  const summary = document.createElement("div")
  summary.className = "risk-summary"
  const seal = document.createElement("span")
  seal.className = "risk-summary__seal"
  seal.textContent = overallLabel(risk.overall)
  const summaryCopy = document.createElement("div")
  const title = document.createElement("strong")
  title.textContent = overallTitle(risk.overall)
  const detail = document.createElement("p")
  detail.textContent = "结论综合许可证、维护集中度、项目体量和活跃节奏。"
  summaryCopy.append(title, detail)
  summary.append(seal, summaryCopy)

  const list = document.createElement("ul")
  list.className = "risk-list"
  for (const [key, itemLabel] of Object.entries({
    license: "许可证",
    maintenance: "维护集中度",
    scale: "项目体量",
    activity: "活跃节奏"
  })) {
    const row = document.createElement("li")
    row.dataset.level = risk[key].level
    const rowTitle = document.createElement("strong")
    rowTitle.textContent = `${itemLabel} · ${risk[key].title}`
    const rowDetail = document.createElement("p")
    rowDetail.textContent = risk[key].detail
    row.append(rowTitle, rowDetail)
    list.append(row)
  }

  container.append(label, summary, list)
}

export function renderRecommendation(container, risk) {
  if (!container) return
  container.innerHTML = ""

  const label = document.createElement("p")
  label.className = "inspector-section__label"
  label.textContent = "二次开发判断"

  if (!risk) {
    const empty = document.createElement("p")
    empty.className = "empty-note"
    empty.textContent = "复用建议尚未生成。"
    container.append(label, empty)
    return
  }

  const verdict = document.createElement("p")
  verdict.className = "recommendation-verdict"
  verdict.textContent = overallTitle(risk.overall)

  const copy = document.createElement("p")
  copy.className = "recommendation-copy"
  copy.textContent = "以下是基于当前公开元数据的工程判断，应与许可证原文和最近 issue 状态一起核对。"

  const list = document.createElement("ul")
  list.className = "recommendation-list"
  for (const recommendation of [
    risk.license.recommendation,
    risk.maintenance.recommendation,
    risk.activity.recommendation
  ]) {
    const item = document.createElement("li")
    item.textContent = recommendation
    list.append(item)
  }

  container.append(label, verdict, copy, list)
}

export function overallLabel(level) {
  return { ok: "宜", watch: "慎", caution: "险" }[level] ?? "待"
}

export function overallTitle(level) {
  return {
    ok: "适合作为复用基线",
    watch: "先验证关键模块，再决定复用",
    caution: "谨慎复用，优先抽取结构"
  }[level] ?? "等待完整数据"
}
