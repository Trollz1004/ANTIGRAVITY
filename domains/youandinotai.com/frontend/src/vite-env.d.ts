/// <reference types="vite/client" />

declare module 'socket.io-client' {
  export interface Socket {
    on(event: string, listener: (...args: any[]) => void): this;
    disconnect(): this;
  }

  export function io(
    uri?: string,
    opts?: {
      auth?: Record<string, unknown>;
      transports?: string[];
      [key: string]: unknown;
    }
  ): Socket;
}
