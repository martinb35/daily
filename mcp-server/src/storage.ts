import fs from 'fs';
import path from 'path';
import os from 'os';

// Compute the data directory the same way Electron does:
// Windows: %APPDATA%/daily/daily-data
// macOS:   ~/Library/Application Support/daily/daily-data
// Linux:   ~/.config/daily/daily-data
function resolveDataDir(): string {
  if (process.env.DAILY_DATA_DIR) {
    return process.env.DAILY_DATA_DIR;
  }

  const platform = os.platform();
  let appData: string;
  if (platform === 'win32') {
    appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  } else if (platform === 'darwin') {
    appData = path.join(os.homedir(), 'Library', 'Application Support');
  } else {
    appData = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
  }
  return path.join(appData, 'daily', 'daily-data');
}

const dataDir = resolveDataDir();

function ensureDataDir(): void {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getDataDir(): string {
  return dataDir;
}

export function readJsonFile<T>(filename: string): T[] {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw) as T[];
}

export function writeJsonFile<T>(filename: string, data: T[]): void {
  ensureDataDir();
  const filePath = path.join(dataDir, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}
