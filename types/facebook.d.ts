// Facebook SDK TypeScript declarations

interface FacebookLoginStatusResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: {
    accessToken: string
    expiresIn: number
    signedRequest: string
    userID: string
  }
}

interface FacebookMeResponse {
  id: string
  name?: string
  picture?: {
    data: {
      url: string
      is_silhouette: boolean
    }
  }
}

interface FacebookSDK {
  init(params: {
    appId: string
    cookie?: boolean
    xfbml?: boolean
    version: string
  }): void
  login(
    callback: (response: FacebookLoginStatusResponse) => void,
    options?: { scope: string; return_scopes?: boolean }
  ): void
  logout(callback?: (response: unknown) => void): void
  getLoginStatus(callback: (response: FacebookLoginStatusResponse) => void): void
  api(
    path: string,
    params: Record<string, string>,
    callback: (response: FacebookMeResponse) => void
  ): void
}

interface Window {
  fbAsyncInit?: () => void
  FB?: FacebookSDK
}
