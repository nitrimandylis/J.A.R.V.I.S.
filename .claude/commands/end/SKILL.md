---
name: end
description: Session wrap-up — logs daily note and updates statuses
---

# /end — Session Wrap-up

Do these steps in order:

### 1. Check for existing daily note
```bash
bun run tools/query-database.ts --database "Daily Notes" --sort "Date:descending" --limit 1 --json
```
If today's note already exists, use `update-page` to update it. If not, use `create-page`.

### 2. Log Daily Note
Create or update today's daily note with a summary of what was accomplished.

**Create:**
```bash
bun run tools/create-page.ts --database "Daily Notes" --title "<today's date YYYY-MM-DD>" --props '{"Tags":"<relevant tags>","Highlights":"<session summary>"}'
```
Then write the content body:
```bash
bun run tools/update-page.ts --id <new-page-id> --content "<markdown session log>"
```

**Update (if note exists):**
```bash
bun run tools/update-page.ts --id <existing-id> --props '{"Tags":"<merged tags>","Highlights":"<merged highlights>"}' --content "<markdown session log>" --database "Daily Notes"
```

Use the `writing-style` skill when composing the daily note content.

### 3. Update Statuses
If any item's status changed during the session (assignment completed, side quest updated, etc.), use `update-page` to reflect it.

### 4. Confirm
Tell Nick what was logged. Keep the confirmation to 3-4 lines max.
