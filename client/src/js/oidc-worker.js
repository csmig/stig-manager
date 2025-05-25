const logPrefix = '[OIDCWorker]:'
class OIDCWorker {
  constructor() {
    this.tokens = {
      accessToken: null,
      refreshToken: null
    }
    this.ENV = null
    this.oidcProvider = null
    this.oidcConfiguration = null
    this.initialized = false
    this.authorization = {}
    this.timeoutBufferS = 10
    this.bc = new BroadcastChannel('stigman-oidc-worker')
  }

  async initialize(options) {
    if (!this.initialized) {
      this.initialized = true
      this.redirectUri = options.redirectUri
      try {
        this.ENV = await (await fetch('Oauth.json')).json()
      }
      catch (e) {
        console.error(logPrefix, 'Failed to fetch env', e)
        return { success: false, error: 'Failed to fetch env' }
      }

      this.oidcProvider = this.ENV.authority
      this.clientId = this.ENV.clientId
      this.autoRefresh = this.ENV.autoRefresh
      this.scope = this.getScopeStr()
      this.responseMode = this.ENV.responseMode
      try {
        this.oidcConfiguration = await this.fetchOpenIdConfiguration()
      }
      catch (e) {
        console.error(logPrefix, 'Failed to fetch OIDC configuration', e)
        return { success: false, error: 'Cannot connect to the Sign-in Service.' }
      }
    }
    return { success: true, env: this.ENV }
  }

  getScopeStr() {
    const scopePrefix = this.ENV.scopePrefix
    let scopes = [
      `openid`,
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

  async fetchOpenIdConfiguration() {
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

  async getAuthorizationUrl(redirectUri = this.redirectUri) {
    if (this.authorization[redirectUri]) return this.authorization[redirectUri]
    const pkce = await this.getPkce()
    const oidcState = crypto.randomUUID()
    const params = new URLSearchParams()
    params.append('client_id', this.clientId)
    params.append('redirect_uri', redirectUri)
    params.append('state', oidcState)
    params.append('response_mode', this.responseMode)
    params.append('response_type', 'code')
    params.append('scope', this.scope)
    params.append('nonce', crypto.randomUUID())
    params.append('code_challenge', pkce.codeChallenge)
    params.append('code_challenge_method', 'S256')
    params.append('display', 'popup')

    const authEndpoint = this.oidcConfiguration.authorization_endpoint
    const redirect = `${authEndpoint}?${params.toString()}`
    this.authorization[redirectUri] = { redirect, codeVerifier: pkce.codeVerifier }
    return this.authorization[redirectUri]
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
      console.log(logPrefix, 'getAccessToken, redirecting to authorization')
      return this.getAuthorizationUrl()
    }
    // console.log(logPrefix, 'getAccessToken', this.tokens.accessToken)
    return {
      accessToken: this.tokens.accessToken,
      accessTokenPayload: this.decodeToken(this.tokens.accessToken)
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

  async broadcastNoToken() {
    console.log(logPrefix, 'Broadcasting no token')
    let baseRedirectUri = this.redirectUri?.endsWith('index.html')
    ? this.redirectUri.slice(0, -'index.html'.length)
    : this.redirectUri

    const redirect = await this.getAuthorizationUrl(`${baseRedirectUri}reauth.html`)
    this.bc.postMessage({ type: 'noToken', ...redirect })
  }

  setAccessTokenTimer(delayMs) {
    if (this.accessTimeoutId) {
      clearTimeout(this.accessTimeoutId)
      this.accessTimeoutId = null
    }
    this.accessTimeoutId = setTimeout(async () => {
      if (this.tokens.accessToken) {
        this.clearAccessToken()
        console.log(logPrefix, 'Access token timeout handler is attempting refresh')
        await this.refreshAccessToken()
      }
    }, delayMs)
  }

  setRefreshTokenTimer(delayMs) {
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId)
      this.refreshTimeoutId = null
    } 
    this.refreshTimeoutId = setTimeout(async () => {
      if (this.tokens.refreshToken) {
        console.log(logPrefix, 'Refresh token timeout handler is broadcasting no token')
        this.clearTokens(true) // broadcast no token
      }
    }, delayMs)
  }

  getTokenTimes(token) {
    const expS = this.decodeToken(token)?.exp
    if (!expS) {
      console.log(logPrefix, 'No access token expiration claim')
      return null
    }
    const nowMs = Date.now()
    const nowS = Math.floor(nowMs / 1000)
    const expiresDate = new Date(expS * 1000)
    const expiresDateISO = expiresDate.toISOString()
    const expiresInS = expS - nowS
    const expiresInMs = expiresInS * 1000
    const timeoutInS = expiresInS - this.timeoutBufferS
    const timeoutInMs = timeoutInS * 1000
    const timeoutDate = new Date((nowS + timeoutInS) * 1000)
    const timeoutDateISO = timeoutDate.toISOString()

    return {
      expS,
      expiresDate,
      expiresDateISO,
      expiresInS,
      expiresInMs,
      timeoutDate,
      timeoutDateISO,
      timeoutInS,
      timeoutInMs
    }
  }

  setTokensAccessOnly(tokensResponse) {
    const accessTimes = this.getTokenTimes(tokensResponse.access_token)
    if (!accessTimes || accessTimes.timeoutInS <= 0) {
      this.broadcastNoToken()
      return
    }
    this.tokens.accessToken = tokensResponse.access_token
    this.bc.postMessage({
      type: 'accessToken',
      accessToken: this.tokens.accessToken,
      accessTokenPayload: this.decodeToken(this.tokens.accessToken)
    })
    console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
    this.setAccessTokenTimer(accessTimes.timeoutInMs)
  }

  setTokensWithRefresh(tokensResponse) {
    const accessTimes = this.getTokenTimes(tokensResponse.access_token)
    const refreshTimes = this.getTokenTimes(tokensResponse.refresh_token)

    if (!accessTimes || accessTimes.timeoutInS <= 0) {
      this.broadcastNoToken()
      return
    }
    else {
      this.tokens.accessToken = tokensResponse.access_token
      this.bc.postMessage({
        type: 'accessToken',
        accessToken: this.tokens.accessToken,
        accessTokenPayload: this.decodeToken(this.tokens.accessToken)
      })
    }
    if (refreshTimes.timeoutInS > 0) {
      this.tokens.refreshToken = tokensResponse.refresh_token
      console.log(logPrefix, 'Refresh token expires: ', refreshTimes.expiresDateISO, ' timeout: ', refreshTimes.expiresDateISO)
      this.setRefreshTokenTimer(refreshTimes.expiresInMs)
    }
    else {
      console.log(logPrefix, 'Refresh has expired, Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
      this.setAccessTokenTimer(accessTimes.timeoutInMs)
    }
    if (accessTimes.expiresInS < refreshTimes.expiresInS) {
      console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout: ', accessTimes.timeoutDateISO)
      this.setAccessTokenTimer(accessTimes.timeoutInMs)
    }
    else {
      console.log(logPrefix, 'Access token expires: ', accessTimes.expiresDateISO, ' timeout disabled')
    }
  }

  processTokenResponseAndSetTokens(tokensResponse) {
    console.log(logPrefix, 'Token response', tokensResponse)
    this.clearTokens()
    if (tokensResponse.access_token && tokensResponse.refresh_token) {
      this.setTokensWithRefresh(tokensResponse)
      return true
    }
    if (tokensResponse.access_token) {
      this.setTokensAccessOnly(tokensResponse)
      return true
    }
    console.error(logPrefix, 'No access_token in tokensResponse:', tokensResponse)
    this.clearAccessToken(true) // broadcast no token
    return false
  }

  clearAccessToken(sendBroadcast = false) {
    this.tokens.accessToken = null
    clearTimeout(this.accessTimeoutId)
    if (sendBroadcast) this.broadcastNoToken()
  }

  clearTokens(sendBroadcast = false) {
    this.tokens.accessToken = null
    this.tokens.refreshToken = null
    clearTimeout(this.accessTimeoutId)
    clearTimeout(this.refreshTimeoutId)
    if (sendBroadcast) this.broadcastNoToken()
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
        console.log(logPrefix, 'Token refresh NOT OK response', tokensResponse)
        this.clearTokens(true)
      }
      else {
        this.processTokenResponseAndSetTokens(tokensResponse)
      }
    }
    catch {
      console.log(logPrefix, 'Refresh token catch', tokensResponse)
      this.clearAccessToken()
    }
    return this.getAccessToken()
  }

  async exchangeCodeForToken({ code, codeVerifier, clientId = 'stig-manager', redirectUri }) {
    if (this.authorization[redirectUri] && this.authorization[redirectUri].codeVerifier !== codeVerifier) {
      // verifier does not match the saved redirectUri
      console.error(logPrefix, 'Code verifier does not match the saved redirectUri', redirectUri, this.authorization[redirectUri])
      return { success: false, error: 'Code verifier does not match the saved redirectUri' }
    }
     
    console.log(logPrefix, 'Exchange code for token', code, codeVerifier)
    
    delete this.authorization[redirectUri]
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
      if (!response.ok) {
        return {success: false, error: tokensResponse.error_description}
      }
      if (this.processTokenResponseAndSetTokens(tokensResponse)) {
        return {
          success: true, 
          accessToken: this.tokens.accessToken, 
          accessTokenPayload: this.decodeToken(this.tokens.accessToken)
        }
      } else {
        console.error(logPrefix, 'Failed to process token response', tokensResponse)
        return {
          success: false,
          error: 'Failed to process token response'
        }
      }
    }
    catch (e) {
      console.error(logPrefix, 'Failed to process token response', tokensResponse)
      return {
        success: false,
        error: e.message
      }
    }
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
    const handler = this.messageHandlers[request]?.bind(this)
    if (handler) {
      try {
        const response = await handler(options)
        port.postMessage({ requestId, response })
      } catch (error) {
        port.postMessage({ requestId, error: error.message })
      }
    } else {
      port.postMessage({ requestId, error: 'Unknown request' })
    }
  }

  get messageHandlers() {
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
