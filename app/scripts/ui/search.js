import { parseRepositoryInput, fetchRepositorySnapshot } from "../github.js"
import { RepositoryCache } from "../cache.js"
import { aggregateCommitStrata } from "../aggregator.js"
import { assessRepositoryRisk } from "../risk.js"
import { generateReport } from "../report.js"
import { offlineDemoSnapshot } from "../data/offline-demo.js"
import { renderStatus, renderSourceBadge } from "./status.js"
import {
  renderRepositoryProfile,
  renderContributors,
  renderRepositoryContents,
  renderRecentCommits,
  renderReleases,
  renderRecommendation,
  renderRisk
} from "./repository.js"
import { renderStrata } from "./strata.js"

const cache = new RepositoryCache()

export function initializeSearch(elements) {
  let currentSnapshot = null
  let currentRisk = null
  let currentReport = null

  const updateResult = snapshot => {
    currentSnapshot = snapshot
    currentRisk = assessRepositoryRisk({
      profile: snapshot.insight.profile,
      contributors: snapshot.insight.contributors,
      insight: snapshot.insight,
      asOf: snapshot.fetchedAt
    })
    renderInsight(elements, snapshot, currentRisk)
    showWorkspace(elements)
  }

  elements.form.addEventListener("submit", event => {
    event.preventDefault()
    handleSearch(elements, updateResult)
  })

  elements.refreshButton.addEventListener("click", () => {
    discoverLive(elements, updateResult)
  })

  for (const button of elements.demoButtons) {
    button.addEventListener("click", () => renderOffline(elements, updateResult))
  }

  elements.methodButton.addEventListener("click", () => openDialog(elements.methodDialog))
  elements.methodClose.addEventListener("click", () => closeDialog(elements.methodDialog))
  elements.methodDialog.addEventListener("click", event => {
    if (event.target === elements.methodDialog) closeDialog(elements.methodDialog)
  })

  elements.homeButton.addEventListener("click", () => {
    showLanding(elements)
    renderStatus(elements.statusEl, null)
  })

  elements.reportButton.addEventListener("click", () => {
    if (!currentSnapshot || !currentRisk) return
    currentReport = generateReport({ snapshot: currentSnapshot, risk: currentRisk })
    elements.reportContent.textContent = currentReport.markdown
    elements.copyFeedback.textContent = "报告只包含公开元数据，不读取仓库源码。"
    openDialog(elements.reportDialog)
  })

  elements.reportClose.addEventListener("click", () => closeDialog(elements.reportDialog))
  elements.reportDialog.addEventListener("click", event => {
    if (event.target === elements.reportDialog) closeDialog(elements.reportDialog)
  })
  elements.reportCopy.addEventListener("click", async () => {
    if (!currentReport) return
    try {
      await copyText(currentReport.markdown)
      elements.copyFeedback.textContent = "已复制 Markdown 报告。"
    } catch (error) {
      elements.copyFeedback.textContent = "复制失败，请手动选择报告文本。"
    }
  })
}

async function handleSearch(elements, updateResult) {
  const query = elements.input.value.trim()
  setLoading(elements, true)
  renderStatus(elements.statusEl, {
    kind: "loading",
    title: "正在发掘…",
    detail: "正在校验地址并查找本地缓存。"
  })

  try {
    const { owner, repo } = parseRepositoryInput(query)
    const cached = cache.load(owner, repo)
    if (cached) {
      updateResult(cached)
      renderStatus(elements.statusEl, {
        kind: "info",
        title: "使用本地缓存",
        detail: `缓存时间 ${formatUtc(cached.fetchedAt)}。需要最新状态时再执行显式刷新。`,
        action: "重新发掘",
        onAction: () => discoverLive(elements, updateResult)
      })
      setLoading(elements, false)
      return
    }

    await discoverLive(elements, updateResult)
  } catch (error) {
    renderFailure(elements, error, updateResult)
    setLoading(elements, false)
  }
}

async function discoverLive(elements, updateResult) {
  setLoading(elements, true)
  renderStatus(elements.statusEl, {
    kind: "loading",
    title: "正在连接 GitHub…",
    detail: "读取仓库档案、提交、贡献者和版本记录。"
  })

  try {
    const repository = parseRepositoryInput(elements.input.value)
    const snapshot = await fetchRepositorySnapshot(repository)
    const insight = buildInsight(snapshot)
    const envelope = {
      sourceType: "live",
      sourceName: "GitHub 实时数据",
      fetchedAt: new Date().toISOString(),
      schemaVersion: 2,
      rateLimitRemaining: snapshot.rateLimitRemaining,
      insight
    }

    cache.save(envelope)
    updateResult(envelope)
    renderStatus(elements.statusEl, null)
    setLoading(elements, false)
  } catch (error) {
    renderFailure(elements, error, updateResult)
    setLoading(elements, false)
  }
}

function renderOffline(elements, updateResult) {
  updateResult(offlineDemoSnapshot)
  renderStatus(elements.statusEl, {
    kind: "warning",
    title: "离线演示模式",
    detail: "当前显示内置历史快照，不代表 satnaing/shadcn-admin 的实时 GitHub 状态。",
    meta: `快照时间 ${formatUtc(offlineDemoSnapshot.fetchedAt)}`
  })
}

function renderFailure(elements, error, updateResult) {
  renderStatus(elements.statusEl, {
    kind: "error",
    title: error.title ?? "发掘失败",
    detail: error.detail ?? error.message,
    action: error.action,
    onAction: error.kind === "NETWORK" || error.kind === "RATE_LIMITED"
      ? () => renderOffline(elements, updateResult)
      : undefined
  })
}

function buildInsight(snapshot) {
  const strataResult = aggregateCommitStrata({
    commits: snapshot.commits,
    releases: snapshot.releases
  })
  const contributors = snapshot.contributors
  const total = contributors.reduce((sum, item) => sum + item.contributions, 0)
  const top = contributors.length > 0
    ? [...contributors].sort((a, b) => b.contributions - a.contributions)[0]
    : null

  return {
    profile: snapshot.profile,
    strata: strataResult.strata,
    rootContents: snapshot.rootContents ?? [],
    recentCommits: [...snapshot.commits]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8),
    releases: strataResult.releases,
    contributors,
    topContributorShare: top && total > 0 ? Math.round((top.contributions / total) * 1000) / 10 : null,
    activeMonths: strataResult.activeMonths,
    gapCount: strataResult.gapCount,
    peakMonth: strataResult.peakMonth,
    sampledFrom: strataResult.sampledFrom,
    sampledTo: strataResult.sampledTo,
    isSampledHistory: true
  }
}

function renderInsight(elements, snapshot, risk) {
  renderSourceBadge(elements.sourceEl, snapshot)
  renderRepositoryProfile(elements.repositoryEl, snapshot.insight.profile)
  renderRepositoryContents(elements.filesEl, snapshot.insight.rootContents)
  renderStrata(elements.strataEl, snapshot.insight)
  renderRecentCommits(elements.commitsEl, snapshot.insight.recentCommits)
  renderReleases(elements.releasesEl, snapshot.insight.releases)
  renderContributors(elements.contributorsEl, snapshot.insight.contributors)
  renderRisk(elements.riskEl, risk)
  renderRecommendation(elements.recommendationEl, risk)

  elements.sourceNoteEl.textContent = `${snapshot.sourceName} · ${formatUtc(snapshot.fetchedAt)}`
  elements.reportButton.disabled = false
  updateQuota(elements.quotaEl, snapshot)
}

function showWorkspace(elements) {
  elements.landingView.hidden = true
  elements.workspaceView.hidden = false
  elements.body.dataset.view = "workspace"
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function showLanding(elements) {
  elements.landingView.hidden = false
  elements.workspaceView.hidden = true
  elements.body.dataset.view = "landing"
  window.scrollTo({ top: 0, behavior: "smooth" })
}

function setLoading(elements, loading) {
  elements.submit.disabled = loading
  elements.refreshButton.disabled = loading
  elements.submit.textContent = loading ? "发掘中…" : "开始发掘"
}

function updateQuota(element, snapshot) {
  element.className = "quota-status"
  if (snapshot.sourceType !== "live") {
    element.textContent = "本次未消耗实时限额"
    return
  }

  if (!Number.isFinite(snapshot.rateLimitRemaining)) {
    element.textContent = "限额状态不可用"
    return
  }

  element.textContent = `GitHub 剩余 ${snapshot.rateLimitRemaining} 次`
  element.classList.add(snapshot.rateLimitRemaining <= 10 ? "is-caution" : "is-ok")
}

function formatUtc(value) {
  return new Date(value).toISOString().slice(0, 16).replace("T", " ") + " UTC"
}

function openDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal()
  } else {
    dialog.setAttribute("open", "")
  }
}

function closeDialog(dialog) {
  if (typeof dialog.close === "function") {
    dialog.close()
  } else {
    dialog.removeAttribute("open")
  }
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  document.body.append(textarea)
  textarea.select()
  const copied = document.execCommand("copy")
  textarea.remove()
  if (!copied) throw new Error("COPY_FAILED")
}
