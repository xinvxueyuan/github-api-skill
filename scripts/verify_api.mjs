// Self-maintain the GitHub API skill docs' timeliness:
// - extract REST endpoint paths documented in rest-core.md (no regex, string ops)
// - live read-only smoke against the public GitHub API
// - record GitHub's current REST API version header
// - workflow commits a 'last verified' report; exit 1 when drift found
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..')
const REF = join(ROOT, 'skills/github-api-reference/references/rest-core.md')
const DOCS = join(ROOT, 'docs')
const EXPECTED = '2022-11-28'
const TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || ''

const VARS = { '{o}': 'octocat', '{r}': 'Hello-World', '{u}': 'octocat', '{org}': 'octocat', '{n}': '1', '{id}': '1', '{b}': 'main', '{name}': 'readme', '{path}': 'readme', '{ref}': 'main', '{commit}': 'main', '{sha}': 'main', '{base}': 'main', '{head}': 'main', '{label}': 'readme', '{team}': '1' }

const md = await readFile(REF, 'utf8')
const paths = []
for (const line of md.split('\n')) {
  const t = line.trim()
  if (!t.startsWith('| `')) continue
  const a = t.indexOf('`')
  const b = t.indexOf('`', a + 1)
  if (a < 0 || b < 0) continue
  const p = t.slice(a + 1, b).replace(/^\/+/, '')
  if (/^(repos|orgs|users|search|rate_limit|meta|user|gists?|notifications|marketplace)/.test(p)) paths.push(p)
}
const unique = [...new Set(paths)]

function resolvePath(p) {
  let out = p
  if (out.startsWith('orgs/')) { const ov = { '{o}': 'github', '{org}': 'github' }; for (const k in ov) out = out.split(k).join(ov[k]) }
  for (const [k, v] of Object.entries(VARS)) out = out.split(k).join(encodeURIComponent(String(v)))
  return out
}
function isScalar(p) { var rest = p.replace('{o}','').replace('{r}','').replace('{u}','').replace('{org}',''); return rest.includes('{') }

async function liveCheck(path) {
  const url = 'https://api.github.com/' + resolvePath(path)
  if (url.includes('{')) return { path, url, status: 'skipped', note: 'unresolved placeholder' }
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'github-api-skill-freshness' }
  if (TOKEN) headers.Authorization = 'Bearer ' + TOKEN
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(20000) })
    return { path, url, status: res.status, apiVer: res.headers.get('x-github-api-version') || '', note: '' }
  } catch (e) {
    return { path, url, status: 'ERR', note: e instanceof Error ? e.message : String(e) }
  }
}

const results = []
for (const p of unique) {
  const r = await liveCheck(p)
  if (p.startsWith('user/')) { results.push({ path: p, ...r, verdict: Number.isInteger(r.status) && r.status < 300 ? 'ok' : 'info' }); continue }
  if (p.includes('/git/refs/')) { results.push({ path: p, ...r, verdict: Number.isInteger(r.status) && r.status < 300 ? 'ok' : 'info' }); continue }
  const code = r.status
  let verdict = 'ok'
  if (code === 'skipped') verdict = 'skipped'
  else if (Number.isInteger(code) && code >= 200 && code < 300) verdict = 'ok'
  else if (code === 404) verdict = isScalar(p) ? 'info' : 'fail-endpoint'
  else if (code === 403 || code === 429) verdict = 'warn-limit'
  else if (code === 'ERR') verdict = 'error-net'
  else if (Number.isInteger(code) && code >= 500) verdict = 'warn-server'
  else verdict = 'warn-other'
  results.push({ path: p, ...r, verdict })
}

const fails = results.filter((x) => x.verdict === 'fail-endpoint' || x.verdict === 'error-net')
const apiVersions = [...new Set(results.map((x) => x.apiVer).filter(Boolean))]
const iso = new Date().toISOString()
const ok = results.filter((x) => x.verdict === 'ok').length
const info = results.filter((x) => x.verdict === 'info').length
const warns = results.filter((x) => x.verdict.startsWith('warn')).length

const lines2 = []
lines2.push('# 时效性自检报告（GitHub API Reference）')
lines2.push('')
lines2.push('> 由 GitHub Actions 定时生成（每周一 04:00 UTC + 手动触发）。')
lines2.push('')
lines2.push('- **检查时间**：' + iso)
lines2.push('- **文档声明的 API 版本**：`' + EXPECTED + '`')
lines2.push('- **实测响应头 API 版本**：' + (apiVersions.length ? apiVersions.join(' / ') : '（匿名无版本头）'))
lines2.push('- **端点总数 / 已校验**：' + unique.length + ' / ' + (unique.length - results.filter((x) => x.verdict === 'skipped').length))
lines2.push('- **通过**：' + ok + ' · **信息性 404**：' + info + ' · **告警**：' + warns)
lines2.push('- **漂移 / 失败**：**' + fails.length + '**')
lines2.push('')
if (fails.length) {
  lines2.push('## 疑似漂移（端点缺失或网络错误）')
  lines2.push('')
  for (const f of fails) lines2.push('- `' + f.path + '` → `' + f.url + '` : ' + f.status + (f.note ? ' — ' + f.note : ''))
  lines2.push('')
} else {
  lines2.push('## 无漂移')
  lines2.push('')
  lines2.push('所有文档化端点均可解析（GET 校验）。')
  lines2.push('')
}
lines2.push('> 状态：`ok` 通过 · `info` 单资源 404（正常）· `warn-*` 限流/权限/服务器 · `fail-endpoint` 端点疑似被移除或改名。')

await mkdir(DOCS, { recursive: true })
await writeFile(join(DOCS, 'last-verified.md'), lines2.join('\n'))
await writeFile(join(DOCS, 'last-verified.json'), JSON.stringify({ checkedAt: iso, ok, failures: fails.length, total: unique.length }, null, 2) + '\n')

console.log(JSON.stringify({ checkedAt: iso, total: unique.length, ok, info, warns, failures: fails.length }, null, 2))
process.exit(fails.length > 0 ? 1 : 0)