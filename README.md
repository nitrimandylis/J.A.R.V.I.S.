# J.A.R.V.I.S.

A personal AI assistant CLI for managing an IB Diploma workflow through Notion databases and Google Workspace. Built with TypeScript and Bun, designed to be used interactively by Claude Code and Gemini CLI.

---

## What it does

J.A.R.V.I.S. is a collection of CLI tools that give an AI assistant (Claude or Gemini) structured, scriptable access to:

- **9 Notion databases** — assignments, projects, journal, CAS, EE, Greek portfolio, backlog, and more
- **Google Calendar** — upcoming events across personal and school calendars
- **Gmail** — inbox triage with automatic noise filtering

The tools are not a user-facing app. They are the hands of the AI assistant — callable scripts that read and write structured data, returning clean output the AI can reason about.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Language | TypeScript (strict) |
| Notion | `@notionhq/client` v5 |
| Validation | `zod` v4 |
| Linting | Biome |
| Google Workspace | `gws` CLI (external) |

---

## Project structure

```
J.A.R.V.I.S./
├── tools/                  # CLI entry points (7 scripts)
├── src/
│   ├── config/             # Config and env loader
│   ├── core/               # Business logic (8 operations)
│   ├── notion/             # Notion API wrapper (client, DB, blocks, properties)
│   └── presentation/       # Human + JSON output formatters
├── tests/                  # Unit and integration tests
├── context/
│   ├── databases.json      # Registry of all 9 Notion databases
│   └── schema_cache.json   # Full property schemas and valid enum options
├── .claude/commands/       # Claude Code slash commands (skills)
├── .gemini/skills/         # Gemini CLI skills (mirrors .claude/)
├── CLAUDE.md               # Instructions for Claude Code
└── GEMINI.md               # Instructions for Gemini CLI
```

---

## Tools

All tools live in `tools/` and are run with `bun run`. Every tool supports `--json` for machine-readable output.

### `query-database`
List and filter pages in any Notion database.
```bash
bun run tools/query-database.ts --database <name> [--status <s>] [--priority <p>] [--limit <n>] [--sort <prop:dir>] [--json]
```

### `fetch-page`
Fetch a single page by ID with all properties and rendered block content.
```bash
bun run tools/fetch-page.ts --id <page-id> [--json] [--no-content]
```

### `create-page`
Create a new page in a database with properties.
```bash
bun run tools/create-page.ts --database <name> --title <text> [--props '<json>']
```

### `update-page`
Update properties and/or body content of an existing page.
```bash
bun run tools/update-page.ts --id <page-id> [--props '<json>'] [--content '<markdown>'] [--append] [--database <name>]
```

### `delete-page`
Archive a page (Notion's equivalent of deletion).
```bash
bun run tools/delete-page.ts --id <page-id>
```

### `check-calendar`
Fetch upcoming events from Google Calendar.
```bash
bun run tools/check-calendar.ts [--days <n>] [--json]
```

### `gmail-triage`
Surface unread Gmail messages, filtering out noise automatically.
```bash
bun run tools/gmail-triage.ts [--limit <n>] [--json]
```

---

## Databases

| # | Database | Contents |
|---|---|---|
| 1 | Assignments | IB homework, IAs, assessments |
| 2 | CAS Activities | Creativity, Activity, Service experiences |
| 3 | Side Quests | Personal projects and competitions |
| 4 | EE Progress Tracker | Extended Essay components |
| 5 | Modern Greek Portfolio | Greek B portfolio items |
| 6 | Backlog Items | Ideas, resources, things to learn |
| 7 | Coding Projects | Software projects and repos |
| 8 | Daily Notes | Daily journal entries |
| 9 | Claude Memory | Legacy — not actively used |

Database names are case-insensitive and support partial matching across all tools.

---

## Architecture

The codebase follows a three-layer design:

```
tools/          ← CLI: parse args, validate, call core
src/core/       ← Business logic: query Notion, call gws
src/presentation/ ← Format results for human or JSON output
```

**Core operations** are pure functions — they receive options and return structured results. They never format output. Formatting is handled separately by the presentation layer, keeping the business logic testable and reusable.

**Database resolution** supports exact, case-insensitive, and partial name matching, so `"assignments"`, `"Assignments"`, and `"assign"` all resolve to the same database.

**Schema-aware coercion** — pass `--database` to any write tool to enable type-aware property coercion using the cached schema in `context/schema_cache.json`. This validates select options, parses dates, and handles checkbox variants.

---

## Skills (AI Commands)

The `.claude/commands/` and `.gemini/skills/` directories define five skills invokable by the AI assistant:

| Skill | Description |
|---|---|
| `/start` | Session briefing — fetches assignments, projects, EE progress, calendar, daily notes |
| `/end` | Session wrap-up — logs daily note, updates statuses |
| `/writing-style` | Enforces writing rules before any written output |
| `/check-calendar` | Fetches next 4 days from Google Calendar |
| `/gmail-triage` | Surfaces actionable unread emails, filters noise |

Both Claude and Gemini skill files are kept identical.

---

## Setup

### Prerequisites
- [Bun](https://bun.sh) v1.x
- A Notion integration token with access to the target workspace
- `gws` CLI installed and authenticated for calendar/gmail tools

### Install
```bash
bun install
```

### Environment
Copy `.env.example` to `.env` and fill in your values:
```
NOTION_API_KEY="ntn_..."
```

### Auth for Google tools
```bash
gws auth login -s calendar
gws auth login -s gmail
```

---

## Development

```bash
bun test          # run tests
bunx biome check  # lint
bunx tsc --noEmit # type check
```

---

## Context

This project was built for a specific workflow: an IB Diploma student in Athens, Greece managing schoolwork, a personal journal, an Extended Essay, and side projects — all through Notion, with Claude Code and Gemini CLI as the primary interfaces.

The AI assistant is the primary user of these tools. The scripts are designed to be fast, composable, and unambiguous so the assistant can chain them reliably without guessing.
