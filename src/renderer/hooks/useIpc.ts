import type { IpcChannels } from '@shared/types';

export function useIpc() {
  async function invoke<T>(channel: IpcChannels, ...args: unknown[]): Promise<T> {
    return window.electronAPI.invoke(channel, ...args) as Promise<T>;
  }

  return { invoke };
}
