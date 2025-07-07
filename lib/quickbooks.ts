import OAuthClient from 'intuit-oauth'

// QuickBooks API Types
export interface QuickBooksConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  environment: 'sandbox' | 'production'
}

export interface QuickBooksTokens {
  accessToken: string
  refreshToken: string
  realmId: string
  expiresAt: Date
}

export interface QuickBooksCustomer {
  Id: string
  DisplayName?: string
  Name?: string
  PrimaryEmailAddr?: { Address: string }
  EmailAddress?: string
  PrimaryPhone?: { FreeFormNumber: string }
  Phone?: string
  BillAddr?: {
    Line1?: string
    City?: string
    CountrySubDivisionCode?: string
    PostalCode?: string
    Country?: string
  }
  Active?: boolean
  MetaData?: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

export interface QuickBooksService {
  Id: string
  Name: string
  Description?: string
  UnitPrice: number
  Active?: boolean
  MetaData?: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

export interface QuickBooksInvoice {
  Id: string
  DocNumber?: string
  CustomerRef: {
    value: string
    name?: string
  }
  Line: Array<{
    Amount: number
    DetailType: 'SalesItemLineDetail'
    SalesItemLineDetail: {
      ItemRef: {
        value: string
        name?: string
      }
      Qty: number
      UnitPrice: number
    }
  }>
  TotalAmt: number
  Balance: number
  DueDate?: string
  ShipDate?: string
  TxnDate: string
  PrivateNote?: string
  MetaData?: {
    CreateTime: string
    LastUpdatedTime: string
  }
}

export interface QuickBooksInvoiceResponse {
  Invoice: QuickBooksInvoice
  time: string
}

export interface QuickBooksCustomerResponse {
  Customer: QuickBooksCustomer
  time: string
}

export interface QuickBooksServiceResponse {
  Item: QuickBooksService
  time: string
}

export interface QuickBooksQueryResponse<T> {
  QueryResponse: {
    [key: string]: T[]
  } & {
    maxResults: number
    startPosition: number
    totalCount: number
  }
  time: string
}

class QuickBooksAPI {
  private config: QuickBooksConfig
  private oauthClient: OAuthClient

  constructor(config: QuickBooksConfig) {
    this.config = config
    this.oauthClient = new OAuthClient({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      environment: config.environment,
      redirectUri: config.redirectUri
    })
  }

  private validateConfig(): void {
    if (!this.config) {
      throw new Error('QuickBooks configuration is not initialized')
    }
    if (!this.config.clientId) {
      throw new Error('QuickBooks client ID is missing')
    }
    if (!this.config.redirectUri) {
      throw new Error('QuickBooks redirect URI is missing')
    }
    if (!this.config.environment) {
      throw new Error('QuickBooks environment is missing')
    }
  }

  getAuthorizationURL(state: string): string {
    this.validateConfig()

    const authUri = this.oauthClient.authorizeUri({
      scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
      state: state
    })

    return authUri
  }

  async exchangeCodeForTokens(callbackUrl: string): Promise<QuickBooksTokens> {
    this.validateConfig()

    try {
      console.log('Exchanging tokens for callback URL:', callbackUrl)
      const authResponse = await this.oauthClient.createToken(callbackUrl)
      const token = authResponse.token
      
      console.log('Token exchange successful:', {
        hasAccessToken: !!token.access_token,
        hasRefreshToken: !!token.refresh_token,
        realmId: token.realmId,
        expiresIn: token.expires_in
      })
      
      return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        realmId: token.realmId,
        expiresAt: new Date(Date.now() + token.expires_in * 1000)
      }
    } catch (error) {
      console.error('Token exchange error:', error)
      throw new Error(`QuickBooks OAuth error: ${error}`)
    }
  }

  async refreshTokens(refreshToken: string): Promise<QuickBooksTokens> {
    this.validateConfig()

    try {
      this.oauthClient.setToken({
        refresh_token: refreshToken
      })
      
      const authResponse = await this.oauthClient.refresh()
      const token = authResponse.token
      
      return {
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        realmId: token.realmId,
        expiresAt: new Date(Date.now() + token.expires_in * 1000)
      }
    } catch (error) {
      console.error('Token refresh error:', error)
      throw new Error(`QuickBooks token refresh error: ${error}`)
    }
  }

  private async makeApiCall<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: any, tokens?: QuickBooksTokens): Promise<T> {
    if (!tokens) {
      throw new Error('QuickBooks tokens are required')
    }

    // Create a fresh OAuth client instance for each call to ensure proper token handling
    const oauthClient = new OAuthClient({
      clientId: this.config.clientId,
      clientSecret: this.config.clientSecret,
      environment: this.config.environment,
      redirectUri: this.config.redirectUri
    })

    // Set the tokens in the OAuth client
    oauthClient.setToken({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
      realmId: tokens.realmId
    })

    const baseUrl = this.config.environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com'

    const url = `${baseUrl}/v3/company/${tokens.realmId}${endpoint}${endpoint.includes('?') ? '&' : '?'}minorversion=40`

    console.log('Making QuickBooks API call:', {
      url,
      method,
      endpoint,
      realmId: tokens.realmId,
      hasAccessToken: !!tokens.accessToken
    })

    try {
      const requestOptions: any = {
        url,
        method,
        headers: {
          'Accept': 'application/json'
        }
      }

      // Only add Content-Type for POST/PUT requests with body
      if (method !== 'GET' && body) {
        requestOptions.headers['Content-Type'] = 'application/json'
        requestOptions.body = JSON.stringify(body)
      }

      const response = await oauthClient.makeApiCall(requestOptions)

      console.log('QuickBooks API response:', {
        status: response.status,
        statusText: response.statusText,
        bodyType: typeof response.body,
        bodyLength: response.body?.length,
        bodyPreview: response.body?.substring(0, 200)
      })

      // Check if response body exists and is valid
      if (response.body === undefined || response.body === null) {
        throw new Error('Empty response body from QuickBooks API')
      }

      if (typeof response.body !== 'string') {
        throw new Error(`Invalid response body type: ${typeof response.body}`)
      }

      if (response.body === 'undefined') {
        throw new Error('QuickBooks API returned "undefined" as response body')
      }

      if (response.body.trim() === '') {
        throw new Error('QuickBooks API returned empty response body')
      }

      try {
        const parsedResponse = JSON.parse(response.body)
        console.log('Parsed response successfully:', {
          hasQueryResponse: !!parsedResponse.QueryResponse,
          hasTime: !!parsedResponse.time,
          responseKeys: Object.keys(parsedResponse)
        })
        return parsedResponse
      } catch (parseError) {
        console.error('JSON parse error:', parseError)
        console.error('Response body that failed to parse:', response.body)
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }
    } catch (error) {
      console.error('API call error details:', {
        error: error instanceof Error ? error.message : error,
        url,
        method,
        endpoint,
        realmId: tokens.realmId
      })
      throw new Error(`QuickBooks API error: ${error instanceof Error ? error.message : error}`)
    }
  }

  // Customer operations
  async createCustomer(customer: Omit<QuickBooksCustomer, 'Id'>, tokens: QuickBooksTokens): Promise<QuickBooksCustomer> {
    const response = await this.makeApiCall<QuickBooksCustomerResponse>('/customer', 'POST', { Customer: customer }, tokens)
    return response.Customer
  }

  async findCustomerByEmail(email: string, tokens: QuickBooksTokens): Promise<QuickBooksCustomer | null> {
    const query = `SELECT * FROM Customer WHERE PrimaryEmailAddr = '${email}'`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksCustomer>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Customer?.[0] || null
  }

  async getCustomers(tokens: QuickBooksTokens, maxResults: number = 20): Promise<QuickBooksCustomer[]> {
    const query = `select * from Customer maxresults ${maxResults}`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksCustomer>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Customer || []
  }

  // Service/Item operations
  async createService(service: Omit<QuickBooksService, 'Id'>, tokens: QuickBooksTokens): Promise<QuickBooksService> {
    const response = await this.makeApiCall<QuickBooksServiceResponse>('/item', 'POST', { Item: service }, tokens)
    return response.Item
  }

  async findServiceByName(name: string, tokens: QuickBooksTokens): Promise<QuickBooksService | null> {
    const query = `SELECT * FROM Item WHERE Name = '${name}' AND Type = 'Service'`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksService>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Item?.[0] || null
  }

  async getServices(tokens: QuickBooksTokens, maxResults: number = 20): Promise<QuickBooksService[]> {
    const query = `select * from Item where Type = 'Service' maxresults ${maxResults}`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksService>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Item || []
  }

  // Invoice operations
  async createInvoice(invoice: Omit<QuickBooksInvoice, 'Id'>, tokens: QuickBooksTokens): Promise<QuickBooksInvoice> {
    const response = await this.makeApiCall<QuickBooksInvoiceResponse>('/invoice', 'POST', { Invoice: invoice }, tokens)
    return response.Invoice
  }

  async getInvoice(invoiceId: string, tokens: QuickBooksTokens): Promise<QuickBooksInvoice> {
    const response = await this.makeApiCall<QuickBooksInvoiceResponse>(`/invoice/${invoiceId}`, 'GET', undefined, tokens)
    return response.Invoice
  }

  async getInvoices(tokens: QuickBooksTokens, maxResults: number = 100): Promise<QuickBooksInvoice[]> {
    const query = `SELECT * FROM Invoice ORDER BY TxnDate DESC MAXRESULTS ${maxResults}`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksInvoice>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Invoice || []
  }

  async updateInvoice(invoiceId: string, invoice: Partial<QuickBooksInvoice>, tokens: QuickBooksTokens): Promise<QuickBooksInvoice> {
    const response = await this.makeApiCall<QuickBooksInvoiceResponse>(`/invoice`, 'POST', { Invoice: { ...invoice, Id: invoiceId } }, tokens)
    return response.Invoice
  }

  // Company info operations
  async getCompanyInfo(tokens: QuickBooksTokens): Promise<{ CompanyName: string; [key: string]: any }> {
    const query = `select * from CompanyInfo`
    const response = await this.makeApiCall<QuickBooksQueryResponse<{ CompanyName: string; [key: string]: any }>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.CompanyInfo?.[0] || { CompanyName: 'Unknown Company' }
  }
}

// Configuration helper
const getQuickBooksConfig = (): QuickBooksConfig => {
  // Support both naming conventions for compatibility
  const clientId = process.env.QUICKBOOKS_CLIENT_ID || process.env.CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET || process.env.CLIENT_SECRET
  const redirectUri = process.env.QUICKBOOKS_REDIRECT_URI || process.env.REDIRECT_URL
  const environment = process.env.QUICKBOOKS_ENVIRONMENT || process.env.ENVIRONMENT

  console.log('QuickBooks Config Check:', {
    clientId: clientId ? '✓ Set' : '✗ Missing',
    clientSecret: clientSecret ? '✓ Set' : '✗ Missing',
    redirectUri: redirectUri ? '✓ Set' : '✗ Missing',
    environment: environment || '✗ Missing'
  })

  if (!clientId) {
    throw new Error('QUICKBOOKS_CLIENT_ID environment variable is missing. Please add it to your .env.local file.')
  }
  if (!clientSecret) {
    throw new Error('QUICKBOOKS_CLIENT_SECRET environment variable is missing. Please add it to your .env.local file.')
  }
  if (!redirectUri) {
    throw new Error('QUICKBOOKS_REDIRECT_URI environment variable is missing. Please add it to your .env.local file.')
  }
  if (!environment) {
    throw new Error('QUICKBOOKS_ENVIRONMENT environment variable is missing. Please add it to your .env.local file.')
  }
  if (environment !== 'sandbox' && environment !== 'production') {
    throw new Error('QUICKBOOKS_ENVIRONMENT must be either "sandbox" or "production"')
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    environment: environment as 'sandbox' | 'production'
  }
}

// Singleton instance
let quickbooksAPIInstance: QuickBooksAPI | null = null

const getQuickBooksAPI = (): QuickBooksAPI => {
  if (!quickbooksAPIInstance) {
    const config = getQuickBooksConfig()
    quickbooksAPIInstance = new QuickBooksAPI(config)
  }
  return quickbooksAPIInstance
}

// Public API
export const quickbooksAPI = {
  getAuthorizationURL: (state: string) => {
    try {
      return getQuickBooksAPI().getAuthorizationURL(state)
    } catch (error) {
      console.error('Error in quickbooksAPI.getAuthorizationURL:', error)
      throw error
    }
  },

  exchangeCodeForTokens: (callbackUrl: string) => {
    try {
      return getQuickBooksAPI().exchangeCodeForTokens(callbackUrl)
    } catch (error) {
      console.error('Error in quickbooksAPI.exchangeCodeForTokens:', error)
      throw error
    }
  },

  refreshTokens: (refreshToken: string) => {
    try {
      return getQuickBooksAPI().refreshTokens(refreshToken)
    } catch (error) {
      console.error('Error in quickbooksAPI.refreshTokens:', error)
      throw error
    }
  },

  // Customer operations
  createCustomer: (customer: Omit<QuickBooksCustomer, 'Id'>, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().createCustomer(customer, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.createCustomer:', error)
      throw error
    }
  },

  findCustomerByEmail: (email: string, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().findCustomerByEmail(email, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.findCustomerByEmail:', error)
      throw error
    }
  },

  getCustomers: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksAPI().getCustomers(tokens, maxResults)
    } catch (error) {
      console.error('Error in quickbooksAPI.getCustomers:', error)
      throw error
    }
  },

  // Service operations
  createService: (service: Omit<QuickBooksService, 'Id'>, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().createService(service, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.createService:', error)
      throw error
    }
  },

  findServiceByName: (name: string, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().findServiceByName(name, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.findServiceByName:', error)
      throw error
    }
  },

  getServices: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksAPI().getServices(tokens, maxResults)
    } catch (error) {
      console.error('Error in quickbooksAPI.getServices:', error)
      throw error
    }
  },

  // Invoice operations
  createInvoice: (invoice: Omit<QuickBooksInvoice, 'Id'>, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().createInvoice(invoice, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.createInvoice:', error)
      throw error
    }
  },

  getInvoice: (invoiceId: string, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().getInvoice(invoiceId, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.getInvoice:', error)
      throw error
    }
  },

  getInvoices: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksAPI().getInvoices(tokens, maxResults)
    } catch (error) {
      console.error('Error in quickbooksAPI.getInvoices:', error)
      throw error
    }
  },

  updateInvoice: (invoiceId: string, invoice: Partial<QuickBooksInvoice>, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().updateInvoice(invoiceId, invoice, tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.updateInvoice:', error)
      throw error
    }
  },

  // Company info operations
  getCompanyInfo: (tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksAPI().getCompanyInfo(tokens)
    } catch (error) {
      console.error('Error in quickbooksAPI.getCompanyInfo:', error)
      throw error
    }
  }
}

export { getQuickBooksAPI }
export default QuickBooksAPI 