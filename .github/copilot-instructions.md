# Copilot Instructions — Daily (Manager Productivity App)

## Project Overview

Daily is a personal productivity app for engineering managers. It helps a level-1 manager with ~12 reports triage tasks (do/delegate/defer), manage time blocks, and run weekly reviews.

**Stack:** Electron + React + TypeScript, JSON file storage, Vite bundler.

## Architecture

```
src/
  main/           # Electron main process — IPC handlers, file I/O, window management
  renderer/       # React app — all UI lives here
    components/   # Reusable UI components
    features/     # Feature modules (inbox, team, calendar, review)
    hooks/        # Custom React hooks
    stores/       # State management (Zustand stores)
  shared/         # Types and utilities shared between main and renderer
data/             # Default location for user JSON data files (gitignored)
```

### Main ↔ Renderer Boundary

All data access goes through Electron IPC. The renderer never touches the filesystem directly.

- **Main process** exposes IPC handlers in `src/main/ipc/` that read/write JSON files.
- **Renderer** calls these via typed IPC hooks in `src/renderer/hooks/useIpc.ts`.
- Shared TypeScript types in `src/shared/types.ts` keep both sides in sync.

### Data Model (JSON files)

Each entity type is stored in its own JSON file under the user's data directory:

- `tasks.json` — Task inbox items with status (`inbox | delegated | scheduled | done`), assignee, due date
- `team.json` — Team member profiles (name, role, areas of ownership)
- `timeblocks.json` — Calendar time blocks with start/end, linked task IDs
- `reviews.json` — Weekly review snapshots

### Feature Modules

Each feature in `src/renderer/features/` is self-contained:

```
features/inbox/
  InboxView.tsx       # Page-level component
  TaskCard.tsx        # Task display/action component
  inboxStore.ts       # Zustand store slice
  inbox.types.ts      # Feature-specific types (re-exports shared types)
```

## Build & Dev Commands

```bash
npm install           # Install dependencies
npm run dev           # Start Electron app in dev mode (hot reload)
npm run build         # Production build
npm run lint          # ESLint
npm run typecheck     # TypeScript type checking (no emit)
npm run test          # Run all Vitest tests
npm run test -- inbox # Run tests matching "inbox"
npx vitest run src/renderer/features/inbox/InboxView.test.tsx  # Single test file
```

## Key Conventions

### Task Triage Model

Every task enters the inbox and must be triaged into one of three actions:
- **Do** — Assign to self, schedule a time block
- **Delegate** — Assign to a team member with context and due date
- **Defer** — Snooze to a future date (returns to inbox on that date)

### Component Patterns

- **Always `import React from 'react'` in every `.tsx` file.** electron-vite uses the classic JSX transform (`React.createElement`) in dev mode and does not support the automatic JSX runtime.
- Page-level components live in feature folders and are named `*View.tsx`.
- Reusable components go in `src/renderer/components/` and are purely presentational (no store access).
- Feature components can access their own Zustand store directly.

### IPC Naming

IPC channels follow the pattern `entity:action` (e.g., `tasks:list`, `tasks:update`, `team:get`).

### State Management

- Use Zustand for client state. One store file per feature.
- No Redux. No React Context for data (only for theming/config).

### Styling

- Use CSS Modules (`*.module.css`) colocated with components.
- No CSS-in-JS libraries. No Tailwind.

### Testing

- Use Vitest + React Testing Library.
- Test files are colocated: `InboxView.test.tsx` next to `InboxView.tsx`.
- Mock IPC calls in tests; never hit the real filesystem.
