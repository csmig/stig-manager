class OIDCWorker {
  constructor() {
    this.tokens = {
      accessToken: null,
      idToken: null,
      refreshToken: null
    }
    this.ENV = null
    this.oidcProvider = null
    this.oidcConfiguration = null
    this.initialized = false
    this.authorization = null
    this.bc = new BroadcastChannel('stigman-oidc-worker')
  }

  async initialize(options) {
    if (!this.initialized) {
      this.initialized = true
      this.redirectUri = options.redirectUri
      const resp = await fetch('Oauth.json')
      this.ENV = await resp.json()
      
      this.oidcProvider = this.ENV.authority
      this.clientId = this.ENV.clientId
      this.autoRefresh = this.ENV.autoRefresh
      this.scope = this.getScopeStr()
      this.responseMode = this.ENV.responseMode
      this.oidcConfiguration = await this.getOpenIdConfiguration()
    }
    return {success: true}
  }

  getScopeStr() {
    const scopePrefix = this.ENV.scopePrefix
    let scopes = [
      `${scopePrefix}stig-manager:stig`,
      `${scopePrefix}stig-manager:stig:read`,
      `${scopePrefix}stig-manager:collection`,
      `${scopePrefix}stig-manager:user`,
      `${scopePrefix}stig-manager:user:read`,
      `${scopePrefix}stig-manager:op`
    ]
    if (this.ENV.extraScopes) {
      scopes.push(...this.ENV.extraScopes.split(" "))
    }
    return scopes.join(" ")
  }

  async getOpenIdConfiguration() {
    if (this.oidcConfiguration) {
      return this.oidcConfiguration
    }
    const url = `${this.oidcProvider}/.well-known/openid-configuration`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`failed to get: ${url}`)
    }
    this.oidcConfiguration = await response.json()
    return this.oidcConfiguration
  }

  async getAuthorizationUrl() {
    if (this.authorization) return this.authorization
    const pkce = await this.getPkce()
    const oidcState = crypto.randomUUID()
    const params = new URLSearchParams()
    params.append('client_id', this.clientId)
    params.append('redirect_uri', this.redirectUri)
    params.append('state', oidcState)
    params.append('response_mode', this.responseMode)
    params.append('response_type', 'code')
    params.append('scope', this.scope)
    params.append('nonce', crypto.randomUUID())
    params.append('code_challenge', pkce.codeChallenge)
    params.append('code_challenge_method', 'S256')

    const authEndpoint = this.oidcConfiguration.authorization_endpoint
    const redirect = `${authEndpoint}?${params.toString()}`
    this.authorization = {redirect, codeVerifier: pkce.codeVerifier}
    return this.authorization
  }

  async getPkce() {
    function dec2hex(dec) {
      return ('0' + dec.toString(16)).substr(-2)
    }

    function generateRandomString() {
      const array = new Uint32Array(56 / 2)
      crypto.getRandomValues(array)
      return Array.from(array, dec2hex).join('')
    }

    async function sha256(plain) {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return crypto.subtle.digest('SHA-256', data)
    }

    function base64UrlEncode(a) {
      let str = ''
      const bytes = new Uint8Array(a)
      const len = bytes.byteLength
      for (let i = 0; i < len; i++) {
        str += String.fromCharCode(bytes[i])
      }
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    }

    async function challengeFromVerifier(v) {
      const hashed = await sha256(v)
      const base64encoded = base64UrlEncode(hashed)
      return base64encoded
    }

    const codeVerifier = generateRandomString()
    const codeChallenge = await challengeFromVerifier(codeVerifier)
    return { codeChallenge, codeVerifier }
  }

  getAccessToken() {
    if (!this.tokens.accessToken) {
      console.log('[OIDCWORKER] No access token, redirecting to authorization')
      return this.getAuthorizationUrl()
    }
    console.log('[OIDCWORKER] Access token', this.tokens.accessToken)
    return {
      accessToken: this.tokens.accessToken,
      access_token: this.tokens.accessToken,
      accessTokenDecoded: this.decodeToken(this.tokens.accessToken)
    }
  }

  decodeToken(str) {
    try {
      str = str.split('.')[1]
      str = str.replace(/-/g, '+')
      str = str.replace(/_/g, '/')
      switch (str.length % 4) {
        case 0: break
        case 2: str += '=='; break
        case 3: str += '='; break
        default: throw new Error('Invalid token')
      }
      str = decodeURIComponent(escape(atob(str)))
      str = JSON.parse(str)
      return str
    } catch {
      return false
    }
  }

  setAccessTokenExpiration(expiration) {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = expiration - now
    if (expiresIn > 0) {
      clearTimeout(this.accessTimeoutId)
      console.log('[OIDCWORKER] Access token expires in', expiresIn, 'seconds')
      this.accessTimeoutId = setTimeout(async () => {
        this.tokens.accessToken = null
        console.log('[OIDCWORKER] Access token expired, attempting refresh')
        await this.refreshAccessToken()
      }, expiresIn * 1000)
    }
  }

  async broadcastNoToken() {
    const orginalRedirectUri = this.redirectUri
    this.redirectUri = `${this.redirectUri}popup.html`
    const redirect = await this.getAuthorizationUrl()
    this.redirectUri = orginalRedirectUri
    this.bc.postMessage({ type: 'noToken', ...redirect })
  }

  setRefreshTokenExpiration(expiration) {
    const now = Math.floor(Date.now() / 1000)
    const expiresIn = expiration - now
    if (expiresIn > 0) {
        clearTimeout(this.refreshTimeoutId)
        console.log('[OIDCWORKER] Refresh token expires in', expiresIn, 'seconds')
        this.refreshTimeoutId = setTimeout(async () => {
          this.tokens.refreshToken = null
          await this.broadcastNoToken()
        }, expiresIn * 1000)
    }
  }

  setTokens(tokensResponse) {
    this.tokens.accessToken = tokensResponse.access_token
    this.tokens.idToken = tokensResponse.id_token
    this.tokens.refreshToken = tokensResponse.refresh_token
    this.bc.postMessage({ type: 'accessToken', accessToken: this.tokens.accessToken })
    const accessTokenDecoded = this.decodeToken(this.tokens.accessToken)
    this.setAccessTokenExpiration(accessTokenDecoded.exp)
    const refreshTokenDecoded = this.decodeToken(this.tokens.refreshToken)
    this.setRefreshTokenExpiration(refreshTokenDecoded.exp)
  }

  clearAccessToken() {
    this.tokens.accessToken = null
    this.tokens.idToken = null
    // this.tokens.refreshToken = null
    this.broadcastNoToken()

  }

  async refreshAccessToken() {
    if (!this.tokens.refreshToken) {
      await this.broadcastNoToken()
      return
    }
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('client_id', this.clientId)
    params.append('refresh_token', this.tokens.refreshToken)

    try {
      const response = await fetch(this.oidcConfiguration.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })
      const tokensResponse = await response.json()
      if (!response.ok) {
        console.log('Refresh token failed', tokensResponse)
        clearAccessToken()
      }
      else {
        this.setTokens(tokensResponse)
      }
    }
    catch {
      clearAccessToken()
    }
    return this.getAccessToken()
  }

  async exchangeCodeForToken({ code, codeVerifier, clientId = 'stig-manager', redirectUri }) {
    if (this.authorization?.codeVerifier === codeVerifier) this.authorization = null
    console.log('[OIDCWORKER] Exchange code for token', code, codeVerifier)
    const params = new URLSearchParams()
    params.append('grant_type', 'authorization_code')
    params.append('client_id', clientId)
    params.append('redirect_uri', redirectUri)
    params.append('code', code) 
    params.append('code_verifier', codeVerifier)

    let tokensResponse
    try {
      const response = await fetch(this.oidcConfiguration.token_endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      })
      tokensResponse = await response.json()
      if (!response.ok) throw new Error(tokensResponse.error_description || 'Token exchange failed')
      this.setTokens(tokensResponse)
    }
    catch {
      clearAccessToken()
    }
    return this.getAccessToken()
  }

  logout() {
    return {
      success: true,
      redirect: this.oidcConfiguration.end_session_endpoint
    }
  }

  async onMessage(e) {
    const port = e.target
    const { requestId, request, ...options } = e.data
    const handler = this.requestHandlers[request]?.bind(this)
    if (handler) {
      try {
        const response = await handler(options)
        port.postMessage({ requestId, response })
      } catch (error) {
        port.postMessage({ requestId, error: error.message })
      }
    } else {
      port.postMessage({ requestId, error: 'Unknown type' })
    }
  }

  get requestHandlers() {
    return {
      getAccessToken: this.getAccessToken,
      exchangeCodeForToken: this.exchangeCodeForToken,
      initialize: this.initialize,
      logout: this.logout
    }
  }
}

const oidcWorker = new OIDCWorker()

onconnect = function (e) {
  const port = e.ports[0]
  port.onmessage = oidcWorker.onMessage.bind(oidcWorker)
  port.start()
}
