export interface IWebkitAPI {
  messageHandlers: {
    webkit?: {
      messageHandlers: Record<
        string,
        {
          postMessage: (data: string) => void
        }
      >
    }
  }
}

declare global {
  interface Window {
    webkit?: IWebkitAPI
  }
}
