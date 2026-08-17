---
layout: default
---

# GitHub API Skill — 文档

> 权威 GitHub API 参考（REST + GraphQL + 安全规则），供 AI Agent 参考实现，避免猜测端点、重复失败或不可逆误操作。

- [REST 分域速查](rest.md)
- [GraphQL 参考](graphql.md)
- [不可逆与破坏性操作安全规则](safety.md)
- [时效性自检报告（自动生成）](last-verified.md)

## 安装到 Agent

```sh
npx skills add xinvxueyuan/github-api-skill
```

## 核心原则

- **先参考、后调用**：端点/参数以官方文档为准。
- **默认只读**：先 GET 看清现状，再设计写操作。
- **破坏性操作必须确认**：DELETE/覆盖/转移等先向用户说明影响并获得同意。
- **处理状态码与限流**：403/404/422/409/429/5xx 各有一套处理，不盲目重试。

## 许可

MIT OR Apache-2.0 · [源码仓库](https://github.com/xinvxueyuan/github-api-skill)