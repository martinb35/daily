import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannels } from '@shared/types';

const api = {
  invoke: (channel: IpcChannels, ...args: unknown[]) => {
    return ipcRenderer.invoke(channel, ...args);
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);
