---
name: gmail-triage
description: Check unread Gmail and surface actionable emails. Use when Nick says "check my email", "any emails?", "gmail triage", "what's in my inbox", or "unread emails". Also used as part of the start/briefing skill when opted in.
---

# Gmail Triage

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
