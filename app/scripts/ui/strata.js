export function renderStrata(container, insight) {
  if (!container || !insight?.strata) return

  container.innerHTML = ""
  container.append(createHeading(insight))

  if (insight.strata.length === 0) {
    const empty = document.createElement("p")
    empty.className = "strata__empty"
    empty.textContent = "采样期内没有可展示的提交地层。"
    container.append(empty)
    return
  }

  const max = Math.max(...insight.strata.map(stratum => stratum.commitCount), 1)
  const chart = document.createElement("div")
  chart.className = "strata__chart"
  chart.setAttribute("role", "group")
  chart.setAttribute("aria-label", "时间地层。使用左右方向键切换月份。")

  const bars = insight.strata.map((stratum, index) => {
    const releases = getMonthReleases(insight.releases, stratum.yearMonth)
    const bar = document.createElement("button")
    bar.type = "button"
    bar.className = "strata__bar"
    bar.dataset.yearMonth = stratum.yearMonth
    bar.dataset.index = String(index)
    bar.setAttribute("aria-pressed", "false")
    bar.setAttribute("aria-label", describeStratum(stratum, releases))
    bar.title = describeStratum(stratum, releases)
    bar.__stratum = stratum
    bar.__releases = releases

    if (stratum.isGap) bar.classList.add("strata__bar--gap")
    if (stratum.isPeak) bar.classList.add("strata__bar--peak")
    if (releases.length > 0) bar.classList.add("strata__bar--release")

    const fill = document.createElement("span")
    fill.className = "strata__fill"
    fill.style.height = `${Math.max(2, (stratum.commitCount / max) * 100)}%`
    bar.append(fill)

    if (stratum.commitCount >= max * 0.3) {
      const label = document.createElement("span")
      label.className = "strata__count"
      label.textContent = String(stratum.commitCount)
      bar.append(label)
    }

    if (releases.length > 0) {
      const marker = document.createElement("span")
      marker.className = "strata__release-marker"
      marker.setAttribute("aria-hidden", "true")
      bar.append(marker)
    }

    bar.addEventListener("click", () => selectStratum(container, bars, index))
    bar.addEventListener("keydown", event => handleTimelineKey(event, container, bars, index))
    chart.append(bar)
    return bar
  })

  container.append(chart)
  selectStratum(container, bars, findInitialIndex(insight), false)

  const summary = document.createElement("div")
  summary.className = "strata__summary"
  summary.innerHTML = `
    <span><strong>${insight.activeMonths}</strong> 活跃月</span>
    <span><strong>${insight.gapCount}</strong> 断层</span>
    ${insight.peakMonth ? `<span>峰值 <strong>${insight.peakMonth}</strong></span>` : ""}
    <span>采样 ${insight.sampledFrom?.slice(0, 7) ?? "未知"} ~ ${insight.sampledTo?.slice(0, 7) ?? "未知"}</span>
  `

  container.append(summary)
}

function createHeading(insight) {
  const heading = document.createElement("div")
  heading.className = "strata__heading"

  const copy = document.createElement("div")
  const eyebrow = document.createElement("p")
  eyebrow.className = "section-eyebrow"
  eyebrow.textContent = "提交地层 · UTC 月视图"
  const title = document.createElement("h2")
  title.textContent = "时间地层"
  const description = document.createElement("p")
  description.className = "strata__description"
  description.textContent = insight.isSampledHistory
    ? "每个柱面代表一个 UTC 月份；当前结果基于有界提交样本。"
    : "每个柱面代表一个 UTC 月份的提交沉淀。"
  copy.append(eyebrow, title, description)

  const legend = document.createElement("div")
  legend.className = "strata__legend"
  legend.innerHTML = `
    <span><i class="legend__active"></i>活跃</span>
    <span><i class="legend__peak"></i>峰值</span>
    <span><i class="legend__gap"></i>断层</span>
    <span><i class="legend__release"></i>Release</span>
  `

  heading.append(copy, legend)
  return heading
}

function selectStratum(container, bars, index, shouldFocus = true) {
  const bar = bars[index]
  if (!bar) return

  bars.forEach(item => {
    item.classList.toggle("is-selected", item === bar)
    item.setAttribute("aria-pressed", item === bar ? "true" : "false")
  })

  if (shouldFocus) bar.focus()

  let detail = container.querySelector("#strata-detail")
  if (!detail) {
    detail = document.createElement("div")
    detail.id = "strata-detail"
    detail.className = "strata__detail"
    container.querySelector(".strata__chart").after(detail)
  }

  renderDetail(detail, bar.__stratum, bar.__releases)
}

function renderDetail(container, stratum, releases) {
  container.innerHTML = ""

  const status = document.createElement("div")
  status.className = "strata__detail-status"
  status.textContent = stratum.isGap
    ? `断层 ${stratum.gapRunLength ?? 1} 个月`
    : stratum.isPeak
      ? "活跃峰值"
      : "活跃沉积"

  const month = document.createElement("strong")
  month.className = "strata__detail-month"
  month.textContent = stratum.yearMonth

  const facts = document.createElement("div")
  facts.className = "strata__detail-facts"
  facts.innerHTML = stratum.isGap
    ? `<span><b>${stratum.gapRunLength ?? 1}</b> 个连续无提交月份</span><span>当月没有采样提交</span>`
    : `<span><b>${stratum.commitCount}</b> 次提交</span><span><b>${stratum.contributorCount ?? "—"}</b> 位活跃贡献者</span>`

  container.append(status, month, facts)

  if (releases.length > 0) {
    const releaseList = document.createElement("div")
    releaseList.className = "strata__detail-releases"
    const label = document.createElement("span")
    label.textContent = `${releases.length} 个公开 Release`
    releaseList.append(label)
    for (const release of releases.slice(0, 3)) {
      const link = document.createElement("a")
      link.href = release.htmlUrl
      link.target = "_blank"
      link.rel = "noopener noreferrer"
      link.textContent = release.tagName || release.name || "Release"
      releaseList.append(link)
    }
    container.append(releaseList)
  }
}

function handleTimelineKey(event, container, bars, index) {
  let nextIndex = index
  if (event.key === "ArrowLeft") nextIndex = Math.max(0, index - 1)
  if (event.key === "ArrowRight") nextIndex = Math.min(bars.length - 1, index + 1)
  if (event.key === "Home") nextIndex = 0
  if (event.key === "End") nextIndex = bars.length - 1
  if (nextIndex === index) return
  event.preventDefault()
  selectStratum(container, bars, nextIndex)
}

function findInitialIndex(insight) {
  if (insight.peakMonth) {
    const peakIndex = insight.strata.findIndex(stratum => stratum.yearMonth === insight.peakMonth)
    if (peakIndex >= 0) return peakIndex
  }
  const activeIndex = insight.strata.findLastIndex(stratum => stratum.commitCount > 0)
  return activeIndex >= 0 ? activeIndex : insight.strata.length - 1
}

function getMonthReleases(releases, yearMonth) {
  return Array.isArray(releases) ? releases.filter(release => release.yearMonth === yearMonth) : []
}

function describeStratum(stratum, releases) {
  const releaseText = releases.length > 0 ? `，包含 ${releases.length} 个 Release` : ""
  if (stratum.isGap) {
    return `${stratum.yearMonth}，连续 ${stratum.gapRunLength ?? 1} 个月无提交${releaseText}`
  }
  return `${stratum.yearMonth}，${stratum.commitCount} 次提交，${stratum.contributorCount ?? "未知"} 位活跃贡献者${releaseText}`
}
