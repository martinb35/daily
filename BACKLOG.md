# Daily App — Feature Backlog

## Custom MCP Tools (Copilot CLI SDK)

### 1. `daily-data` MCP Server
**Priority:** High

Expose the app's JSON data (tasks, timeblocks, team, reviews) as native MCP tools. Replaces manual PowerShell JSON manipulation in every workflow.

- `tasks:list`, `tasks:create`, `tasks:update`, `tasks:delete`
- `timeblocks:list`, `timeblocks:create`, `timeblocks:update`, `timeblocks:delete`
- Same for `team` and `reviews`
- Small Node.js server wrapping existing JSON storage in `src/main/storage.ts`

### ~~2. Calendar Sync Tool~~ ✅
**Status:** Done — `calendar_sync` MCP tool in `mcp-server/src/index.ts`

Takes WorkIQ calendar output and creates timeblocks automatically. Turns Start My Day from a multi-step conversation into a single call.

- Input: date + events array with title, start, end, type
- Color-codes by type: one_on_one, team, external, focus, wellness
- Deduplicates against existing timeblocks by title match or start-time match

### 3. End of Day Tool
**Priority:** Medium

Bundles the 4 End My Day WorkIQ queries + task creation + attendance check into one operation.

- Action items from today's meetings → new inbox tasks
- Unanswered emails → new inbox tasks
- Meeting attendance check → update timeblocks
- Tomorrow's prep → new inbox tasks with due dates

### 4. Weekly Review Generator
**Priority:** Medium

Aggregates completed tasks, meetings attended, and delegation status into a ReviewSnapshot.

- Summarize tasks completed this week
- List delegated items and their status
- Count meetings attended vs scheduled
- Generate `reviews.json` entry
