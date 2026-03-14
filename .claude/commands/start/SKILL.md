---
name: start
description: Session briefing — fetches assignments, side quests, EE progress, daily notes, calendar, and optionally Gmail
---

# /start — Session Briefing

Run these queries in parallel to brief Nick on his current state:

0. `bun run tools/query-database.ts --database "coding projects" --limit 10`
1. `bun run tools/query-database.ts --database assignments --status "To Do" --sort "Due:ascending" --limit 10`
2. `bun run tools/query-database.ts --database assignments --status "In Progress" --limit 10`
3. `bun run tools/query-database.ts --database "Side Quests" --status "In Progress" --limit 5`
4. `bun run tools/query-database.ts --database "EE Progress Tracker" --status "In Progress" --limit 5`
5. `bun run tools/query-database.ts --database "EE Progress Tracker" --status "Review" --limit 5`
6. `bun run tools/query-database.ts --database "EE Progress Tracker" --status "To Do" --limit 5`
7. `bun run tools/query-database.ts --database "Daily Notes" --sort "Date:descending" --limit 1`
8. `bun run tools/check-calendar.ts`
9. **Gmail** (opt-in only) — check Claude Code memory for a "Gmail triage is enabled in /start" flag. If active, run `bun run tools/gmail-triage.ts`. If not found, skip silently.

After all queries complete, present a concise briefing:

- Upcoming/overdue assignments (flag anything due within 2 days)
- Active side quests and coding projects
- EE progress
- Calendar (next 4 days)
- Gmail (if enabled)
- Last daily note summary

End with: "Ready. What are we working on?"
