# Standalone Daily App — Multi-Machine Plan

## Problem

Daily runs as an Electron app on one PC with local JSON data files. The Start My Day and End My Day workflows require coordinating with GitHub Copilot CLI (for WorkIQ/M365 access and AI reasoning). To use Daily on another machine today, you'd need to remote into the primary PC.

**Goal:** Package Daily as a portable Electron app, store data in OneDrive for Business, and publish releases on GitHub so any Windows machine can run it.

---

## Solution: Portable Electron App + OneDrive Data

### Architecture

```
OneDrive for Business
  └── Daily/
        ├── tasks.json
        ├── scores.json
        ├── timeblocks.json
        ├── team.json
        └── reviews.json
              ↕ (OneDrive auto-sync)

MACHINE A:                              MACHINE B:
  Daily.exe (from GitHub Release)         Daily.exe (from GitHub Release)
    ├── reads/writes OneDrive folder       ├── reads/writes OneDrive folder
    ├── embedded terminal (xterm.js)       ├── embedded terminal (xterm.js)
    └── bundled MCP server                 └── bundled MCP server
```

### Why This Works

- **Portable `.exe`** — No install needed, download from GitHub Release and run
- **OneDrive syncs data** — Already on every corp machine, no ports/firewall/VPN
- **GitHub Releases for distribution** — Private repo = private releases, version-tagged
- **Embedded terminal** — Start/End My Day workflows run inside the app via Copilot CLI
- **Bundled MCP server** — No separate install step, app ships with everything

---

## Implementation Plan

### Phase 1: Packaging & GitHub Releases
- [ ] Add `electron-builder` as a dev dependency
- [ ] Configure `electron-builder` in `package.json`:
  - Target: `portable` (single `.exe`, no installer) + `nsis` (optional installer)
  - Output: `dist/` directory
  - App icon, name, version metadata
- [ ] Add `"dist"` script: `electron-builder --win portable`
- [ ] Bundle the `mcp-server/` into the app resources (`extraResources`)
- [ ] Test portable build locally — verify it runs without dev tooling
- [ ] Create a GitHub Actions workflow (`.github/workflows/release.yml`):
  - Trigger on version tags (`v*`)
  - Run `npm ci && npm run build && npm run dist`
  - Upload `.exe` to GitHub Release as asset
- [ ] Tag `v1.0.0` and push to create first release

### Phase 2: OneDrive Data Sync
- [ ] Update `src/main/ipc/storage.ts` to check `DAILY_DATA_DIR` env var
- [ ] Mirror the resolution logic from `mcp-server/src/storage.ts`
- [ ] Create `Daily` folder in OneDrive for Business
- [ ] Move JSON files from `%APPDATA%\daily\daily-data\` to OneDrive folder
- [ ] Set `DAILY_DATA_DIR` on primary machine, verify app + MCP both work
- [ ] Test sync by modifying data on one machine and confirming on another

### Phase 3: Embedded Terminal
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

### Phase 4: First-Run Setup Wizard
- [ ] Detect if Copilot CLI is installed (`gh copilot --version`)
- [ ] Check if MCP servers are registered in `~/.copilot/mcp-config.json`
- [ ] If not, walk user through:
  - Install Copilot CLI link/instructions
  - Auto-register the bundled MCP server
  - Prompt for `DAILY_DATA_DIR` (browse to OneDrive folder)
- [ ] Show setup status on Settings/About page

---

## New Machine Setup (End State)

1. **Download `Daily.exe`** from GitHub Release (private repo)
2. **Run it** — no install needed
3. **First-run wizard** prompts for OneDrive data folder, registers MCP server
4. **Install Copilot CLI** if not present (wizard links to instructions)
5. **Done** — app works with synced data and embedded CLI workflows

---

## GitHub Release Details

- **Repo:** Private (`martinb35/daily`) — releases only visible to you
- **Release assets:** `Daily-{version}-portable.exe` (~80-120MB)
- **Automation:** GitHub Actions builds on `v*` tags
- **Auto-update:** `electron-updater` checks GitHub Releases for new versions, prompts to download

### Release workflow

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npx electron-builder --win portable
      - uses: softprops/action-gh-release@v2
        with:
          files: dist/*.exe
```

---

## Dependencies

| Dependency | Purpose | Already Have? |
|------------|---------|---------------|
| OneDrive for Business | Data sync | ✅ Yes |
| `DAILY_DATA_DIR` env var (MCP) | Custom data path | ✅ Yes |
| `DAILY_DATA_DIR` env var (Electron) | Custom data path | ❌ ~5 lines |
| xterm.js | Terminal emulator UI | ❌ Add dependency |
| node-pty | PTY subprocess management | ❌ Add dependency |
| electron-builder | Packaging & distribution | ❌ Add dev dependency |
| electron-updater | Auto-update from GitHub Releases | ❌ Add dependency |
| Copilot CLI | AI workflows | ✅ Yes (per machine) |
| daily-data MCP server | Data tools for CLI | ✅ Yes (bundled) |

---

## What Stays the Same

- Inbox, Team, Calendar, Review views — unchanged
- Zustand stores, CSS modules, all UI — unchanged
- MCP server code — unchanged (bundled as `extraResources`)
- Data format (JSON files) — unchanged
- Copilot CLI prompts — unchanged
- WorkIQ, ADO MCP integrations — unchanged

## What Changes

- App packaged as portable `.exe` via electron-builder
- MCP server bundled inside the app package
- Storage module gains `DAILY_DATA_DIR` env var override
- Start/End My Day views gain an embedded terminal panel
- Electron main process gains PTY management IPC handlers
- First-run wizard for setup on new machines
- GitHub Actions workflow for automated releases

---

## Future Considerations

- **Conflict detection:** Watch for OneDrive "conflicted copy" files, surface warning in app
- **File watcher debouncing:** OneDrive may trigger multiple write events during sync
- **Terminal history:** Persist terminal sessions so user can review past workflow runs
- **Mac/Linux support:** electron-builder supports cross-platform builds if needed later
- **Graph API migration:** If you later register a corp app, can replace CLI workflows with direct API calls (no CLI dependency)
- **Code signing:** Sign the `.exe` to avoid Windows SmartScreen warnings
