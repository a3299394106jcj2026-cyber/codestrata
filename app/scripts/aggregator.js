export function aggregateCommitStrata({ commits, releases }) {
  if (!Array.isArray(commits) || commits.length === 0) {
    return {
      strata: [],
      activeMonths: 0,
      gapCount: 0,
      peakMonth: null,
      sampledFrom: null,
      sampledTo: null,
      isSampledHistory: true
    }
  }

  const sorted = [...commits].sort((a, b) => new Date(a.date) - new Date(b.date))
  const sampledFrom = sorted[0].date
  const sampledTo = sorted[sorted.length - 1].date
  const monthCounts = new Map()
  const monthContributors = new Map()

  for (const commit of sorted) {
    const yearMonth = toUtcYearMonth(commit.date)
    monthCounts.set(yearMonth, (monthCounts.get(yearMonth) ?? 0) + 1)
    if (commit.author) {
      const set = monthContributors.get(yearMonth) ?? new Set()
      set.add(commit.author)
      monthContributors.set(yearMonth, set)
    }
  }

  const first = toUtcYearMonth(sampledFrom)
  const last = toUtcYearMonth(sampledTo)
  const [startYear, startMonth] = first.split("-").map(Number)
  const [endYear, endMonth] = last.split("-").map(Number)

  const strata = []
  let cursorYear = startYear
  let cursorMonth = startMonth
  let gapRunLength = 0

  while (cursorYear < endYear || (cursorYear === endYear && cursorMonth <= endMonth)) {
    const yearMonth = `${String(cursorYear).padStart(4, "0")}-${String(cursorMonth).padStart(2, "0")}`
    const commitCount = monthCounts.get(yearMonth) ?? 0
    const isGap = commitCount === 0

    if (isGap) {
      gapRunLength += 1
    } else {
      gapRunLength = 0
    }

    strata.push({
      yearMonth,
      commitCount,
      contributorCount: monthContributors.get(yearMonth)?.size ?? null,
      isGap,
      gapRunLength: isGap ? gapRunLength : undefined,
      isPeak: false
    })

    cursorMonth += 1
    if (cursorMonth > 12) {
      cursorMonth = 1
      cursorYear += 1
    }
  }

  const peak = strata
    .filter(stratum => stratum.commitCount > 0)
    .reduce((best, current) => (current.commitCount > (best?.commitCount ?? 0) ? current : best), null)
  if (peak) {
    peak.isPeak = true
  }

  const releaseMarkers = (Array.isArray(releases) ? releases : [])
    .filter(release => release.publishedAt)
    .map(release => ({
      ...release,
      yearMonth: toUtcYearMonth(release.publishedAt)
    }))

  return {
    strata,
    activeMonths: strata.filter(stratum => stratum.commitCount > 0).length,
    gapCount: countGapRuns(strata),
    peakMonth: peak?.yearMonth ?? null,
    sampledFrom,
    sampledTo,
    isSampledHistory: true,
    releases: releaseMarkers
  }
}

function toUtcYearMonth(isoDate) {
  const date = new Date(isoDate)
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`
}

function countGapRuns(strata) {
  let count = 0
  let inRun = false
  for (const stratum of strata) {
    if (stratum.isGap) {
      if (!inRun) {
        count += 1
        inRun = true
      }
    } else {
      inRun = false
    }
  }
  return count
}
