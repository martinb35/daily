import type { IpcChannels } from '@shared/types';

declare global {
  interface Window {
    electronAPI: {
      invoke: (channel: IpcChannels, ...args: unknown[]) => Promise<unknown>;
      on: (channel: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}
