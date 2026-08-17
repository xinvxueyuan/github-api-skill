# github-api-skill

Agent Skill：**权威 GitHub API 参考**（REST + GraphQL + 安全规则）。让 AI 代理按最新规范调用 GitHub API —— 先参考、后调用，**避免猜测端点、重复失败或造成不可逆误操作**。

[![skills.sh](https://skills.sh/b/xinvxueyuan/github-api-skill)](https://skills.sh/xinvxueyuan/github-api-skill)
[![License: MIT OR Apache-2.0](https://img.shields.io/badge/license-MIT%20OR%20Apache--2.0-blue)](LICENSE-MIT)

## 安装

```sh
npx skills add xinvxueyuan/github-api-skill
```

## 包含的技能

| 技能 | 说明 |
| --- | --- |
| `github-api-reference` | GitHub API（REST/GraphQL）端点、参数、认证、分页、限流、API 版本，以及不可逆操作的安全规则 |

## 文档（GitHub Pages）

- 主页：https://xinvxueyuan.github.io/github-api-skill/
- REST 速查：/rest · GraphQL：/graphql · 安全规则：/safety

## 仓库结构

```
skills/github-api-reference/
  ├── SKILL.md                     # 技能主文档（frontmatter + 使用指南）
  └── references/                  # 分域参考（REST / GraphQL / 安全）
docs/                             # GitHub Pages 文档站
skills.sh.json                     # skills.sh 仓库页分组
```

## 许可

MIT OR Apache-2.0（见 [LICENSE-MIT](LICENSE-MIT) / [LICENSE-APACHE](LICENSE-APACHE)）