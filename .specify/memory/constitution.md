# CodeStrata Constitution

## Core Principles

### I. Real Data First

The product MUST use public, real-time GitHub repository data as its primary content source. Every insight shown to a user MUST trace to a GitHub API response, a locally cached version of that response, or an explicitly labeled offline demo dataset. Fabricated project statistics MUST NOT be presented as live facts.

### II. Decision, Not Decoration

Every visualization and report MUST answer a practical question about whether a repository is suitable for second development. Visual metaphors, animations, and statistics are subordinate to conclusions about licensing, activity, maintenance risk, codebase scale, and recommended reuse.

### III. Minimal Deterministic Web

The v1 MUST remain a lightweight client-side web application with no account system, backend service, database, or payment flow. Data fetching, caching, computation, and rendering MUST be deterministic enough to reproduce the same repository insight after refreshing within the cache window.

### IV. Sustainable Rate Usage

The product MUST explicitly manage public GitHub API limits through button-triggered requests, local caching, user-visible rate status, and an offline demo repository. It MUST NOT call APIs on every keystroke, prefetch speculative repositories, or obscure rate-limit failures as empty results.

### V. Honest Failure and Attribution

Network failures, rate limits, missing data, and offline demo mode MUST be visible and actionable. Every report MUST retain the source repository, API source, and data retrieval date. The application MUST NOT silently hide missing data or replace an unavailable live result with unlabeled sample data.

## Additional Constraints

- Public repositories are the v1 scope; private repositories and authenticated requests MUST NOT be supported.
- The application MUST NOT upload, mirror, clone, or redistribute repository source code; it may only summarize public metadata.
- Second-development recommendations MUST distinguish licensing facts from judgment-based suggestions.
- The application MUST preserve upstream repository names, owners, and public links when displaying or exporting repository summaries.

## Development Workflow and Quality Gates

1. Documentation-First Gate: before any application code is written, the repository README MUST lead with project purpose and then usage, and the project question template MUST require a specific title, problem background, minimal reproduction, and expected result for every issue or AI prompt.
2. Specification, plan, and task contracts MUST be approved before implementation.
3. Each implementation task MUST define affected files, expected output, verification commands, and rollback scope.
4. User-visible behavior changes MUST be verified in desktop and mobile viewport widths.
5. Live GitHub integration MUST be verified with at least one real public repository and one rate-limit/failure case before release.
6. Every release build MUST load from an empty cache, complete an offline demo flow, and preserve attribution.

## Governance

This constitution is the local source of truth for CodeStrata. Requirements that conflict with these principles MUST be revised before planning or implementation proceeds. Complexity MUST be justified against the five principles and recorded in the implementation plan. Amendments require a documented rationale, version bump, and review.

**Version**: 1.1.0 | **Ratified**: 2026-11-01 | **Last Amended**: 2026-11-01

