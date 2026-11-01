# Implementation Report: 代码考古局 CodeStrata

**Date**: 2026-11-01  
**Feature**: `001-codestrata`  
**Status**: Complete

## Delivered

- Approved hybrid UI: Museum Wall landing state and Developer Workbench result state.
- Public GitHub repository discovery with a five-request budget.
- Repository profile, contributor structure, risk assessment, and reuse conclusion.
- Source-backed project-purpose summary using the GitHub description and public topics.
- Root-level repository contents, recent commit messages, and release records.
- Selectable UTC monthly strata with peak, gap, Release, mouse, and keyboard interaction.
- Cache-first discovery with explicit live refresh and provenance labels.
- Markdown archaeology report with provenance and copy feedback.
- Built-in offline snapshot with an explicit demo label.
- Explicit not-found, network, rate-limit, and GitHub-error states.
- Responsive layouts verified at 1440px and 390px widths.

## Verification Evidence

### Unit checks

Command:

```powershell
npm test
```

Result:

- Unit: 16 passed, 0 failed.
- Browser: 8 passed, 0 failed.

Covered behavior:

- Deterministic peak, gap-run, and Release-month aggregation.
- Risk scoring.
- Cache hit, corrupt cache recovery, and schema rejection.
- Markdown report structure and provenance.
- Root contents, recent commit details, and conditional second-page commit budget.
- Offline demo, peak/gap selection, report copy, 404, network failure, rate limit, cache-first behavior, mobile overflow, and no in-page navigation.

### Real GitHub check

Repository: `satnaing/shadcn-admin`

Observed on 2026-11-01:

- Workbench loaded with `GitHub 实时数据`.
- Root contents, recent commit messages, and releases rendered from the live API.
- Remaining unauthenticated quota was displayed as 4 after the verification session.
- Repository data rendered without login.

The local host has a broken system proxy. The live browser check therefore launched Chromium with direct networking so the application's live path could be exercised. In normal use, proxy failures remain visible and provide the offline demo recovery path.

### Multi-repository live check

Verified through the running application on 2026-11-01:

| Repository | Result | Root entries | Recent commits | Releases | Observed time |
| --- | --- | ---: | ---: | ---: | ---: |
| `tinyhttp/tinyhttp` | Success | 26 | 8 | 6 | 2.4s |
| `shadcn-ui/ui` | Success | 30 | 8 | 6 | 3.8s |
| `vuejs/vue-cli` | Success; stale activity detected | 19 | 8 | 6 | 3.6s |
| `golang/go` | Success | 16 | 8 | 0 | 2.7s |

The test harness used the local authenticated GitHub CLI credential to avoid exhausting the browser's unauthenticated hourly quota. No credential was written to the application or repository.

### Visual checks

- Desktop landing: 1440px.
- Desktop live workbench: 1440px.
- Tablet workbench: 720px.
- Mobile offline workbench: 390px.
- No horizontal overflow in the mobile browser check.
- Primary button contrast: 5.61:1.
- Body text contrast: 13.83:1.
- Muted text on paper: 4.64:1 or higher after final adjustment.

## Final UI Refinement

- Removed the in-page sidebar whose actions all targeted sections of the same report.
- Expanded the workbench to the full available width and moved risk/recommendation content into the main reading flow.
- Added a root directory/file grid, eight recent commit messages, and six latest release records.
- Raised body and supporting text sizes from the previous 7–10px range to an 11–14px range, with primary descriptions at 14px.
- Added an explicit assessment-scope note so users can distinguish repository purpose from the secondary-development suitability judgment.
- Replaced the non-responsive judgment-method anchor with an accessible modal that explains assessed and non-assessed dimensions.
- Archived cache schema updated to `v2` so older snapshots without repository structure are not rendered as incomplete new results.

## UI Direction Evidence

Reference patterns inspected on 2026-11-01:

- Apple Human Interface Guidelines, Materials.
- GitHub Primer.
- GitHub repository layouts.
- Linear.
- Stripe.

No upstream product code or source assets were imported wholesale.

## Known Boundaries

- Live commit history is intentionally limited to two pages and is labeled as sampled.
- Contributor concentration is computed from the returned public contributor snapshot.
- Recommendations are engineering judgments, not legal advice.
- The offline dataset is a captured historical snapshot and never presented as live data.
