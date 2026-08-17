# REST 分域端点速查（github-api-reference）

> 依据 GitHub REST API（X-GitHub-Api-Version: 2022-11-28）。路径中 `{o}`=owner、`{r}`=repo、`{n}`=number/id。
> 公开文档：https://docs.github.com/rest 。不确定字段一律回查官方文档。

## Issues & Pull Requests
| 端点 | 方法 | 关键点 |
| --- | --- | --- |
| `repos/{o}/{r}/issues` | GET/POST | 列表查询 `state=sorted/direction/per_page/page`；POST body `{title, body, labels[], assignees[]}` |
| `repos/{o}/{r}/issues/{n}` | GET/PATCH | PATCH 可改 title/body/state/labels/assignees/milestone |
| `repos/{o}/{r}/issues/{n}/comments` | GET/POST | issue 评论 |
| `repos/{o}/{r}/pulls` | GET/POST | 列表 `state/base/head`；POST 需 `head`、`base`，可选 title/body |
| `repos/{o}/{r}/pulls/{n}` | GET/PATCH | PATCH 合并请求字段 |
| `repos/{o}/{r}/pulls/{n}/reviews` | GET/POST | POST `{event: APPROVE/REQUEST_CHANGES/COMMENT, body}` |
| `repos/{o}/{r}/pulls/{n}/merge` | PUT | 合并参数 `commit_title/merge_method/merge_commit_message/sha` |
| `search/issues?q=...` | GET | `q`=repo:o/r + 条件；`sort/order/per_page` |

## Repos & Contents
| 端点 | 方法 | 关键点 |
| --- | --- | --- |
| `repos/{o}/{r}` | GET/PATCH | 仓库信息/设置（可改 default_branch/description/visibility…）|
| `repos/{o}/{r}/contents/{path}` | GET | 默认返回 base64 JSON；`Accept: application/vnd.github.raw+json` 得原文 |
| `repos/{o}/{r}/contents/{path}` | PUT | 新建/更新：body `{message, content(base64), branch?, sha?(更新必需)}` |
| `repos/{o}/{r}/contents/{path}` | DELETE | 删除文件：body `{message, sha, branch?}` |
| `repos/{o}/{r}/commits` | GET | 提交历史 `sha/path/since/until/per_page` |
| `repos/{o}/{r}/compare/{base}...{head}` | GET | 比较两 ref 差异 |
| `repos/{o}/{r}/branches` / `/branches/{b}` | GET | 分支；分支保护走 `/branches/{b}/protection` |
| `repos/{o}/{r}/collaborators` | GET/PUT/DELETE | 协作者（PUT 需 `permission`） |

## Releases & Tags
| 端点 | 方法 | 关键点 |
| --- | --- | --- |
| `repos/{o}/{r}/releases` | GET/POST | POST body `{tag_name, target_commitish, name?, body?, draft?, prerelease?}` |
| `repos/{o}/{r}/releases/{id}` | GET/PATCH/DELETE | PATCH 改字段；DELETE 删除 release（不可逆，先确认） |
| `repos/{o}/{r}/releases/{id}/assets` | GET/POST | POST 上传二进制：`Accept: application/octet-stream`，`Content-Type` 按文件；path `?name=` |
| `repos/{o}/{r}/git/refs/tags` | GET/POST | 底层 tag/ref（refs/heads 同理） |

## Actions / Workflows
| 端点 | 方法 | 关键点 |
| --- | --- | --- |
| `repos/{o}/{r}/actions/workflows` | GET | 列 workflow |
| `repos/{o}/{r}/actions/workflows/{id}/dispatches` | POST | 触发 `workflow_dispatch`：`{ref, inputs?}`（需 workflow 有 workflow_dispatch 触发） |
| `repos/{o}/{r}/actions/runs` | GET | 列运行 `branch/event/status` |
| `repos/{o}/{r}/actions/runs/{id}` | GET | 单次运行详情 |
| `repos/{o}/{r}/actions/runs/{id}/jobs` | GET | 该运行的任务 |
| `repos/{o}/{r}/actions/runs/{id}/rerun` | POST | 重跑（失败的任务可 `rerun-failed-jobs`） |
| `repos/{o}/{r}/actions/artifacts` | GET | 列构件 |
| `repos/{o}/{r}/actions/secrets` | GET/PUT/DELETE | 仓库 secret（PUT body `{encrypted_value, key_id}`；覆盖会不可逆） |

## Users / Orgs / Misc
| 端点 | 方法 | 关键点 |
| --- | --- | --- |
| `user` | GET | 当前认证用户 |
| `users/{u}/repos` | GET | 用户仓库列表 |
| `orgs/{o}/repos` | GET/POST | 组织仓库 |
| `orgs/{o}/teams` | GET | 组织团队 |
| `orgs/{o}/audit-log` | GET | 审计日志（需权限） |
| `user/gists` | GET/POST | 概要（代码片段） |
| `rate_limit` | GET | 查各类配额 |
| `meta` | GET | 元信息（Git 地址/API 版本） |

## 通用注意
- 写操作 body 一律 JSON；`updated` 类字段不必传。
- 文件/路径含特殊字符要 percent-encode。
- 大列表用分页（per_page/page 或 Link）。
- 对未知端点先查官方文档确认参数与返回，别猜。
