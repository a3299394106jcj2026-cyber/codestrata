# Contract: GitHub Data Access

**Date**: 2026-11-01

This contract defines the v1 boundary between the UI and public GitHub REST data. The implementation MUST keep all network access behind one module. The UI MUST NOT call `fetch` directly.

## Input Contract

### `parseRepositoryInput(input: string): { owner: string; repo: string }`

Accepts either:

1. `owner/repo`
2. `https://github.com/owner/repo`
3. `https://github.com/owner/repo/` with optional trailing path segments

Rules:

- Trim surrounding whitespace.
- Accept only public GitHub repository identifiers.
- Reject empty, malformed, private-prefixed, protocol-relative, non-GitHub host, and non-repository paths.
- Return a normalized `owner/repo`; do not encode credentials, query strings, or fragments.
- Throw a typed input error with a user-facing Chinese message and a machine-readable reason: `EMPTY`, `MALFORMED`, `NON_GITHUB_HOST`, or `NOT_REPOSITORY_PATH`.

## Live Source Requests

All live requests use `https://api.github.com`.

Common requirements:

- Send `Accept: application/vnd.github+json`.
- Send a stable `User-Agent`.
- Do not attach credentials.
- Parse GitHub numeric IDs, ISO timestamps, and nullable fields defensively.
- Treat `403` with a rate-limit header as `RATE_LIMITED`; treat `404` as `NOT_FOUND`; treat network/TLS/timeout failures as `NETWORK`.
- Never retry automatically. Rate-limit and not-found states are user decisions.

### 1. Repository profile

```http
GET /repos/{owner}/{repo}
```

Returns the normalized `RepositoryProfile`.

Required response fields: `full_name`, `owner.login`, `name`, `description`, `language`, `license`, `stargazers_count`, `forks_count`, `size`, `created_at`, `pushed_at`, `html_url`.

Missing `license` is valid and MUST be represented as “许可证信息不可用”.

The profile also exposes `default_branch`, `open_issues_count`, and `topics` for repository orientation.

### 2. Commit history page 1

```http
GET /repos/{owner}/{repo}/commits?per_page=100&page=1
```

Returns an array of sampled commits with:

- commit author date
- GitHub author login when available
- commit SHA
- commit message
- public commit URL

An empty array is valid and means the repository has no commits. The module MUST NOT treat it as an error.

### 3. Repository root contents

```http
GET /repos/{owner}/{repo}/contents?ref={default_branch}
```

Returns a root-level directory and file listing. The app stores only display metadata: name, path, type, size, and public URL. It MUST NOT download file contents.

### 4. Commit history page 2

```http
GET /repos/{owner}/{repo}/commits?per_page=100&page=2
```

Returns a second sampled page when needed. An empty or partial array is valid. The implementation MUST stop here for v1, mark `isSampledHistory=true`, and set the sampled range to the earliest and latest commits actually read.

### 5. Contributors

```http
GET /repos/{owner}/{repo}/contributors?per_page=100&anon=1
```

Returns a contributor snapshot. Required fields are `login`, `contributions`, and `html_url` when present. Anonymous contributors MUST preserve their anonymous nature and not be merged with named accounts.

An empty array is valid and means the contributor report is unavailable.

### 6. Releases

```http
GET /repos/{owner}/{repo}/releases?per_page=100
```

Returns release markers. Required fields are `id`, `name`, `tag_name`, `published_at`, and `html_url` when present.

An empty array is valid and means the repository has no sampled releases.

## Rate-Limit Visibility

The module MUST expose the remaining core-quota value from the `X-RateLimit-Remaining` response header when present. If the value is absent, it MUST report “限额状态不可用” rather than guessing.

The UI MUST show:

- live/cache/offline mode
- cache retrieval time
- remaining quota when available
- explicit “重新发掘” action

## Error Contract

Every failure returned to the UI has:

| Field | Description |
| --- | --- |
| kind | `INPUT`, `NOT_FOUND`, `RATE_LIMITED`, `NETWORK`, `GITHUB_ERROR`, or `OFFLINE_REQUIRED` |
| title | Short Chinese display title |
| detail | One or two sentences explaining what happened |
| action | Next user action, such as retry, view cache, or load demo |
| preservePrevious | Boolean indicating that the UI should keep a previously loaded result |

The module MUST NOT swallow failures or return empty arrays for request errors.

## Cache Contract

`saveSnapshot(snapshot)` stores a versioned snapshot in browser-local storage.

- Cache key: `codestrata:v2:repo:{owner/name}`.
- Snapshot envelope includes `sourceType`, `sourceName`, `fetchedAt`, `schemaVersion`, and `insight`.
- `loadSnapshot(repository)` returns only a matching snapshot.
- A cache hit MUST be converted to `sourceType: "cache"` with its original `fetchedAt`.
- Cache failures MUST be recoverable; a corrupt entry MUST be treated as a miss and removed.

## Offline Demo Contract

The offline dataset is a normal `DataSnapshot` with:

- `sourceType: "offline-demo"`
- `sourceName: "内置离线演示数据"`
- a stable `fetchedAt`
- `schemaVersion`
- a complete `RepositoryInsight`

The UI MUST render the offline dataset with the same code path as live/cache data and MUST label it as demo data. The offline dataset MUST NOT be presented as the real state of any named GitHub repository unless it is a captured historical snapshot explicitly attributed to that repository.
