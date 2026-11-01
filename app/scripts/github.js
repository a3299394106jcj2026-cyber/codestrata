const GITHUB_API_HOST = "https://api.github.com"

const REQUEST_HEADERS = {
  Accept: "application/vnd.github+json",
  "User-Agent": "CodeStrata/1.0"
}

export class RepositoryInputError extends Error {
  constructor(kind, title, detail) {
    super(detail)
    this.name = "RepositoryInputError"
    this.kind = kind
    this.title = title
    this.detail = detail
  }
}

export class GitHubRequestError extends Error {
  constructor(kind, title, detail, action, preservePrevious) {
    super(detail)
    this.name = "GitHubRequestError"
    this.kind = kind
    this.title = title
    this.detail = detail
    this.action = action
    this.preservePrevious = preservePrevious
  }
}

export function parseRepositoryInput(input) {
  const trimmed = typeof input === "string" ? input.trim() : ""
  if (!trimmed) {
    throw new RepositoryInputError("EMPTY", "请输入仓库", "请输入 owner/repo 或 GitHub 仓库地址。")
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const url = new URL(trimmed)
    if (url.hostname !== "github.com" && url.hostname !== "www.github.com") {
      throw new RepositoryInputError("NON_GITHUB_HOST", "不是 GitHub 地址", "目前只支持 github.com 上的公开仓库。")
    }
    const segments = url.pathname.split("/").filter(Boolean)
    if (segments.length < 2) {
      throw new RepositoryInputError("NOT_REPOSITORY_PATH", "地址不是仓库", "GitHub 地址至少包含 owner 和 repo。")
    }
    return normalizeRepository(segments[0], segments[1])
  }

  const slashCount = trimmed.split("/").length - 1
  if (slashCount !== 1) {
    throw new RepositoryInputError("MALFORMED", "仓库格式不正确", "请使用 owner/repo 格式。")
  }

  const [owner, repo] = trimmed.split("/")
  return normalizeRepository(owner, repo)
}

function normalizeRepository(owner, repo) {
  const cleanOwner = owner.trim()
  const cleanRepo = repo.trim().replace(/\.git$/, "")
  if (!cleanOwner || !cleanRepo) {
    throw new RepositoryInputError("MALFORMED", "仓库格式不正确", "owner 和 repo 不能为空。")
  }
  return { owner: cleanOwner, repo: cleanRepo }
}

function requireOk(response) {
  if (response.ok) return response

  if (response.status === 404) {
    return Promise.reject(new GitHubRequestError(
      "NOT_FOUND",
      "仓库不存在",
      "GitHub 没有找到这个公开仓库，请确认 owner/repo。",
      "检查仓库地址后重试。",
      true
    ))
  }

  if (response.status === 429 || (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0")) {
    return Promise.reject(new GitHubRequestError(
      "RATE_LIMITED",
      "GitHub 请求受限",
      "未登录 GitHub API 达到限额或被拒绝，请稍后重试。",
      "使用本地缓存或离线演示。",
      true
    ))
  }

  if (response.status === 403) {
    return Promise.reject(new GitHubRequestError(
      "GITHUB_ERROR",
      "GitHub 拒绝访问",
      "GitHub 拒绝了本次公开数据请求，但没有返回限额耗尽状态。",
      "稍后重试，或使用离线演示。",
      true
    ))
  }

  return Promise.reject(new GitHubRequestError(
    "GITHUB_ERROR",
    "GitHub 返回异常",
    `GitHub 返回状态 ${response.status}，暂时无法完成发掘。`,
    "稍后重试。",
    true
  ))
}

async function requestJson(url, { allowEmptyRepository = false, allowNotFoundAsEmpty = false } = {}) {
  let response
  try {
    response = await fetch(url, { headers: REQUEST_HEADERS })
  } catch (error) {
    throw new GitHubRequestError(
      "NETWORK",
      "网络不可达",
      "无法连接 GitHub API，请检查网络或使用离线演示。",
      "加载离线演示数据。",
      true
    )
  }
  if (allowEmptyRepository && response.status === 409) {
    return { data: [], rateLimitRemaining: readRateLimitRemaining(response.headers.get("x-ratelimit-remaining")) }
  }
  if (allowNotFoundAsEmpty && response.status === 404) {
    return { data: [], rateLimitRemaining: readRateLimitRemaining(response.headers.get("x-ratelimit-remaining")) }
  }
  await requireOk(response)
  try {
    return {
      data: await response.json(),
      rateLimitRemaining: readRateLimitRemaining(response.headers.get("x-ratelimit-remaining"))
    }
  } catch (error) {
    throw new GitHubRequestError(
      "GITHUB_ERROR",
      "GitHub 数据格式异常",
      "GitHub 返回了无法解析的数据，暂时不能完成发掘。",
      "稍后重试。",
      true
    )
  }
}

function normalizeLicense(license) {
  if (!license || license.key === "other") {
    return null
  }
  return {
    name: license.name,
    spdx: license.spdx_id,
    url: license.url
  }
}

function normalizeContributor(contributor) {
  return {
    login: contributor.login ?? null,
    contributions: contributor.contributions,
    htmlUrl: contributor.html_url ?? null
  }
}

function normalizeRelease(release) {
  return {
    id: String(release.id),
    name: release.name,
    tagName: release.tag_name,
    publishedAt: release.published_at,
    htmlUrl: release.html_url
  }
}

function normalizeCommit(commit) {
  return {
    sha: commit.sha,
    date: commit.commit.author.date,
    author: commit.author?.login ?? null,
    message: commit.commit.message?.split(/\r?\n/, 1)[0] ?? "无提交说明",
    htmlUrl: commit.html_url ?? null
  }
}

function normalizeRootContent(entry) {
  return {
    name: entry.name,
    path: entry.path,
    type: entry.type === "dir" ? "dir" : "file",
    size: Number.isFinite(entry.size) ? entry.size : null,
    htmlUrl: entry.html_url
  }
}

async function fetchCommitPage(owner, repo, page) {
  const result = await requestJson(
    `${GITHUB_API_HOST}/repos/${owner}/${repo}/commits?per_page=100&page=${page}`,
    { allowEmptyRepository: true }
  )
  return {
    commits: Array.isArray(result.data) ? result.data.map(normalizeCommit) : [],
    rateLimitRemaining: result.rateLimitRemaining
  }
}

async function fetchRepositoryRootContents(owner, repo, branch) {
  const result = await requestJson(
    `${GITHUB_API_HOST}/repos/${owner}/${repo}/contents?ref=${encodeURIComponent(branch)}`,
    { allowNotFoundAsEmpty: true }
  )
  return {
    contents: Array.isArray(result.data) ? result.data.map(normalizeRootContent) : [],
    rateLimitRemaining: result.rateLimitRemaining
  }
}

export async function fetchRepositorySnapshot({ owner, repo }) {
  const [profile, commitsPage1, contributors, releases] = await Promise.all([
    requestJson(`${GITHUB_API_HOST}/repos/${owner}/${repo}`),
    fetchCommitPage(owner, repo, 1),
    requestJson(`${GITHUB_API_HOST}/repos/${owner}/${repo}/contributors?per_page=100&anon=1`),
    requestJson(`${GITHUB_API_HOST}/repos/${owner}/${repo}/releases?per_page=100`)
  ])
  const rootContents = await fetchRepositoryRootContents(owner, repo, profile.data.default_branch ?? "main")
  const commitsPage2 = commitsPage1.commits.length === 100
    ? await fetchCommitPage(owner, repo, 2)
    : { commits: [], rateLimitRemaining: null }

  const commits = [...commitsPage1.commits, ...commitsPage2.commits]
  const remainingValues = [
    profile.rateLimitRemaining,
    commitsPage1.rateLimitRemaining,
    commitsPage2.rateLimitRemaining,
    rootContents.rateLimitRemaining,
    contributors.rateLimitRemaining,
    releases.rateLimitRemaining
  ].filter(Number.isFinite)
  const rateLimitRemaining = remainingValues.length > 0 ? Math.min(...remainingValues) : null

  return {
    profile: {
      owner: profile.data.owner.login,
      name: profile.data.name,
      fullName: profile.data.full_name,
      description: profile.data.description,
      language: profile.data.language,
      license: normalizeLicense(profile.data.license),
      stars: profile.data.stargazers_count,
      forks: profile.data.forks_count,
      sizeKb: profile.data.size,
      createdAt: profile.data.created_at,
      pushedAt: profile.data.pushed_at,
      defaultBranch: profile.data.default_branch,
      openIssues: profile.data.open_issues_count,
      topics: Array.isArray(profile.data.topics) ? profile.data.topics : [],
      htmlUrl: profile.data.html_url
    },
    commits,
    rootContents: rootContents.contents,
    contributors: Array.isArray(contributors.data) ? contributors.data.map(normalizeContributor) : [],
    releases: Array.isArray(releases.data) ? releases.data.map(normalizeRelease) : [],
    rateLimitRemaining
  }
}

export function readRateLimitRemaining(headerValue) {
  const parsed = Number.parseInt(headerValue, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export async function fetchRepositoryInsight(input) {
  const { owner, repo } = parseRepositoryInput(input)
  return fetchRepositorySnapshot({ owner, repo })
}
