---
name: github-api-reference
description: >-
  权威 GitHub API 参考技能（REST + GraphQL）：提供经过校验的最新端点/参数/认证/分页/限流/API 版本约定，
  以及不可逆操作的安全规则，让 Agent 参考实现而非凭记忆臆造。任何涉及读取或修改 GitHub 数据的任务
  （issues、PR、repos、contents、releases、actions/workflows、search、GraphQL 等）都应先参考本技能：
  先确认端点、参数、认证与 API 版本，预估分页与限流；对不可逆/破坏性操作（DELETE、force、转移、
  删除包/发布、覆盖密钥与 secret 等）先读后写、显式与用户确认后再执行。
  提到 GitHub API、gh api、REST 端点、GraphQL 查询、workflow/issue/PR/action/release 数据，
  或想避免 API 乱猜、多次失败或误操作时触发。先读 SKILL.md 与 references/ 再动手，禁止只凭记忆臆造端点。
---

# GitHub API Reference（REST + GraphQL）

> 目标：让 Agent 用**权威、当前**的 GitHub API 知识解决问题，避免猜端点、猜参数、重复失败或造成不可逆错误。
> 本技能与实时官方文档配套使用，关键不确定点一律回查到 [REST docs](https://docs.github.com/rest) / [GraphQL docs](https://docs.github.com/graphql)。

## 何时使用（触发）
- 任何读取/查询 GitHub 数据的任务（issues、pull requests、repos、contents、releases、actions、search、commit、用户/组织…）。
- 任何**修改/写入** GitHub 数据的任务（创建/编辑/关闭 issue、PR review、合并、推送、创建 release、触发 workflow、编辑文件…）。
- 需要 GraphQL 做跨实体/嵌套/自定义字段查询时。
- 用户抱怨过 API 猜测、超时、4xx/5xx 反复失败、或担心误删/误改时。

不用本技能：普通问答、编程无关内容；GitHub 网页操作。

## 核心原则（为什么）
1. **先参考、后调用** —— 端点/参数以官方文档为准；不确定就用本技能查表，必要时抓官方 OpenAPI/文档页确认字段。
2. **默认只读** —— 先 GET 看清现状，再设计写操作；破坏性操作必须先让用户同意。
3. **结构化调用** —— 用规范的 gh 包装（如 cordis-plugin-github 的 github_api/github_graphql）或 child_process 参数数组，不经手写 shell 命令拼接引号。
4. **处理状态码** —— 403=权限/限流，404=不存在（也可能是私有或路径错），422=校验失败，409=冲突，429=限流需退避。不盲目重试 5xx。

## 决策：REST 还是 GraphQL

| 场景 | 用 REST | 用 GraphQL |
| --- | --- | --- |
| 单个实体 CRUD、标准字段 | ✅ | |
| 上传/下载（contents、release assets） | ✅ | |
| 订阅 webhook、actions、codespaces | ✅ | |
| 跨实体/N 层嵌套一次取回 | | ✅ |
| 只要少量字段、避免 over-fetch | | ✅ |
| 连接分页/聚合（仓库+最新release+star 数…） | | ✅ |
| 精确按需选字段、类型安全 | | ✅ |

## 认证与请求基础
- **token 用途**：读公共数据可匿名，但更稳是带 token（GitHub 主限流从 60→用户 5000/时）。
- **Authorization 头**：`Authorization: Bearer <token>` 或 `token <token>`（gh CLI 自动处理）。
- **API 版本头**：`X-GitHub-Api-Version: 2026-03-10`（当前最新版）；不带头则默认 `2022-11-28`（旧版行为，字段可能不同）——务必显式带最新版头；无效版本返回 400/410。
- **Accept 头**：默认 `application/vnd.github+json`；raw 文件用 `application/vnd.github.raw+json`。
- **User-Agent**：GitHub 要求携带自定义 UA，缺省会 403。
- **Base URL**：`https://api.github.com`；企业版为 `https://HOST/api/v3`（或 /graphql）。
- **路径**：`repos/{owner}/{repo}/...`，`{owner}/{repo}` 用仓库全名；URL 路径段需 percent-encode。
- gh CLI：`gh api <path> [--method M] [-f k=v] [-F k=json] [-H header] [--paginate] [--input file]`；GraphQL 用 `gh api graphql -f query=...` 或 POST body。

## 分页约定
- **offset 分页**：`per_page`（1–100，默认 30） + `page`（从 1 起）。适合 issues/commits/releases 等绝大多数列表。
- **Link 头**：响应 `Link: <...page=2>; rel="next"` —— 规范做法是逐页跟随 rel=next，而不是死循环。
- **cursor 分页**（个别端点）：用游标参数，见具体端点文档；search 仍是 offset 分页。
- **GraphQL 分页**：连接对象 `edges { node } pageInfo { hasNextPage endCursor }`；用 `first: N`（最多 100）取，cursor 翻页。
- **上限**：写工具时设 maxPages/per_page 上限防失控；截断要提示用户，别把截断结果当完整。

## 限流约定
- **主限流 core**：未认证 60/时，认证 5000/时（按用户；GitHub App 安装 token 配额另计，见官方文档）。响应头 `X-RateLimit-Limit/-Remaining/-Reset`。
- **search**：未认证 10/分，认证 30/分（search code 端点认证后仍限 10/分且必须认证）；`GET /rate_limit` 可查各资源配额。
- **GraphQL**：独立点数配额（认证用户 5,000 点/时），与 REST core 分开计算。
- **429/403 处理**：读 `Retry-After` / `X-RateLimit-Reset`（epoch 秒），指数退避；不要并发打满；写操作在限流边缘更要慢。

## 安全规则（不可逆/破坏性操作）
> 详见 references/safety.md。核心：下列操作**必须先 GET 确认目标 → 向用户说明影响并获确认 → 才执行**，绝不自动批量执行。
- 删除类：DELETE issues/comments/repos/packages/gists/releases/workflow-run 的日志与关库、label、milestone、成员…
- 覆盖类：force push、转移仓库、覆盖已存在 secret/env、重新发布同版本、覆盖 release asset。
- 修改类：改默认分支、改可见性、改 owner/权限、close 大量 issue/PR。
- 发布/清理：npm/github 包删除、release 删除（影响依赖）、workflow 禁用。
- 失败即停：无幂等保证的写操作不要盲目重试；429/5xx 先退避；保持仓库状态可审计（可追溯的 commit/releases）。

## 常用端点速查
> 完整分域表见 references/rest-core.md；GraphQL 见 references/graphql.md。
- `repos/{o}/{r}/issues` GET/POST；`/issues/{n}` GET/PATCH；`/issues/{n}/comments`。
- `repos/{o}/{r}/pulls` GET/POST；`/pulls/{n}/reviews` POST；`/pulls/{n}/merge` PUT。
- `repos/{o}/{r}/contents/{path}` GET（raw 用 Accept raw）/PUT（新建/更新 base64 body）/DELETE。
- `repos/{o}/{r}/releases` GET/POST；`/releases/{id}` PATCH/DELETE；`/releases/{id}/assets` POST（上传 octet-stream）。
- `repos/{o}/{r}/actions/workflows` GET；`/actions/workflows/{id}/dispatches` POST；`/actions/runs` GET；`/actions/runs/{id}/rerun` POST。
- `search/issues?q=...` GET 仅读。
- `rate_limit` GET；`meta` GET。

## 若仍不确定
1. 查本技能 references/。
2. 回官方文档：REST https://docs.github.com/rest · GraphQL https://docs.github.com/graphql。
3. 用 GitHub OpenAPI 权威定义核对字段：https://docs.github.com/en/rest/overview/openapi-description（openapi.json 链接）。
4. 对陌生写端点：先读官方 doc 的参数与状态码，不要靠猜。

## 参考文件（按需读取）
- [references/rest-core.md](references/rest-core.md) —— REST 分域端点/参数速查（issues/repos/contents/releases/actions/search/users/orgs…）。
- [references/graphql.md](references/graphql.md) —— GraphQL 查询、连接分页、schema/内省、示例。
- [references/safety.md](references/safety.md) —— 不可逆与破坏性操作清单、确认流程、失败处理。