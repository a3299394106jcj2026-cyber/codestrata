# Research: 代码考古局 CodeStrata

**Date**: 2026-11-01

## Decisions

### Decision 1: Public GitHub REST API as the live source

**Decision**: Use unauthenticated public GitHub REST endpoints for repository metadata, commits, contributors, and releases.

**Rationale**: The endpoints support CORS, return the exact public facts needed for licensing, activity, contributor concentration, scale, and release cadence, and require no backend, account, or key.

**Alternatives considered**:

- GitHub GraphQL API: rejected for v1 because unauthenticated browser use has no practical quota and authentication violates the v1 no-login scope.
- GitHub search/trending pages: rejected because scraping is fragile and provides less precise lifecycle data.
- GitCode/AtomGit: rejected for v1 because the idea is GitHub archaeology and the API contracts differ.

### Decision 2: Six-request budget per repository discovery

**Decision**: A normal discovery session may use up to six GitHub REST requests: repository profile, first commit page, root contents, contributors, releases, and a second commit page only when the first page is full.

**Rationale**: The first commit page gives current activity. Root contents let users understand what is actually inside a repository, while contributors and releases complete the maintenance and milestone view. The second page is optional, keeps the timeline useful for active projects, and the hard ceiling remains predictable under the unauthenticated core limit.

**Alternatives considered**:

- Fetch all commit pages: rejected because large repositories consume the hourly quota and make the demo unpredictable.
- No second page: rejected because one page may cover too short a period to show a meaningful strata shape.
- Authentication tokens: rejected because v1 forbids credential storage and login.
- More than six requests: rejected because root structure and a bounded second commit page provide enough decision value without spending a larger share of the hourly quota.

### Decision 3: Monthly aggregation and gap detection

**Decision**: Aggregate commits into calendar months based on the UTC commit date. A gap is a consecutive period with zero commits, starting at one month. A peak is the month with the highest commit count. Releases are attached to their calendar month.

**Rationale**: Calendar-month buckets make the strata intuitive and deterministic. UTC keeps the same result across client time zones. Monthly gaps are more useful for second-development judgment than daily noise.

**Alternatives considered**:

- Daily buckets: rejected because hundreds of bars are hard to interpret and disclose little incremental value.
- Week-based buckets: rejected because week boundary conventions add nonessential complexity.
- Contributors per commit: rejected for v1 because the API response and commit volume can exceed the request budget.

### Decision 4: Local cache with visible provenance

**Decision**: Store successful repository snapshots in browser `localStorage` under a versioned key namespace. Cache time is displayed, and refresh is always explicit.

**Rationale**: Event networks and API limits require a deterministic demo path. A visible cache state preserves honesty while preventing accidental quota waste.

**Alternatives considered**:

- IndexedDB: rejected for v1 because the data volume is small and localStorage is simpler.
- Memory-only cache: rejected because refreshing the page during a demo would lose useful state.
- Automatic background refresh: rejected because it hides data provenance and violates rate discipline.

### Decision 5: Static frontend with pure data modules

**Decision**: Keep the v1 as a static frontend. Put aggregation, risk scoring, caching, and report generation in pure ES modules so unit checks run without a browser, while GitHub access remains isolated behind one module.

**Rationale**: This is the simplest structure that allows deterministic tests, easy deployment, and future bundling. It also avoids importing a heavyweight admin template just to show one product idea.

**Alternatives considered**:

- Full shadcn-admin integration: rejected because it adds Clerk, routing, and many dependencies unrelated to CodeStrata.
- Vue/React scaffold: rejected for v1 because no page routing or complex component state is required yet.
- Server-side API proxy: rejected because it adds deployment cost and no v1 requirement needs it.

## Open Items

None. The implementation plan can proceed.
