# Tasks: 代码考古局 CodeStrata

**Input**: Design documents from `/specs/001-codestrata/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/github-data-contract.md](./contracts/github-data-contract.md)

**Tests**: Browser behavior verification is required for user-visible flows. Deterministic unit checks are required for aggregation, risk, cache, and report generation because these are core business logic.

**Organization**: Tasks are grouped by user story so each story can be implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Include exact file paths in descriptions

## Path Conventions

- Application: `app/`
- Unit checks: `tests/unit/`
- Browser verification: `tests/browser/`

## Phase 0: Documentation-First Gate

**Purpose**: Establish the repository README and question contract before any application code exists.

**⚠️ CRITICAL**: No application code task may start until T001 and T002 are complete.

- [x] T001 Create the root README in `README.md`, leading with project purpose, then usage, installation, verification, data source, limits, attribution, and rollback notes
- [x] T002 Create the four-part question template in `docs/question-template.md`, requiring specific title, problem background, minimal reproduction, and expected result for every issue or AI prompt
- [x] T003 Verify both documents exist and satisfy the Documentation-First Gate before recording the gate result in this task list

**Checkpoint**: The app loads from a static server and shows the main search/status/report shells.

---

## Phase 1: Foundational

**Purpose**: Complete shared data and validation infrastructure required by all user stories.

- [x] T004 Implement public repository input parsing with typed errors in `app/scripts/github.js`
- [x] T005 Implement the versioned local cache contract in `app/scripts/cache.js`
- [x] T006 Implement the offline demo snapshot in `app/scripts/data/offline-demo.js`
- [x] T007 Implement the shared status/error contract in `app/scripts/ui/status.js`

**Checkpoint**: Input validation, cache, offline data, and status rendering are ready; user stories can proceed.

---

## Phase 2: User Story 1 - 发掘一个公开仓库 (Priority: P1) 🎯 MVP

**Goal**: Discover a public GitHub repository and render its identity, scale, risk, and provenance.

**Independent Test**: Load the app, submit `satnaing/shadcn-admin`, and confirm repository facts, strata, risk, and GitHub attribution render without login.

### Tests for User Story 1

- [x] T008 [P] [US1] Add unit tests for commit monthly aggregation in `tests/unit/aggregator.test.js`
- [x] T009 [P] [US1] Add unit tests for top-contributor and license risk scoring in `tests/unit/risk.test.js`

### Implementation for User Story 1

- [x] T010 [US1] Implement GitHub REST access for repository, commits, contributors, releases, and quota headers in `app/scripts/github.js`
- [x] T011 [US1] Implement UTC monthly aggregation, peak selection, gap detection, and release attachment in `app/scripts/aggregator.js`
- [x] T012 [US1] Implement license, maintenance concentration, scale, activity, and sample-history risk scoring in `app/scripts/risk.js`
- [x] T013 [US1] Implement repository profile rendering and public upstream attribution in `app/scripts/ui/repository.js`
- [x] T014 [US1] Implement the search submit, loading, cache lookup, live discovery, and refresh flow in `app/scripts/ui/search.js`
- [x] T015 [US1] Implement the minimal timeline data renderer needed for repository discovery in `app/scripts/ui/strata.js`
- [x] T016 [US1] Implement a two-page commit request budget, empty-history handling, and bounded-sample labeling in `app/scripts/github.js`

**Checkpoint**: User Story 1 is independently usable and visible with live data.

---

## Phase 3: User Story 2 - 探索时间地层 (Priority: P2)

**Goal**: Let the user explore active peaks, inactivity gaps, and release milestones in the strata view.

**Independent Test**: On a loaded repository, select a peak and a gap and confirm month, count, contributors, and release facts are consistent with the insight.

### Tests for User Story 2

- [x] T017 [P] [US2] Add unit tests for deterministic peak, gap-run, and release-month attachment in `tests/unit/aggregator.test.js`
- [x] T018 [P] [US2] Add browser checks for peak selection and gap visibility in `tests/browser/codestrata-flows.js`

### Implementation for User Story 2

- [x] T019 [US2] Implement peak, gap, release, and month selection interactions in `app/scripts/ui/strata.js`
- [x] T020 [US2] Implement the selected-month detail panel in `app/scripts/ui/strata.js`
- [x] T021 [US2] Implement timeline responsive density and accessible keyboard selection in `app/scripts/ui/strata.js`
- [x] T022 [US2] Implement strata styles for active, peak, gap, release, and selected states in `app/styles/excavation.css`

**Checkpoint**: User Stories 1 and 2 both work independently.

---

## Phase 4: User Story 3 - 生成考古报告 (Priority: P3)

**Goal**: Export a structured second-development archaeology report with provenance.

**Independent Test**: Generate, copy, and paste a report; confirm facts, risk, recommendations, repository link, source, and retrieval date remain intact.

### Tests for User Story 3

- [x] T023 [P] [US3] Add unit tests for Markdown report generation and provenance in `tests/unit/report.test.js`

### Implementation for User Story 3

- [x] T024 [US3] Implement report generation from `DataSnapshot` in `app/scripts/report.js`
- [x] T025 [US3] Implement report display, clipboard copy, and success/failure feedback in `app/scripts/ui/search.js`
- [x] T026 [US3] Implement report typography and mobile layout in `app/styles/report.css`

**Checkpoint**: Reports are generated, copied, and remain distinguishable by data source.

---

## Phase 5: User Story 4 - 离线与限流兜底 (Priority: P4)

**Goal**: Keep the product usable and honest when GitHub is unreachable or rate-limited.

**Independent Test**: Block GitHub requests, choose the offline demo, and confirm complete, clearly labeled demo behavior; also verify a not-found repository preserves context and shows an actionable error.

### Tests for User Story 4

- [x] T027 [P] [US4] Add unit tests for cache hit conversion, corrupt cache recovery, and offline source labeling in `tests/unit/cache.test.js`
- [x] T028 [P] [US4] Add browser checks for not-found, rate-limit, offline demo, and cache behavior in `tests/browser/codestrata-flows.js`

### Implementation for User Story 4

- [x] T029 [US4] Implement rate-limit, not-found, network, and GitHub error states with recovery actions in `app/scripts/github.js`
- [x] T030 [US4] Implement offline demo entry and demo-source rendering in `app/scripts/ui/status.js`
- [x] T031 [US4] Implement cache-first search and explicit refresh provenance in `app/scripts/cache.js`

**Checkpoint**: Live, cached, offline, and failed states are all explicit and recoverable.

---

## Phase 6: Polish

**Purpose**: Final verification and release readiness.

- [x] T032 Implement responsive review fixes for 390px and 1440px viewports across `app/styles/`
- [x] T033 Verify the complete `quickstart.md` scenarios in `tests/browser/codestrata-flows.js`
- [x] T034 Review the root README against the latest implementation and update usage or limits that changed
- [x] T035 Run all unit checks and browser verification, then record actual evidence in the implementation report

## Phase 7: UI Density and Repository Detail Refinement

- [x] T036 Extend the GitHub data boundary with default branch metadata, root-level contents, and commit messages in `app/scripts/github.js`
- [x] T037 Update the data model and search aggregation to carry repository contents and recent commits in `specs/001-codestrata/data-model.md`, `app/scripts/ui/search.js`
- [x] T038 Render repository structure, recent commits, and recent releases in `app/scripts/ui/repository.js`
- [x] T039 Remove in-page side navigation and expand the workbench into a full-width content layout in `app/index.html`, `app/styles/base.css`
- [x] T040 Increase UI typography, reduce unused vertical space, and preserve desktop/mobile responsiveness in `app/styles/base.css`, `app/styles/excavation.css`, `app/styles/report.css`
- [x] T041 Extend unit and browser checks for root contents, commit details, typography, and no-navigation workbench behavior in `tests/unit/`, `tests/browser/codestrata-flows.js`
- [x] T042 Re-run the quickstart, live GitHub check, and record final density evidence in `specs/001-codestrata/implementation-report.md`
- [x] T043 Add a source-backed project-purpose summary and clarify the scope of the reuse assessment in `app/scripts/ui/repository.js`, `app/styles/base.css`
- [x] T044 Extend unit and browser checks for GitHub topics, project-purpose rendering, and assessment scope copy
- [x] T045 Replace the non-responsive method anchor with an accessible explanation dialog and browser coverage in `app/index.html`, `app/scripts/ui/search.js`, `app/styles/report.css`, `tests/browser/codestrata-flows.js`

---

## Dependencies & Execution Order

### Phase Dependencies

1. Documentation Gate (T001–T003) has no dependencies and blocks all application code.
2. Setup (T004–T007) depends on the Documentation Gate.
3. Foundational (T004–T007) is the shared data and validation layer for all user stories.
4. US1 depends on Foundational.
5. US2 depends on US1's strata renderer.
6. US3 can export from any complete `DataSnapshot`.
7. US4 can be implemented after any story is complete, but is required before event demo.
8. Polish depends on all desired user stories.
3. US1 depends on Foundational.
4. US2 depends on US1's strata renderer.
5. US3 depends on any complete `DataSnapshot`.
6. US4 depends on Foundational and integrates with existing states.
7. Polish depends on all desired user stories.

### User Story Independence

- US1 can be delivered as MVP.
- US2 improves exploration but does not block US3.
- US3 can export from live, cache, or offline snapshots.
- US4 can be implemented after any story is complete, but is required before event demo.

### Parallel Opportunities

- T004–T007 are separate files.
- T008–T009 are separate test files.
- Unit tests can be written before their corresponding implementation tasks.
- Browser scenarios can be built incrementally as each story lands.

---

## Implementation Strategy

### MVP First

1. Complete Setup and Foundational.
2. Complete US1.
3. Validate live discovery with a real public repository.
4. Stop and review before adding more complexity.

### Incremental Delivery

1. US1 provides the core decision view.
2. US2 turns it into the distinctive strata experience.
3. US3 creates the shareable artifact.
4. US4 makes the event demo reliable.
5. Polish validates the complete flow and records evidence.

## Risk Notes

- Unauthenticated GitHub quota is finite; never call APIs on every keystroke.
- Commit history is bounded to two pages for v1 and must be labeled as sampled history.
- Offline demo data must never be mistaken for live GitHub data.
- Clipboard access can fail in insecure contexts; show explicit copy failure feedback.
