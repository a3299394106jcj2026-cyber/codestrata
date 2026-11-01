# Implementation Plan: 代码考古局 CodeStrata

**Branch**: `001-codestrata` | **Date**: 2026-11-01 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-codestrata/spec.md`

**Note**: This template is filled in by the `$speckit-plan` command; its definition describes the execution workflow.

## Summary

Build a lightweight client-side web application that turns a public GitHub repository's metadata and commit history into an explorable “time strata” view and exports a practical second-development archaeology report. The v1 uses public GitHub REST data, browser-local caching, and a built-in offline demo repository. The user-facing value is fast, honest insight into licensing, activity, maintenance risk, scale, and recommended reuse.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: JavaScript ES2022 for application logic; HTML5 and CSS3 for presentation. A bundler is optional for v1 because the application can remain a static web project.

**Primary Dependencies**: Browser Fetch API for public GitHub REST calls; browser `localStorage` for cache; optional MIT-licensed frontend libraries if a build step is chosen. Upstream shadcn-admin may be used as a reference but SHOULD NOT be wholesale imported.

**Storage**: Browser `localStorage` only for repository cache and report drafts; no backend, database, account, or credentials.

**Testing**: Browser behavior verification with Playwright for core flows; deterministic JavaScript unit checks for data aggregation, risk scoring, cache behavior, and Markdown report generation.

**Target Platform**: Modern desktop and mobile browsers; primary demo viewports are 1440px desktop and 390px mobile.

**Project Type**: Static frontend web application.

**Performance Goals**: Initial page load under 2 seconds on ordinary campus Wi-Fi; timeline interaction remains smooth with hundreds of monthly buckets; no more than six GitHub requests for one repository discovery session.

**Constraints**: Unauthenticated GitHub rate limits, unstable event-site network, no private data, no source redistribution, and no backend dependency.

**Scale/Scope**: One main search/excavation screen, one detail/timeline screen, one report/export surface, and one offline demo dataset. The shadcn-admin offline demo uses a four-page commit snapshot (323 commits, 2024-01 through 2026-06) captured during planning.

## Constitution Check

| Principle | Result | Evidence / Design Response |
| --- | --- | --- |
| I. Real Data First | PASS | Public GitHub REST data is the live source; a clearly labeled demo dataset is the only fallback. |
| II. Decision, Not Decoration | PASS | Timeline and report expose license, activity, contributor concentration, scale, and reuse conclusions. |
| III. Minimal Deterministic Web | PASS | Client-side only; no account, backend, database, or server state. |
| IV. Sustainable Rate Usage | PASS | Button-triggered discovery, local cache, visible cache/rate state, and a six-request budget per repository. |
| V. Honest Failure and Attribution | PASS | Failures, rate limits, cache time, demo mode, and upstream attribution are first-class UI states. |
| Documentation-First Gate (workflow v1.1.0) | PASS | Root README and the four-part question template are Phase 0 tasks T001–T002; no application code starts before they exist. |
| Repository Content Budget (plan v1.3.0) | PASS | Live fetch reads one commit page plus root contents, and conditionally reads a second commit page only when the first page is full; the hard ceiling is six requests. |

## Project Structure

### Approved UI Direction

The user selected a hybrid of two evaluated directions on 2026-11-01:

- The initial state uses the **Museum Wall** direction: a warm editorial introduction with a single stratigraphic exhibit and search.
- Once repository data is ready, the interface switches to the **Developer Workbench** direction: compact navigation, repository facts, a selectable monthly strata chart, and an evidence inspector.

This choice changes presentation and interaction composition only. It does not alter the static architecture, data contracts, cache model, or five-request budget.

### Documentation (this feature)

```text
specs/001-codestrata/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── github-data-contract.md
├── checklists/
│   └── requirements.md
└── tasks.md
```

```text
README.md                     # repository root; purpose first, usage second (Documentation-First Gate)
docs/
└── question-template.md      # four-part question spec for issues and AI prompts
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
app/
├── index.html
├── styles/
│   ├── base.css
│   ├── excavation.css
│   └── report.css
├── scripts/
│   ├── main.js
│   ├── config.js
│   ├── github.js
│   ├── aggregator.js
│   ├── risk.js
│   ├── cache.js
│   ├── report.js
│   ├── ui/
│   │   ├── search.js
│   │   ├── strata.js
│   │   ├── repository.js
│   │   └── status.js
│   └── data/
│       └── offline-demo.js
└── assets/
    └── favicon.svg

tests/
├── unit/
│   ├── aggregator.test.js
│   ├── risk.test.js
│   ├── cache.test.js
│   └── report.test.js
└── browser/
    └── codestrata-flows.js
```

**Structure Decision**: Single static frontend project under `app/` with separate pure logic modules in `scripts/`. The UI imports `aggregator`, `risk`, `cache`, and `report` as deterministic modules; GitHub access is isolated in `github.js`; offline data is isolated in `data/offline-demo.js`.

## Complexity Tracking

No violations.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

