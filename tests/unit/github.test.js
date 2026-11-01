import assert from "node:assert/strict"
import test from "node:test"
import { fetchRepositorySnapshot } from "../../app/scripts/github.js"

const profile = {
  owner: { login: "demo" },
  name: "strata-kit",
  full_name: "demo/strata-kit",
  description: "Repository fixture",
  language: "TypeScript",
  license: { key: "mit", name: "MIT License", spdx_id: "MIT", url: "https://api.github.com/licenses/mit" },
  stargazers_count: 120,
  forks_count: 18,
  size: 640,
  created_at: "2024-01-01T00:00:00Z",
  pushed_at: "2025-04-20T00:00:00Z",
  default_branch: "main",
  open_issues_count: 7,
  topics: ["dashboard", "typescript"],
  html_url: "https://github.com/demo/strata-kit"
}

function response(data, remaining = 50) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "x-ratelimit-remaining": String(remaining)
    }
  })
}

test("fetchRepositorySnapshot normalizes root contents, commit details, and quota", async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async url => {
    calls.push(String(url))
    if (url.endsWith("/repos/demo/strata-kit")) return response(profile, 48)
    if (url.includes("/commits?") && url.endsWith("page=1")) {
      return response([
        {
          sha: "abcdef123456",
          html_url: "https://github.com/demo/strata-kit/commit/abcdef123456",
          commit: {
            message: "feat: add repository detail panel\n\nDetailed body",
            author: { date: "2025-01-03T00:00:00Z" }
          },
          author: { login: "alice" }
        }
      ], 47)
    }
    if (url.includes("/contents?")) {
      return response([
        { name: "src", path: "src", type: "dir", size: 0, html_url: "https://github.com/demo/strata-kit/tree/main/src" },
        { name: "package.json", path: "package.json", type: "file", size: 512, html_url: "https://github.com/demo/strata-kit/blob/main/package.json" }
      ], 46)
    }
    if (url.includes("/contributors?")) {
      return response([{ login: "alice", contributions: 8, html_url: "https://github.com/alice" }], 45)
    }
    if (url.includes("/releases?")) {
      return response([{ id: 1, name: "v1", tag_name: "v1.0.0", published_at: "2025-01-03T00:00:00Z", html_url: "https://github.com/demo/strata-kit/releases/tag/v1.0.0" }], 44)
    }
    throw new Error(`Unexpected URL: ${url}`)
  }

  try {
    const snapshot = await fetchRepositorySnapshot({ owner: "demo", repo: "strata-kit" })
    assert.equal(calls.length, 5)
    assert.equal(snapshot.profile.defaultBranch, "main")
    assert.equal(snapshot.profile.openIssues, 7)
    assert.deepEqual(snapshot.profile.topics, ["dashboard", "typescript"])
    assert.deepEqual(snapshot.rootContents.map(item => item.name), ["src", "package.json"])
    assert.equal(snapshot.commits[0].message, "feat: add repository detail panel")
    assert.equal(snapshot.commits[0].htmlUrl, "https://github.com/demo/strata-kit/commit/abcdef123456")
    assert.equal(snapshot.rateLimitRemaining, 44)
    assert.equal(calls.some(url => url.endsWith("page=2")), false)
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("fetchRepositorySnapshot reads a second commit page only when page one is full", async () => {
  const originalFetch = globalThis.fetch
  const calls = []
  const fullPage = Array.from({ length: 100 }, (_, index) => ({
    sha: `sha-${index}`,
    html_url: `https://github.com/demo/strata-kit/commit/sha-${index}`,
    commit: {
      message: `commit ${index}`,
      author: { date: "2025-04-20T00:00:00Z" }
    },
    author: { login: "alice" }
  }))

  globalThis.fetch = async url => {
    calls.push(String(url))
    if (url.endsWith("/repos/demo/strata-kit")) return response(profile)
    if (url.includes("/commits?") && url.endsWith("page=1")) return response(fullPage)
    if (url.includes("/commits?") && url.endsWith("page=2")) return response([])
    if (url.includes("/contents?")) return response([])
    if (url.includes("/contributors?")) return response([])
    if (url.includes("/releases?")) return response([])
    throw new Error(`Unexpected URL: ${url}`)
  }

  try {
    const snapshot = await fetchRepositorySnapshot({ owner: "demo", repo: "strata-kit" })
    assert.equal(calls.length, 6)
    assert.equal(snapshot.commits.length, 100)
    assert.equal(calls.filter(url => url.endsWith("page=2")).length, 1)
  } finally {
    globalThis.fetch = originalFetch
  }
})
