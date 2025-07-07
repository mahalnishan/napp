// Direct QuickBooks API implementation without intuit-oauth dependency
// This is a backup implementation that uses direct fetch calls

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

class QuickBooksDirectAPI {
  private config: QuickBooksConfig

  constructor(config: QuickBooksConfig) {
    this.config = config
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

    const authParams = {
      client_id: this.config.clientId,
      response_type: 'code',
      scope: 'com.intuit.quickbooks.accounting openid_connect',
      redirect_uri: this.config.redirectUri,
      state: state
    }

    const queryString = new URLSearchParams(authParams).toString()
    return `https://appcenter.intuit.com/connect/oauth2?${queryString}`
  }

  async exchangeCodeForTokens(code: string, realmId: string): Promise<QuickBooksTokens> {
    this.validateConfig()

    const requestData = {
      url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      method: 'POST'
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: this.config.redirectUri
    }).toString()

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`QuickBooks OAuth error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      realmId: realmId,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }
  }

  async refreshTokens(refreshToken: string): Promise<QuickBooksTokens> {
    this.validateConfig()

    const requestData = {
      url: 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer',
      method: 'POST'
    }

    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    }).toString()

    const response = await fetch(requestData.url, {
      method: requestData.method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')}`
      },
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`QuickBooks token refresh error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      realmId: data.realmId,
      expiresAt: new Date(Date.now() + data.expires_in * 1000)
    }
  }

  private async makeApiCall<T>(endpoint: string, method: 'GET' | 'POST' | 'PUT' = 'GET', body?: any, tokens?: QuickBooksTokens): Promise<T> {
    if (!tokens) {
      throw new Error('QuickBooks tokens are required')
    }

    const baseUrl = this.config.environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com'

    const url = `${baseUrl}/v3/company/${tokens.realmId}${endpoint}${endpoint.includes('?') ? '&' : '?'}minorversion=40`

    const requestOptions: RequestInit = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${tokens.accessToken}`
      }
    }

    // Only add Content-Type for POST/PUT requests with body
    if (method !== 'GET' && body) {
      requestOptions.headers = {
        ...requestOptions.headers,
        'Content-Type': 'application/json'
      }
      requestOptions.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(url, requestOptions)

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status} - ${response.statusText}`)
      }

      const responseText = await response.text()

      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response body from QuickBooks API')
      }

      try {
        const parsedResponse = JSON.parse(responseText)
        return parsedResponse
      } catch (parseError) {
        throw new Error(`Failed to parse JSON response: ${parseError}`)
      }
    } catch (error) {
      throw error
    }
  }

  // Customer operations
  async createCustomer(tokens: QuickBooksTokens, customerData: any): Promise<any> {
    try {
      // Build the customer object for QuickBooks
      const customer: any = {
        Name: customerData.name
      }

      // Add email if provided
      if (customerData.email && customerData.email.trim() !== '') {
        customer.PrimaryEmailAddr = {
          Address: customerData.email.trim()
        }
      }

      // Add phone if provided
      if (customerData.phone && customerData.phone.trim() !== '') {
        customer.PrimaryPhone = {
          FreeFormNumber: customerData.phone.trim()
        }
      }

      // Add address if provided
      if (customerData.address && customerData.address.trim() !== '') {
        customer.BillAddr = {
          Line1: customerData.address.trim()
        }
      }

      // Try the /customer endpoint (though it may not work)
      const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
      const url = `${baseUrl}/v3/company/${tokens.realmId}/customer?minorversion=40`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`
        },
        body: JSON.stringify({ Customer: customer })
      })

      const responseText = await response.text()
      
      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status} - ${response.statusText} - ${responseText}`)
      }

      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response body from QuickBooks API')
      }

      const data = JSON.parse(responseText)
      return data

    } catch (error) {
      throw error
    }
  }

  async findCustomerByEmail(email: string, tokens: QuickBooksTokens): Promise<QuickBooksCustomer | null> {
    const query = `select * from Customer where PrimaryEmailAddr = '${email}'`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksCustomer>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Customer?.[0] || null
  }

  async getCustomers(tokens: QuickBooksTokens, maxResults: number = 20): Promise<QuickBooksCustomer[]> {
    const query = `select * from Customer maxresults ${maxResults}`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksCustomer>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Customer || []
  }

  // Service/Item operations
  async createService(tokens: QuickBooksTokens, serviceData: any): Promise<any> {
    try {
      // Build the service object for QuickBooks
      const service: any = {
        Name: serviceData.name,
        Type: 'Service'
      }

      // Add description if provided
      if (serviceData.description && serviceData.description.trim() !== '') {
        service.Description = serviceData.description.trim()
      }

      // Use the /item endpoint which should work for service creation
      const baseUrl = 'https://sandbox-quickbooks.api.intuit.com'
      const url = `${baseUrl}/v3/company/${tokens.realmId}/item?minorversion=40`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.accessToken}`
        },
        body: JSON.stringify({ Item: service })
      })

      const responseText = await response.text()
      
      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.status} - ${response.statusText} - ${responseText}`)
      }

      if (!responseText || responseText.trim() === '') {
        throw new Error('Empty response body from QuickBooks API')
      }

      const data = JSON.parse(responseText)
      return data

    } catch (error) {
      throw error
    }
  }

  async findServiceByName(name: string, tokens: QuickBooksTokens): Promise<QuickBooksService | null> {
    const query = `select * from Item where Name = '${name}' and Type = 'Service'`
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
    const response = await this.makeApiCall<{ Invoice: QuickBooksInvoice }>('/invoice', 'POST', { Invoice: invoice }, tokens)
    return response.Invoice
  }

  async getInvoices(tokens: QuickBooksTokens, maxResults: number = 20): Promise<QuickBooksInvoice[]> {
    const query = `select * from Invoice order by TxnDate desc maxresults ${maxResults}`
    const response = await this.makeApiCall<QuickBooksQueryResponse<QuickBooksInvoice>>(`/query?query=${encodeURIComponent(query)}`, 'GET', undefined, tokens)
    
    return response.QueryResponse.Invoice || []
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
let quickbooksDirectAPIInstance: QuickBooksDirectAPI | null = null

const getQuickBooksDirectAPI = (): QuickBooksDirectAPI => {
  if (!quickbooksDirectAPIInstance) {
    const config = getQuickBooksConfig()
    quickbooksDirectAPIInstance = new QuickBooksDirectAPI(config)
  }
  return quickbooksDirectAPIInstance
}

// Public API
export const quickbooksDirectAPI = {
  getAuthorizationURL: (state: string) => {
    try {
      return getQuickBooksDirectAPI().getAuthorizationURL(state)
    } catch (error) {
      throw error
    }
  },

  exchangeCodeForTokens: (code: string, realmId: string) => {
    try {
      return getQuickBooksDirectAPI().exchangeCodeForTokens(code, realmId)
    } catch (error) {
      throw error
    }
  },

  refreshTokens: (refreshToken: string) => {
    try {
      return getQuickBooksDirectAPI().refreshTokens(refreshToken)
    } catch (error) {
      throw error
    }
  },

  // Customer operations
  createCustomer: (tokens: QuickBooksTokens, customerData: any) => {
    try {
      return getQuickBooksDirectAPI().createCustomer(tokens, customerData)
    } catch (error) {
      throw error
    }
  },

  findCustomerByEmail: (email: string, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksDirectAPI().findCustomerByEmail(email, tokens)
    } catch (error) {
      throw error
    }
  },

  getCustomers: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksDirectAPI().getCustomers(tokens, maxResults)
    } catch (error) {
      throw error
    }
  },

  // Service operations
  createService: (tokens: QuickBooksTokens, serviceData: any) => {
    try {
      return getQuickBooksDirectAPI().createService(tokens, serviceData)
    } catch (error) {
      throw error
    }
  },

  findServiceByName: (name: string, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksDirectAPI().findServiceByName(name, tokens)
    } catch (error) {
      throw error
    }
  },

  getServices: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksDirectAPI().getServices(tokens, maxResults)
    } catch (error) {
      throw error
    }
  },

  // Invoice operations
  createInvoice: (invoice: Omit<QuickBooksInvoice, 'Id'>, tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksDirectAPI().createInvoice(invoice, tokens)
    } catch (error) {
      throw error
    }
  },

  getInvoices: (tokens: QuickBooksTokens, maxResults?: number) => {
    try {
      return getQuickBooksDirectAPI().getInvoices(tokens, maxResults)
    } catch (error) {
      throw error
    }
  },

  // Company info operations
  getCompanyInfo: (tokens: QuickBooksTokens) => {
    try {
      return getQuickBooksDirectAPI().getCompanyInfo(tokens)
    } catch (error) {
      throw error
    }
  }
} 