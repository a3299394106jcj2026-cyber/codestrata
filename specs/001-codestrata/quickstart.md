# Quickstart: 代码考古局 CodeStrata

**Date**: 2026-11-01

## Prerequisites

- Node.js 20+ and npm for a static server and browser verification.
- A modern Chromium-based browser.
- Optional internet access for live GitHub verification.

## Start the Application

```powershell
cd app
python -m http.server 4175 --bind 127.0.0.1
```

Open [http://127.0.0.1:4175](http://127.0.0.1:4175).

The final implementation may also support `npm run dev`; this guide is technology-agnostic and only requires any static server.

## Core Validation Scenarios

### Scenario 1: Live repository discovery

1. Open the app with internet access.
2. Enter `satnaing/shadcn-admin`.
3. Click “发掘”.
4. Confirm the repository name, owner, license, Stars, Forks, size, created time, latest push time, timeline, contributor risk, and GitHub attribution are visible.
5. Confirm data source is “GitHub 实时数据” and a retrieval time is shown.

Expected result: the interface reaches a complete insight without login, and the report button becomes available.

### Scenario 2: Timeline exploration

1. On a loaded repository, click the highest commit month.
2. Confirm the month, commit count, active contributor count, and any release marker appear.
3. Hover or click a zero-commit month marked as a gap.
4. Confirm gap length is shown and the visual state is distinct from active months.

Expected result: timeline facts remain consistent with the displayed repository insight.

### Scenario 3: Report export

1. Click “生成考古报告”.
2. Confirm Markdown text contains repository facts, timeline insight, risk, recommendations, source repository, data source, and retrieval date.
3. Click “复制” and paste the text into any editor.

Expected result: copied text keeps the structure and includes provenance.

### Scenario 4: Cache behavior

1. Complete Scenario 1.
2. Reload the page.
3. Re-enter the same repository and submit.
4. Confirm the app uses the cached snapshot, shows “本地缓存” and the original retrieval time, and does not send a new request before an explicit refresh.
5. Click “重新发掘”.
6. Confirm the app performs a live refresh and updates retrieval time.

Expected result: cache time and data-source labels remain honest.

### Scenario 5: Offline demonstration

1. Stop the network or block requests to `api.github.com`.
2. Reload the app.
3. Click the offline demo entry.
4. Confirm the full timeline, repository card, risk, and report export render.
5. Confirm the data source label says “内置离线演示数据” and not live GitHub data.

Expected result: the demo flow is complete and visually distinguishable from live data.

### Scenario 6: Failure handling

1. Enter a nonexistent repository such as `this-owner-should-not-exist/this-repo-should-not-exist`.
2. Submit “发掘”.
3. Confirm a readable not-found state appears and no blank screen is shown.
4. If a previously loaded repository exists, confirm it remains visible when permitted by the error state.

Expected result: failure is actionable, attributable, and does not erase valid context.

### Scenario 7: Responsive layout

1. Open the app at 1440×900.
2. Open developer tools and set viewport to 390×844.
3. Repeat search, timeline interaction, and report copy.

Expected result: no horizontal overflow and no unusable primary controls at mobile width.

## Automated Checks

After implementation:

```powershell
node --test tests/unit/*.test.js
npx --yes --package @playwright/cli playwright-cli open http://127.0.0.1:4175
```

The implementation task list defines the exact commands and expected artifacts. Do not claim a scenario passes unless it has actually been run and observed.
