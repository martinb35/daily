import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels } from '@shared/types';

const api = {
  invoke: (channel: IpcChannels, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.on(channel, (_event, ...args) => callback(...args));
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
