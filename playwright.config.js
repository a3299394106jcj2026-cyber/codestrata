import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: "codestrata-flows.js",
  timeout: 20_000,
  fullyParallel: false,
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:4175",
    browserName: "chromium",
    headless: true
  },
  webServer: {
    command: "python -m http.server 4175 --bind 127.0.0.1",
    cwd: "./app",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: true,
    timeout: 10_000
  }
})
