export interface IWebkitAPI {
  messageHandlers?: Record<
    string,
    {
      postMessage: (data: string) => void
    }
  >
}

export interface WebkitEvent {
  detail: string
}

declare global {
  interface Window {
    webkit?: IWebkitAPI
  }
}
