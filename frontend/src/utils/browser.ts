import { useCallback } from 'react'

export const useGetBrowserDisplayName = (): (() => Promise<string>) => {
  // Taken from https://developer.mozilla.org/en-US/docs/Web/API/Window/navigator
  // The order matters here, and this may report false positives for unlisted browsers.
  const userAgent = navigator.userAgent
  return useCallback(async (): Promise<string> => {
    // @ts-expect-error brave exists in navigator only in brave browser
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unnecessary-condition
    if ((navigator.brave && (await navigator.brave.isBrave())) || false) {
      return 'Brave'
    }
    if (userAgent.includes('Firefox')) {
      // "Mozilla/5.0 (X11; Linux i686; rv:104.0) Gecko/20100101 Firefox/104.0"
      return 'Firefox'
    } else if (userAgent.includes('SamsungBrowser')) {
      // "Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-G955F Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/9.4 Chrome/67.0.3396.87 Mobile Safari/537.36"
      return 'Samsung Internet'
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      // "Mozilla/5.0 (Macintosh; Intel Mac OS X 12_5_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 OPR/90.0.4480.54"
      return 'Opera'
    } else if (userAgent.includes('Edg')) {
      // "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 Edg/104.0.1293.70"
      return 'Edge'
    } else if (userAgent.includes('Chrome')) {
      // "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36"
      return 'Chrome'
    } else if (userAgent.includes('Safari')) {
      // "Mozilla/5.0 (iPhone; CPU iPhone OS 15_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Mobile/15E148 Safari/604.1"
      return 'Safari'
    } else {
      return 'Browser'
    }
  }, [userAgent])
}
