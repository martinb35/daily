# Standalone Daily App — Multi-Machine Plan

## Problem

Daily runs as an Electron app on one PC with local JSON data files. The Start My Day and End My Day workflows require coordinating with GitHub Copilot CLI (for WorkIQ/M365 access and AI reasoning). To use Daily on another machine today, you'd need to remote into the primary PC.

**Goal:** Install Daily on any machine, use it fully — including AI-powered workflows — without remoting in or registering apps with corporate infrastructure.

---

## Solution: Two-Part Architecture

### Part 1: OneDrive for Business Data Sync

Use OneDrive as the shared data layer. Each machine runs the app locally, reading/writing to the same OneDrive-synced folder.

```
MACHINE A:
  [Electron App] → [OneDrive\Daily\*.json] ← [MCP Server]
                         ↕ (OneDrive sync)
MACHINE B:
  [Electron App] → [OneDrive\Daily\*.json] ← [MCP Server]
```

**Why OneDrive:**
- Already installed on every corp machine
- No ports, no firewall issues, no VPN
- Auto-sync, offline support
- Private (your OneDrive, Microsoft-managed encryption)
- JSON files are < 100KB total — syncs in seconds
- MCP server already supports `DAILY_DATA_DIR` env var

**Code changes:** Add `DAILY_DATA_DIR` env var support to Electron's `storage.ts` (~5 lines). Everything else is config.

**Risk:** Sync conflicts if two machines write the same file simultaneously. Mitigated by single-user usage (only active on one machine at a time).

### Part 2: Embedded Terminal for CLI Workflows

Embed a real terminal inside the Electron app so Start My Day / End My Day workflows run in-app without window switching or copy/paste.

**Tech stack:**
- **xterm.js** — Terminal emulator component (same one VS Code uses)
- **node-pty** — Spawns Copilot CLI with a real pseudo-terminal from the Electron main process
- Full interactivity — colors, prompts, user input, everything works

**Workflow:**
1. User clicks **"Start My Day"** in the app
2. A terminal panel slides open inside the app
3. App auto-launches Copilot CLI with the pre-built prompt
4. User sees the CLI conversation inline — answers questions, confirms suggestions
5. CLI writes to JSON files via daily-data MCP (as it does today)
6. When done, the app detects file changes and reloads data
7. Updated inbox/calendar/timeblocks appear immediately

**Key properties:**
- CLI is fully interactive — user can answer questions, clarify, iterate
- No Graph API registration required — WorkIQ handles M365 access through CLI auth
- No copy/paste between windows
- Same MCP server, same tools, same prompts — just embedded

---

## Implementation Plan

### Phase 1: OneDrive Data Sync
- [ ] Update `src/main/ipc/storage.ts` to check `DAILY_DATA_DIR` env var
- [ ] Mirror the resolution logic from `mcp-server/src/storage.ts`
- [ ] Create `Daily` folder in OneDrive for Business
- [ ] Move JSON files from `%APPDATA%\daily\daily-data\` to OneDrive folder
- [ ] Set `DAILY_DATA_DIR` on primary machine, verify app + MCP both work
- [ ] Test sync by modifying data on one machine and confirming on another

### Phase 2: Embedded Terminal
- [ ] Install dependencies: `xterm`, `@xterm/addon-fit`, `node-pty`
- [ ] Create IPC handlers for PTY management in main process
  - `pty:spawn` — create a new PTY with shell or command
  - `pty:write` — send input to PTY
  - `pty:resize` — handle terminal resize
  - `pty:kill` — terminate PTY
  - `pty:onData` — stream PTY output to renderer
- [ ] Create `TerminalPanel` React component with xterm.js
- [ ] Integrate into Start My Day and End My Day views
  - Replace "copy prompt" button with "Run in terminal" button
  - Auto-populate the CLI command with the generated prompt
- [ ] Add file watcher on data directory to auto-reload after CLI writes
- [ ] Handle terminal lifecycle (cleanup on view change, persist across tabs)

### Phase 3: First-Run Setup Wizard
- [ ] Detect if Copilot CLI is installed (`gh copilot --version` or equivalent)
- [ ] Check if MCP servers are registered in `~/.copilot/mcp-config.json`
- [ ] If not, walk user through:
  - Install Copilot CLI link/instructions
  - Auto-run MCP registration commands
  - Set `DAILY_DATA_DIR` if not set
- [ ] Show setup status on Settings/About page

### Phase 4: Packaging & Distribution
- [ ] Configure electron-builder or electron-forge for distributable builds
- [ ] Create Windows installer (MSI or NSIS)
- [ ] Bundle MCP server inside the app package
- [ ] Add auto-update support (electron-updater, GitHub Releases)
- [ ] Document new machine setup in README

---

## New Machine Setup (End State)

1. **Install Daily** (Windows installer)
2. **Install Copilot CLI** (if not already installed)
3. **First-run wizard** registers MCP servers automatically
4. **Set `DAILY_DATA_DIR`** to OneDrive folder (wizard can prompt for this)
5. **Done** — app works with synced data and embedded CLI workflows

---

## Dependencies

| Dependency | Purpose | Already Have? |
|------------|---------|---------------|
| OneDrive for Business | Data sync | ✅ Yes |
| `DAILY_DATA_DIR` env var (MCP) | Custom data path | ✅ Yes |
| `DAILY_DATA_DIR` env var (Electron) | Custom data path | ❌ ~5 lines |
| xterm.js | Terminal emulator UI | ❌ Add dependency |
| node-pty | PTY subprocess management | ❌ Add dependency |
| Copilot CLI | AI workflows | ✅ Yes (per machine) |
| daily-data MCP server | Data tools for CLI | ✅ Yes |
| electron-builder | Installer packaging | ❌ Add dependency |

---

## What Stays the Same

- Inbox, Team, Calendar, Review views — unchanged
- Zustand stores, CSS modules, all UI — unchanged
- MCP server code — unchanged
- Data format (JSON files) — unchanged
- Copilot CLI prompts — unchanged
- WorkIQ, ADO MCP integrations — unchanged

## What Changes

- Start/End My Day views gain an embedded terminal panel
- Electron main process gains PTY management IPC handlers
- Storage module gains env var override
- App gets an installer and setup wizard

---

## Future Considerations

- **Conflict detection:** Watch for OneDrive "conflicted copy" files, surface warning in app
- **File watcher debouncing:** OneDrive may trigger multiple write events during sync
- **Terminal history:** Persist terminal sessions so user can review past workflow runs
- **Graph API migration:** If you later register a corp app, can replace CLI workflows with direct API calls for a fully self-contained experience (no CLI dependency)
