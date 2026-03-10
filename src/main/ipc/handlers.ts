import { ipcMain } from 'electron';
import { readJsonFile, writeJsonFile, getDataDir } from './storage';
import type { Task, TeamMember, TimeBlock, ReviewSnapshot, WeeklyScore } from '@shared/types';

function crudHandlers<T extends { id: string }>(entity: string, filename: string) {
  ipcMain.handle(`${entity}:list`, () => {
    return readJsonFile<T>(filename);
  });

  ipcMain.handle(`${entity}:get`, (_event, id: string) => {
    const items = readJsonFile<T>(filename);
    return items.find((item) => item.id === id) ?? null;
  });

  ipcMain.handle(`${entity}:create`, (_event, item: T) => {
    const items = readJsonFile<T>(filename);
    items.push(item);
    writeJsonFile(filename, items);
    return item;
  });

  ipcMain.handle(`${entity}:update`, (_event, updated: T) => {
    const items = readJsonFile<T>(filename);
    const index = items.findIndex((item) => item.id === updated.id);
    if (index === -1) throw new Error(`${entity} not found: ${updated.id}`);
    items[index] = updated;
    writeJsonFile(filename, items);
    return updated;
  });

  ipcMain.handle(`${entity}:delete`, (_event, id: string) => {
    const items = readJsonFile<T>(filename);
    const filtered = items.filter((item) => item.id !== id);
    writeJsonFile(filename, filtered);
    return { deleted: id };
  });
}

export function registerIpcHandlers() {
  crudHandlers<Task>('tasks', 'tasks.json');
  crudHandlers<TeamMember>('team', 'team.json');
  crudHandlers<TimeBlock>('timeblocks', 'timeblocks.json');
  crudHandlers<ReviewSnapshot>('reviews', 'reviews.json');
  crudHandlers<WeeklyScore>('scores', 'scores.json');

  ipcMain.handle('app:getDataPath', () => getDataDir());
}
