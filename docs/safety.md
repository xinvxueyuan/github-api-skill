# 不可逆与破坏性操作安全规则（github-api-reference）

> 原则：**默认只读；先读后写；破坏性操作必须向用户说明影响并获明确同意；失败不盲目重试。**

## 必须确认的破坏性操作（示例，非穷尽）
- **删除类**：DELETE issue/PR 评论、label、milestone、release、tag、gist、package、仓库、workflow run 日志/注销构件、环境/密钥。
- **覆盖类**：force push、覆盖已存在 secret/env variable、重新发布同一版本、覆盖 release asset、改默认分支指向。
- **转移/删除实体**：transfer 仓库、delete repository、remove collaborator/member、删除组织。
- **批量/大范围**：同时 close 大量 issue/PR、批量改标签/权限、全量替换文件（contents PUT 覆盖）。
- **发布/供应链**：npm/container/package 发布与删除、release 删除（影响依赖）、锁定/禁用 workflow。

## 执行前检查清单
1. **GET 确认目标**：用 GET 先拉取当前对象（id、路径、sha、当前内容），确认你操作的是对的实体/版本。
2. **讲清影响**：向用户说明“将删除 X / 覆盖 Y / 影响 Z”，并获得明确“同意”。
3. **是否需要 sha**：contents 更新/删除、获得冲突多以最新 sha 为准——先 GET 取 sha 再用。
4. **备份**：可逆代价高的（删除 release、内容覆盖）建议先记录当前状态（引用/内容）以便追溯。
5. **最小权限**：用作用域最小的 token；别用 admin 范围做读/常规写。

## 失败处理与重试纪律
- **不盲目重试**写操作：422（校验失败）先看 message/errors 修正；409（冲突）查冲突点；429（限流）读 `Retry-After`/`X-RateLimit-Reset`，指数退避；5xx 服务器错误退避后仅温和重试。
- **幂等考虑**：需要确定性的操作先读后写；无幂等保证的写不并发。
- **限流边缘**：批量之前查 `rate_limit`，别打满导致整批失败。
- **可追溯**：涉及仓库内容的操作走带提交信息的方式（git/API），留存记录。

## 对 Agent 的强制要求
- 凡是涉及上述“不可逆/破坏性”操作，**必须**先把受影响对象、操作、后果讲给用户，获确认后才调用写接口。
- 任何失败调用，先读错误信息与状态码，再决定重试或调整，绝不无脑重跑同一命令。