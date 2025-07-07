declare module 'intuit-oauth' {
  interface OAuthClientConfig {
    clientId: string
    clientSecret: string
    environment: 'sandbox' | 'production'
    redirectUri: string
  }

  interface Token {
    access_token: string
    refresh_token: string
    realmId: string
    expires_in: number
  }

  interface AuthResponse {
    token: Token
  }

  interface ApiCallOptions {
    url: string
    method: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    body?: string
  }

  interface ApiResponse {
    status: number
    statusText: string
    body: string
    headers: Record<string, string>
  }

  class OAuthClient {
    constructor(config: OAuthClientConfig)
    
    static scopes: {
      Accounting: string
      OpenId: string
    }

    authorizeUri(options: { scope: string[], state: string }): string
    createToken(callbackUrl: string): Promise<AuthResponse>
    refresh(): Promise<AuthResponse>
    setToken(token: Partial<Token>): void
    makeApiCall(options: ApiCallOptions): Promise<ApiResponse>
  }

  export = OAuthClient
} 