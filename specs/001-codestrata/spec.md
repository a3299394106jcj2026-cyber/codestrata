# Feature Specification: 代码考古局 CodeStrata

**Feature Branch**: `001-codestrata`

**Created**: 2026-11-01

**Status**: Implemented

**Input**: User description: "把 GitHub 仓库历史变成可挖掘时间遗址，并提供二次开发考古报告"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - 发掘一个公开仓库 (Priority: P1)

学生或小团队开发者在输入框中提交一个 GitHub 仓库地址或 `owner/repo` 标识。系统从公开 GitHub 数据读取仓库档案、提交节奏、贡献者构成和版本记录，把它转换成可理解的时间地层，并在几分钟内给出“是否适合作为二次开发基线”的第一印象。

**Why this priority**: 这是产品存在的核心理由。用户在选题或寻找参考代码时，需要一个能快速识别许可证、活跃度、体量和维护风险的入口；没有这一步，后续对比和报告都没有价值。

**Independent Test**: 打开应用，输入 `satnaing/shadcn-admin`，点击“发掘”。页面必须出现仓库基础信息、时间地层、风险指标和源数据日期，全程不需要登录。

**Acceptance Scenarios**:

1. **Given** 用户未登录且网络可用, **When** 用户提交一个存在且公开的 GitHub 仓库, **Then** 页面显示仓库名称、所有者、许可证、语言、Stars、Forks、体量、创建时间、最近推送时间、默认分支、根目录结构、近期提交、提交节奏、贡献者构成和版本数量。
2. **Given** 仓库数据已成功读取, **When** 用户点击或拖动时间地层, **Then** 系统按月份展示提交强度、停更断层和版本标记，并显示活跃峰值所在月份。
3. **Given** 结果已生成, **When** 用户查看报告, **Then** 系统给出许可证可用性、维护风险、代码体量评估和适合/谨慎借鉴的结论，并保留 GitHub 来源与检索日期。

---

### User Story 2 - 探索时间地层 (Priority: P2)

用户可以围绕已发掘仓库继续观察项目的生命周期：查看某个月的活跃现场、识别长时间停更形成的断层、对比 Release 前后的开发节奏。该过程帮助用户判断项目是持续生长、偶发爆发，还是已经进入停更状态。

**Why this priority**: 这项体验让抽象统计变成可解释的视觉故事，是《代码考古局》区别于普通仓库 Dashboard 的关键，同时仍服务于二次开发判断。

**Independent Test**: 在已有时间地层上，用户选择“活跃峰值”和某个“停更断层”。页面必须分别显示对应月份或月份区间、提交数量、活跃贡献者和可用版本标记，并保持与基础数据一致。

**Acceptance Scenarios**:

1. **Given** 时间地层已生成, **When** 用户点击提交数量最高的月份, **Then** 页面高亮该月、显示提交数量、活跃贡献者数量和相关版本。
2. **Given** 项目存在连续一个月或更久的无提交月份, **When** 用户查看地层, **Then** 系统把该区间标记为断层并显示停更长度。
3. **Given** 仓库存在版本记录, **When** 用户查看包含 Release 的月份, **Then** 该月地层上出现版本标记，用户可识别开发峰值与版本发布之间的关系。

---

### User Story 3 - 生成考古报告 (Priority: P3)

用户在完成一次发掘后，可以把仓库洞察导出为结构化“二次开发考古报告”，用于课堂展示、团队讨论或 QQ 频道粘贴。报告包含仓库事实、风险结论、可复用建议和明确的数据来源。

**Why this priority**: 只有结论被带走，作品才有传播价值。它把页面体验转化为团队可讨论、可复用的决策材料。

**Independent Test**: 在已生成报告的仓库页点击“导出考古报告”。系统必须生成可复制的纯文本或 Markdown 文本，文本中包含事实区块、风险区块、建议区块、数据来源和检索日期，且不依赖服务器端账号。

**Acceptance Scenarios**:

1. **Given** 当前仓库已有完整洞察, **When** 用户点击导出报告, **Then** 页面生成结构化 Markdown 文本并展示复制按钮。
2. **Given** 用户复制报告, **When** 用户把文本粘贴到其他编辑器或聊天工具, **Then** 报告保持标题、事实、结论和来源结构。
3. **Given** 数据来自离线演示仓库, **When** 用户导出报告, **Then** 报告明确标注“离线演示数据”而不是伪装成实时 GitHub 数据。

---

### User Story 4 - 离线与限流兜底 (Priority: P4)

当 GitHub 请求失败、超出未登录限额或用户在演示环境无网时，系统必须仍能展示完整体验。用户要清楚知道当前是实时数据、本地缓存还是离线演示，并理解下一步操作。

**Why this priority**: 活动现场网络不可控，GitHub 未登录接口有限额。这个兜底保证作品在评审和展示时不会因外部故障变成空白页面，同时保持数据诚实。

**Independent Test**: 在断网或模拟限流状态下重新发掘同一仓库。页面必须显示失败原因、限额状态或离线演示入口，并提供加载内置演示仓库的路径。

**Acceptance Scenarios**:

1. **Given** GitHub 返回请求被拒绝或超限, **When** 页面处理结果, **Then** 显示可读的错误状态、原因和建议，并保留最近一次成功的本地结果。
2. **Given** 用户处于断网状态, **When** 用户选择离线演示仓库, **Then** 页面加载内置示例数据、完成地层展示、风险指标和报告导出，并明确标注“离线演示数据”。
3. **Given** 仓库在缓存有效期内, **When** 用户再次输入同一仓库, **Then** 页面使用本地缓存并标注缓存时间，而不是立即请求新的 API 数据。

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when the repository is private, deleted, renamed, or not a GitHub repository? The system MUST return an actionable not-found or access-denied state.
- What happens when a repository has no commits, one commit, no releases, or thousands of commits? The timeline MUST degrade gracefully without crashing or producing misleading density.
- What happens when GitHub returns no license information? The report MUST say license information is unavailable and classify reuse recommendation as uncertain.
- What happens when more than 100 commits exist? The system MUST summarize from available pages, respect API limits, and state that the insight is based on a bounded sample if full history is not fetched.
- What happens when cached data and the repository's latest pushed time conflict? The interface MUST surface cache time so users can decide whether to refresh.

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

### Functional Requirements

- **FR-001**: System MUST accept a public repository identifier in `owner/repo` form or a GitHub repository URL, validate it at the entry layer, and reject other identifiers with a readable error.
- **FR-002**: System MUST display repository name, owner, a clearly labeled project-purpose summary derived from GitHub description and topics, primary language, license, Stars, Forks, size, creation time, latest push time, default branch, root-level directories and files, and public link after successful discovery.
- **FR-003**: System MUST convert commit history into monthly time strata showing commit intensity, active contributor concentration, recent commit messages, release markers, and inactivity gaps.
- **FR-004**: System MUST show contributor concentration and maintenance risk indicators for the discovered repository.
- **FR-005**: System MUST generate a second-development conclusion that separates verifiable facts from judgment-based recommendations.
- **FR-006**: System MUST export a structured Markdown report including repository facts, timeline insight, risk assessment, reuse recommendation, source repository, data source, and retrieval date.
- **FR-007**: System MUST cache successful repository results locally, label cached results with retrieval time, and allow an explicit refresh action.
- **FR-008**: System MUST expose a built-in offline demo repository for no-network demonstration and label it as demo data.
- **FR-009**: System MUST show GitHub request failures, rate-limit status, and recovery actions; it MUST NOT present failed live requests as empty results.
- **FR-010**: System MUST support responsive layouts for desktop and mobile viewport widths.
- **FR-011**: System MUST preserve upstream repository names, owners, and public links in every displayed and exported result.
- **FR-012**: System MUST NOT require login, store credentials, access private repositories, or distribute repository source code.

### Key Entities *(include if feature involves data)*

- **Repository Profile**: The public identity of a discovered repository, including owner, name, description, language, license, popularity, size, lifecycle dates, and public link.
- **Commit Stratum**: A monthly aggregation of commit activity, active contributor count, inactivity gap status, and position within the repository timeline.
- **Release Marker**: A version event attached to a month or date, representing a public milestone in repository growth.
- **Contributor Profile**: A public contributor and their aggregated contribution count, used to describe maintenance concentration.
- **Archaeology Report**: The exported decision artifact containing facts, timeline insight, risk assessment, reuse suggestions, and data provenance.
- **Data Source Snapshot**: The cached or demo source state, including whether it is live GitHub data, local cache, or offline demo data, plus retrieval time.

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

### Measurable Outcomes

- **SC-001**: A first-time user can discover a public repository and reach a first impression within 15 seconds when network is available.
- **SC-002**: The timeline view renders monthly data for a repository with hundreds of commits without a blank visualization or a frozen interface.
- **SC-003**: The exported report contains repository facts, risk conclusion, reuse recommendation, source repository, data source, and retrieval date in one copyable text.
- **SC-004**: The offline demo flow is fully usable with no network access and is visually distinguishable from live data.
- **SC-005**: During a demonstration session, the application performs no GitHub request for the same repository while a valid local cache exists, unless the user explicitly refreshes.
- **SC-006**: The primary search, timeline interaction, and report copy flows are usable at 390px viewport width without horizontal overflow.

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- Users are students, course teams, and campus developers evaluating public GitHub repositories for second development; they understand basic repository concepts such as commit, license, and release.
- v1 supports public GitHub data only. The target environment may have unstable network and unauthenticated GitHub rate limits, so offline and cached flows are first-class.
- v1 focuses on one repository at a time. Multi-repository comparison, code quality static analysis, login, account synchronization, repository source redistribution, and QQ platform integration are out of scope.
- GitHub rate limits and pagination behavior are external constraints; the product will surface them honestly rather than bypass them.
- The first Chinese product name is “代码考古局”, and the short English name is “CodeStrata”.
