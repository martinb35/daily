# Daily

A personal productivity app for engineering managers. Triage tasks (do, delegate, defer), manage your team, block time on your calendar, and run weekly reviews — all in one place.

Built with Electron, React, TypeScript, and Zustand. Data stored locally as JSON files.

## Getting Started

```bash
npm install
npm run dev
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the app in dev mode with hot reload |
| `npm run build` | Production build |
| `npm run test` | Run all tests |
| `npm run test -- inbox` | Run tests matching "inbox" |
| `npm run lint` | Lint with ESLint |
| `npm run typecheck` | Type check without emitting |

## Features

- **Inbox** — Tasks land here and get triaged: do it yourself, delegate to a report, or defer to later. Deferred tasks hide until their snooze date. Quick-delete with the red ✕ on hover. Delegated and done cards show in a compact view.
- **Team** — Profiles for your direct reports with roles and areas of ownership
- **Calendar** — Time blocks linked to tasks so you know what you're working on and when
- **Weekly Review** — Snapshots of what got done, delegated, and deferred each week
- **☀️ Start My Day** — Generates a prompt for [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli/) that queries your Microsoft 365 data to kick off your morning:
  - Review today's meetings and suggest accept/decline for unresponded invites
  - Surface Teams messages and emails that need a reply (added as inbox tasks)
  - Suggest focus-time blocks for open tasks in your free calendar slots
  - Schedule wellness breaks — walks, stretches, and screen breaks throughout the day
- **🌙 End My Day** — Same prompt-based workflow to wrap up your day:
  - Extract action items from today's meetings
  - Flag unanswered emails as tasks
  - Verify meeting attendance and update your calendar
  - Suggest prep tasks for tomorrow's meetings

## How the Copilot CLI Workflows Work

The Start/End My Day features don't call Microsoft 365 directly. Instead they generate a structured prompt containing your current tasks, calendar, and team data. You copy the prompt to your clipboard and paste it into [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli/) which uses the WorkIQ MCP plugin to query your M365 data (meetings, emails, Teams) and writes results back to the app's JSON data files.

## MCP Server

The `mcp-server/` directory contains a standalone MCP server that exposes Daily's data (tasks, timeblocks, team, reviews) as tools for GitHub Copilot CLI. This lets Copilot read and write your app data directly instead of using raw shell commands.

### Setup

```bash
cd mcp-server
npm install
npm run build
```

Then register it with Copilot CLI:

```
/mcp add daily-data -- node <path-to-repo>/mcp-server/dist/index.js
```

The server persists in your MCP config — no need to re-register after restarting Copilot CLI.

### Tools (21)

| Entity | Tools |
|--------|-------|
| Tasks | `tasks_list`, `tasks_get`, `tasks_create`, `tasks_update`, `tasks_delete` |
| Time Blocks | `timeblocks_list`, `timeblocks_get`, `timeblocks_create`, `timeblocks_update`, `timeblocks_delete` |
| Team | `team_list`, `team_get`, `team_create`, `team_update`, `team_delete` |
| Reviews | `reviews_list`, `reviews_get`, `reviews_create`, `reviews_update`, `reviews_delete` |
| Utility | `data_path` |
