import { expect, test } from "@playwright/test"
import { offlineDemoSnapshot } from "../../app/scripts/data/offline-demo.js"

const repositoryProfile = {
  full_name: "demo/strata-kit",
  owner: { login: "demo" },
  name: "strata-kit",
  description: "A deterministic repository fixture.",
  language: "TypeScript",
  license: { name: "MIT License", spdx_id: "MIT", url: "https://api.github.com/licenses/mit" },
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

const commitFixtures = [
  { sha: "a123456789", commit: { author: { date: "2025-01-03T00:00:00Z" }, message: "feat: add first workflow" }, author: { login: "alice" }, html_url: "https://github.com/demo/strata-kit/commit/a123456789" },
  { sha: "b123456789", commit: { author: { date: "2025-03-12T00:00:00Z" }, message: "fix: clarify repository state" }, author: { login: "bob" }, html_url: "https://github.com/demo/strata-kit/commit/b123456789" },
  { sha: "c123456789", commit: { author: { date: "2025-04-20T00:00:00Z" }, message: "docs: prepare release notes" }, author: { login: "alice" }, html_url: "https://github.com/demo/strata-kit/commit/c123456789" }
]

async function mockLiveGitHub(page) {
  await page.route("https://api.github.com/**", async route => {
    const url = new URL(route.request().url())
    let body = []

    if (url.pathname === "/repos/demo/strata-kit") {
      body = repositoryProfile
    } else if (url.pathname.endsWith("/commits") && url.searchParams.get("page") === "1") {
      body = commitFixtures
    } else if (url.pathname.endsWith("/commits")) {
      body = []
    } else if (url.pathname.endsWith("/contents")) {
      body = [
        { name: "src", path: "src", type: "dir", size: 0, html_url: "https://github.com/demo/strata-kit/tree/main/src" },
        { name: "package.json", path: "package.json", type: "file", size: 640, html_url: "https://github.com/demo/strata-kit/blob/main/package.json" }
      ]
    } else if (url.pathname.endsWith("/contributors")) {
      body = [
        { login: "alice", contributions: 8, html_url: "https://github.com/alice" },
        { login: "bob", contributions: 2, html_url: "https://github.com/bob" }
      ]
    } else if (url.pathname.endsWith("/releases")) {
      body = [
        { id: 1, name: "v1.0.0", tag_name: "v1.0.0", published_at: "2025-04-20T00:00:00Z", html_url: "https://github.com/demo/strata-kit/releases/tag/v1.0.0" }
      ]
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-expose-headers": "x-ratelimit-remaining",
        "x-ratelimit-remaining": "42"
      },
      body: JSON.stringify(body)
    })
  })
}

test("offline demo exposes repository facts, selectable strata, and a copyable report", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:4175" })
  await page.goto("/")

  await page.locator("#landing-view [data-demo]").click()
  await expect(page.locator("#workspace-view")).toBeVisible()
  await expect(page.locator("#repo-profile")).toContainText("satnaing/shadcn-admin")
  await expect(page.locator("#repo-profile")).toContainText("这个项目是做什么的")
  await expect(page.locator("#repo-profile")).toContainText("Admin Dashboard UI built with Shadcn and Vite")
  await expect(page.locator("#repo-profile")).toContainText("CodeStrata 判断的是许可证、维护结构")
  await expect(page.locator("#repo-source")).toContainText("内置离线演示数据")
  await expect(page.locator("#repo-files")).toContainText("package.json")
  await expect(page.locator("#repo-files")).toContainText("src")
  await expect(page.locator("#repo-commits")).toContainText("bump @clerk/react")
  await expect(page.locator("#repo-releases")).toContainText("v2.2.1")
  await expect(page.locator(".workspace-nav")).toHaveCount(0)

  await page.locator('.strata__bar[data-year-month="2026-04"]').click()
  await expect(page.locator("#strata-detail")).toContainText("2026-04")
  await expect(page.locator("#strata-detail")).toContainText("61")

  await page.locator('.strata__bar[data-year-month="2026-05"]').click()
  await expect(page.locator("#strata-detail")).toContainText("断层")

  await page.locator("#report-button").click()
  await expect(page.locator("#report-dialog")).toBeVisible()
  await expect(page.locator("#report-content")).toContainText("二次开发考古报告")
  await expect(page.locator("#report-content")).toContainText("内置离线演示数据")
  await expect(page.locator("#report-content")).toContainText("MIT")

  await page.locator("#report-copy").click()
  await expect(page.locator("#copy-feedback")).toContainText("已复制")
})

test("the judgment-method control opens an explanatory dialog", async ({ page }) => {
  await page.goto("/")
  await page.locator("#method-button").click()

  await expect(page.locator("#method-dialog")).toBeVisible()
  await expect(page.locator("#method-dialog")).toContainText("会判断什么")
  await expect(page.locator("#method-dialog")).toContainText("不会判断什么")
  await expect(page.locator("#method-dialog")).toContainText("不执行项目测试")
  await page.locator("#method-close").click()
  await expect(page.locator("#method-dialog")).toBeHidden()
})

test("a not-found repository keeps the landing page and shows an actionable error", async ({ page }) => {
  await page.route("https://api.github.com/**", route => route.fulfill({
    status: 404,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify({ message: "Not Found" })
  }))
  await page.goto("/")
  await page.locator("#repo-input").fill("missing/repository")
  await page.locator("#repo-submit").click()

  await expect(page.locator("#repo-status")).toContainText("仓库不存在")
  await expect(page.locator("#landing-view")).toBeVisible()
  await expect(page.locator("#workspace-view")).toBeHidden()
})

test("a network failure can recover through the labeled offline demo", async ({ page }) => {
  await page.route("https://api.github.com/**", route => route.abort("failed"))
  await page.goto("/")
  await page.locator("#repo-input").fill("demo/strata-kit")
  await page.locator("#repo-submit").click()

  await expect(page.locator("#repo-status")).toContainText("网络不可达")
  await page.locator("#repo-status .status__action").click()
  await expect(page.locator("#workspace-view")).toBeVisible()
  await expect(page.locator("#repo-source")).toContainText("内置离线演示数据")
})

test("a rate-limit response exposes quota recovery instead of an empty result", async ({ page }) => {
  await page.route("https://api.github.com/**", route => route.fulfill({
    status: 403,
    contentType: "application/json",
    headers: {
      "access-control-allow-origin": "*",
      "access-control-expose-headers": "x-ratelimit-remaining",
      "x-ratelimit-remaining": "0"
    },
    body: JSON.stringify({ message: "API rate limit exceeded" })
  }))
  await page.goto("/")
  await page.locator("#repo-input").fill("demo/strata-kit")
  await page.locator("#repo-submit").click()

  await expect(page.locator("#repo-status")).toContainText("GitHub 请求受限")
  await expect(page.locator("#repo-status")).toContainText("本地缓存或离线演示")
  await page.locator("#repo-status .status__action").click()
  await expect(page.locator("#workspace-view")).toBeVisible()
})

test("a cached snapshot is used without a live request", async ({ page }) => {
  let requestCount = 0
  await page.route("https://api.github.com/**", route => {
    requestCount += 1
    return route.abort("failed")
  })
  await page.goto("/")
  await page.evaluate((snapshot) => {
    const cacheKey = "codestrata:v2:repo:satnaing/shadcn-admin"
    localStorage.setItem(cacheKey, JSON.stringify({
      ...snapshot,
      sourceType: "cache",
      sourceName: "本地缓存",
      cacheKey
    }))
  }, offlineDemoSnapshot)

  await page.locator("#repo-input").fill("satnaing/shadcn-admin")
  await page.locator("#repo-submit").click()

  await expect(page.locator("#repo-source")).toContainText("本地缓存")
  await expect(page.locator("#repo-status")).toContainText("使用本地缓存")
  expect(requestCount).toBe(0)
})

test("a mocked live repository reaches the workbench with provenance and quota", async ({ page }) => {
  await mockLiveGitHub(page)
  await page.goto("/")
  await page.locator("#repo-input").fill("demo/strata-kit")
  await page.locator("#repo-submit").click()

  await expect(page.locator("#workspace-view")).toBeVisible()
  await expect(page.locator("#repo-profile")).toContainText("demo/strata-kit")
  await expect(page.locator("#repo-profile")).toContainText("A deterministic repository fixture")
  await expect(page.locator("#repo-profile")).toContainText("dashboard")
  await expect(page.locator("#repo-source")).toContainText("GitHub 实时数据")
  await expect(page.locator("#quota-status")).toContainText("42")
  await expect(page.locator("#repo-files")).toContainText("package.json")
  await expect(page.locator("#repo-commits")).toContainText("docs: prepare release notes")
})

test("mobile demo has no horizontal overflow and keeps core controls visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.locator("#landing-view [data-demo]").click()

  await expect(page.locator("#workspace-view")).toBeVisible()
  await expect(page.locator("#repo-strata")).toBeVisible()
  await expect(page.locator("#report-button")).toBeVisible()

  const dimensions = await page.evaluate(() => ({
    body: document.body.scrollWidth,
    viewport: document.documentElement.clientWidth,
    bodyFont: Number.parseFloat(getComputedStyle(document.querySelector(".repo-purpose__description")).fontSize),
    sectionFont: Number.parseFloat(getComputedStyle(document.querySelector(".panel-heading p")).fontSize)
  }))
  expect(dimensions.body).toBeLessThanOrEqual(dimensions.viewport)
  expect(dimensions.bodyFont).toBeGreaterThanOrEqual(12)
  expect(dimensions.sectionFont).toBeGreaterThanOrEqual(11)
})
