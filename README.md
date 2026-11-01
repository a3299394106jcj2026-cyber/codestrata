# 代码考古局 CodeStrata

## 项目用途

CodeStrata 面向寻找课程项目、比赛参考和小型团队技术基线的开发者。输入一个公开 GitHub 仓库后，它会读取许可证、Stars、Forks、提交记录、贡献者和 Release，把项目历史整理成可探索的“时间地层”，并生成一份带数据来源的二次开发考古报告。

首页使用“时间遗址”呈现代码考古概念；完成检索后进入“开发者工作台”，集中查看仓库事实、活跃峰、停更断层、维护风险和复用建议。

## 使用方式

### 启动

应用是纯静态站点，不需要后端。仓库根目录执行：

```powershell
cd app
python -m http.server 4175 --bind 127.0.0.1
```

打开 [http://127.0.0.1:4175](http://127.0.0.1:4175)。

### 基本流程

1. 在顶部输入 `owner/repo` 或 GitHub 仓库地址并点击“开始发掘”。
2. 在工作台查看仓库档案、月度时间地层和贡献者结构。
3. 点击地层柱面读取当月提交、贡献者和 Release 证据。
4. 点击“生成考古报告”，复制包含事实、风险、建议和来源的 Markdown。
5. 网络不可用或需要稳定展示时，点击“离线样本”加载明确标注的历史快照。

### 提问规范

提交 issue 或向 AI 请求改动前，请使用 [docs/question-template.md](docs/question-template.md)。每个问题必须包含具体标题、问题背景、最小复现和预期结果。

## 数据来源与限制

- 只读取公开 GitHub 元数据，不需要登录，不访问私有仓库，不下载或分发仓库源码。
- 实时检索最多请求仓库档案、提交样本、根目录结构、贡献者和 Release，共 6 次请求；第二页提交只有在第一页装满时才读取。
- 提交历史按 UTC 月聚合；界面会明确标注“有界提交样本”，避免把部分历史写成完整历史。
- 未登录 GitHub API 存在每小时限额，界面会显示剩余额度和失败原因。
- 离线演示使用 2026-11-01 捕获的历史快照，并始终标注“内置离线演示数据”。
- 二次开发建议属于工程判断，不等同于许可证法律意见。

## 开发与验证

安装开发和浏览器验证依赖：

```powershell
npm install
npx playwright install chromium
```

运行单元检查：

```powershell
npm run test:unit
```

运行浏览器流程验证：

```powershell
npm run test:browser
```

运行全部检查：

```powershell
npm test
```

浏览器验证覆盖仓库根目录、近期提交、Release、地层峰值与断层选择、报告复制、404、网络失败、GitHub 限流、缓存优先，以及 390px 和 720px 布局。

## 项目结构

```text
app/
├── index.html
├── styles/
│   ├── base.css
│   ├── excavation.css
│   └── report.css
└── scripts/
    ├── main.js
    ├── github.js
    ├── aggregator.js
    ├── risk.js
    ├── cache.js
    ├── report.js
    ├── ui/
    └── data/
specs/001-codestrata/     # Spec Kit 规格、计划、任务与验证证据
tests/unit/               # 纯逻辑检查
tests/browser/            # Playwright 用户流程检查
```

## 归属与回滚

- 所有结果保留上游仓库所有者、名称和公开链接。
- UI 参考 Apple HIG、GitHub Primer、Linear 和 Stripe 的公开界面原则；未整仓导入其代码。
- 回滚时恢复最近一次通过验证的代码版本，并重新运行 `npm test`。本地缓存可通过浏览器站点数据清除；它不包含源码或凭据。

## 许可证

项目采用 MIT License，详见 [LICENSE](LICENSE)。
