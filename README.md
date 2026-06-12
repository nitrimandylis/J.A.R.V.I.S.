<div align="center">

```
      ██╗ █████╗ ██████╗ ██╗   ██╗██╗███████╗
      ██║██╔══██╗██╔══██╗██║   ██║██║██╔════╝
      ██║███████║██████╔╝██║   ██║██║███████╗
 ██   ██║██╔══██║██╔══██╗╚██╗ ██╔╝██║╚════██║
 ╚█████╔╝██║  ██║██║  ██║ ╚████╔╝ ██║███████║
  ╚════╝ ╚═╝  ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚══════╝
```

### `PERSONAL AI BUTLER // NOTION + GOOGLE WORKSPACE`

*the harness that lets an LLM run my life through Bun scripts — no MCP, just raw CLI*

![runtime](https://img.shields.io/badge/runtime-bun._node_need_not_apply-4cc2ff?style=flat-square&labelColor=111111)
![mcp](https://img.shields.io/badge/MCP-no._raw_scripts-4cc2ff?style=flat-square&labelColor=111111)
![butler](https://img.shields.io/badge/butler-on_duty-e8c44c?style=flat-square&labelColor=111111)
![models](https://img.shields.io/badge/works_with-claude_+_gemini-4cc2ff?style=flat-square&labelColor=111111)
![timezone](https://img.shields.io/badge/timezone-Europe%2FAthens-e8c44c?style=flat-square&labelColor=111111)

</div>

---

## 🎩 What is this

An AI assistant harness, not an AI. JARVIS is a set of standalone **Bun
scripts** that give a coding agent (Claude Code or Gemini CLI) hands inside my
Notion workspace and Google Workspace. The agent reads `CLAUDE.md` (or
`GEMINI.md`), learns the house rules, and then drives the tools like any other
shell command — query databases, file pages, triage Gmail, check the calendar.

No MCP servers, no daemons. Every capability is a file you can read, run, and
unit test. The plumbing is boring on purpose; the butler is the model.

```console
nick@jarvis:~$ bun run src/core/check-calendar.ts --today
[✓] 3 events. 1 deadline. 0 free will detected.
[i] very good, sir. shall I triage the inbox while you panic?
```

## 🛠️ The tools

| | tool | what it actually does |
|---|---|---|
| 01 | **query-database** | list/search pages in any Notion database — filters, sorting, `--json`, page IDs out |
| 02 | **fetch-page** | one page, all properties and block content. `--no-content` for properties only |
| 03 | **create-page** | new page in any database — `--database`, `--title`, extra `--props` as JSON |
| 04 | **update-page** | properties and/or body (markdown-ish). replaces content by default, `--append` to add |
| 05 | **delete-page** | what it says. the butler does not hesitate |
| 06 | **check-calendar** | Google Calendar via `gws` — the day's damage report |
| 07 | **gmail-triage** | inbox sweep — sort, summarize, surface what actually needs a human |

Skills for both agents live side by side: `.claude/commands/` and
`.gemini/skills/` — start, end, check-calendar, gmail-triage, writing-style.
One brain config per model, same hands.

## 🚀 Run it

Requires [Bun](https://bun.sh). Node.js is not invited — Bun auto-loads
`.env`, so there's no `dotenv` anywhere in this house.

```bash
git clone https://github.com/nitrimandylis/J.A.R.V.I.S..git
cd J.A.R.V.I.S.
cp .env.example .env       # Notion API key + Google Workspace credentials
bun install

bun run src/core/query-database.ts --database assignments --limit 5
```

Quality gates, all Bun-native:

```bash
bun test               # the suite
bunx biome check       # lint
bunx tsc --noEmit      # types
```

## 🔩 Under the hood

| layer | path | job |
|---|---|---|
| 🧠 agent contract | `CLAUDE.md` / `GEMINI.md` | identity, house rules, tool usage — the butler's training |
| 🔧 core tools | `src/core/` | one script per capability; CLI args in, formatted text or `--json` out |
| 📚 notion client | `src/notion/` | client, blocks, database schema handling, property type coercion |
| 🖨️ presentation | `src/presentation/` | formatters for Notion and Google output — terminals deserve nice things |
| ⚙️ config | `src/config/loader.ts` + `context/` | database registry and cached schemas |
| 🧪 tests | `tests/` | `bun test` — blocks, properties, formatting |

**Stack:** TypeScript on Bun · `@notionhq/client` · `gws` CLI for
Google Workspace · Biome for lint. Schema cache in `context/` keeps the
agent from re-asking Notion what a "status" is.

---

<div align="center">

**[Nick Trimandylis](https://github.com/nitrimandylis)**

`AT YOUR SERVICE, SIR. THE CALENDAR DISAGREES.`

</div>
