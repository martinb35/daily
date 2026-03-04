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

- **Inbox** — Tasks land here and get triaged: do it yourself, delegate to a report, or defer to later
- **Team** — Profiles for your direct reports with roles and areas of ownership
- **Calendar** — Time blocks linked to tasks so you know what you're working on and when
- **Weekly Review** — Snapshots of what got done, delegated, and deferred each week
