# GraphQL 参考（github-api-reference）

> 端点：`POST https://api.github.com/graphql`；正文 `{ "query": "...", "variables": {...} }`。
> 认证与 REST 相同（Authorization Bearer）；文档：https://docs.github.com/graphql 。

## 请求结构
```json
{
  "query": "query($owner: String!, $name: String!) { repository(owner: $owner, name: $name) { nameWithOwner stargazerCount } }",
  "variables": { "owner": "xinvxueyuan", "name": "github-api-skill" }
}
```

- 查询/变更（mutation）均可；命名查询可用变量，推荐始终变量化（避免内插字符串/注入风险）。
- 字段拼错 / 不存在会返回 `errors[]`（HTTP 仍 200）——**有 errors 且无 data 即视为失败**。
- 用文档 Explorer 校验字段：https://docs.github.com/graphql 。

## 连接分页
```graphql
query {
  repository(owner: "xinvxueyuan", name: "github-api-skill") {
    issues(first: 30, orderBy: {field: CREATED_AT, direction: DESC}) {
      totalCount
      pageInfo { hasNextPage endCursor }
      edges { cursor node { number title state } }
    }
  }
}
```
- 连接字段标准：`totalCount`、`pageInfo{hasNextPage,endCursor}`、`edges{cursor,node}`。
- `first`/`last` 上限各 100；翻页：把上一页 `endCursor` 作为下页 `after`。
- 避开深层嵌套滥用（有成本）；必要字段按需选。

## 常用顶层字段
- 对象：`repository(owner,name)`、`user(login)`、`organization(login)`、`issue(number)`、`pullRequest(number)`、`viewer`（当前用户）。
- 已知公共例：`viewer { login }`、`repository(owner, name){ nameWithOwner defaultBranchRef { name } }`。

## 变更（mutation）示例
```graphql
mutation($id: ID!, $state: IssueState!) {
  updateIssue(input: {id: $id, state: $state}) { issue { number state } }
}
```
- mutation 前先读（query）确认目标；破坏性的变更同 REST 规则先与用户确认。

## 内省 / 判断字段是否最新
- `GET /graphql` 支持内省：`{ __schema { types { name } } }` 可查类型/字段；据此校准，不靠猜字段名。
- 变更发生频率：GitHub 会演进 schema；不确定就内省或查官方 schema 文档。

## 限流
- GraphQL 计点数复用账户 core 配额（与 REST 共享 ~5000/时）。
- 返回头/加成本提示（`X-RateLimit-*`）；不足时降低请求复杂度。