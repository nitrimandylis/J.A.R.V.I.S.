---
name: gmail-triage
description: Use when Nick wants to check his unread emails and surface anything that needs attention
---

# Gmail Triage

## When to Use
Trigger phrases:
- "check my email"
- "any emails?"
- "gmail triage"
- "what's in my inbox"
- "unread emails"

Also runs as part of `/start` **only if the opt-in flag is active** (check Claude Code memory).

## Opt-In Flag
This skill is **off by default** in `/start`. To enable:
- Nick says: "enable Gmail in start" or "turn on email in start"
  → save a memory: `Gmail triage is enabled in /start`
- Nick says: "disable Gmail in start" or "turn off email in start"
  → remove or update that memory

## How to Run
```bash
bun run tools/gmail-triage.ts [--limit <n>] [--json]
```

This tool uses the `gws` CLI (Google Workspace CLI) to fetch unread messages, filters out noise (noreply, notifications, newsletters, common services), and surfaces only emails that likely need a human response.

## Auth Setup
If the tool fails with an auth error, run:
```bash
gws auth login -s gmail
```

## Output
The tool handles all formatting and noise filtering. Output shows filtered count vs total and lists actionable emails with subject + sender.
