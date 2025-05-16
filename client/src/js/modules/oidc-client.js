class OIDCClient extends EventTarget {

  static OIDCError = class extends Error {
    constructor(message) {
      super(message)
      this.name = 'OIDCError'
    }
  }

  static TokenExpiredError = class extends OIDCClient.OIDCError {
    constructor() {
      super('Token has expired')
      this.name = 'TokenExpiredError'
    }
  }

  #responseSeparator = '?'
  #tokens = {}
  #timeSkew = 0
  #tokenTimeoutHandle = null
  #refreshTimeoutHandle = null
  #refreshQueue = []

  constructor({oidcProvider, clientId, scope, autoRefresh, responseMode}) {
    super()
    this.clientId = clientId
    this.oidcProvider = oidcProvider
    this.scope = scope
    this.autoRefresh = autoRefresh
    this.responseMode = responseMode
    this.#responseSeparator = responseMode === 'fragment' ? '#' : '?'
    this.oidcConfiguration = null
  }

  get token() {
    return this.#tokens.access_token
  }
  get tokenParsed() {
    return this.decodeToken(this.token)
  }
  get refreshToken() {
    return this.#tokens.refresh_token
  }
  get refreshTokenParsed() {
    return this.decodeToken(this.refreshToken)
  }

  async authorize() {
    // Check URL for parameters
    const paramIndex = window.location.href.indexOf(this.#responseSeparator)
    if (paramIndex === -1) {
      // Redirect to OP with authorization request
      const authUrl = await this.getAuthorizationUrl()
      window.location.href = authUrl
      return null
    } else {
      // Exchange authorization_code for token
      const lastOidc = JSON.parse(localStorage.getItem('last-oidc') ?? '{}')
      lastOidc.redirectHref = window.location.href
      const [redirectUrl, paramStr] = window.location.href.split(this.#responseSeparator)
      const params = this.processRedirectParams(paramStr)

      if (lastOidc.state !== params.state) {
        throw new Error(
          `ERROR: OIDC redirection from unknown state.<br>Expected: ${lastOidc.state}<br>Actual: ${params.state}<br><br><a href="${redirectUrl}">Retry authorization.</a>`
        )
      }

      const beforeTime = new Date().getTime()
      const tokenRequestBody = this.getTokenRequestBody(params.code, lastOidc.pkce.codeVerifier, redirectUrl)
      let tokens
      try {
        lastOidc.tokenEndpoint = this.oidcConfiguration.token_endpoint
        lastOidc.tokenRequestBody = tokenRequestBody.toString()
        tokens = await this.requestToken(tokenRequestBody)
      } catch (e) {
        e.message = `<textarea readonly wrap="off" rows="18" cols="80" style="font-size: 8px;">Error:\n${e.message}\n\nContext:\n${JSON.stringify(
          lastOidc,
          null,
          2
        )}</textarea><br><br><a href="${redirectUrl}">Retry authorization.</a>`
        throw e
      }
      const clientTime = (beforeTime + new Date().getTime()) / 2
      this.setTokens(tokens, clientTime)
      window.history.replaceState(window.history.state, '', redirectUrl)
      return tokens
    }
  }

  logout() {
    window.location.href = this.oidcConfiguration.end_session_endpoint
  }

  async updateCallback() {
    try {
      await this.updateToken(-1)
    } catch (e) {
      console.log('[OIDC_CLIENT] Error in updateCallback')
    }
  }

  expiredCallback() {
    console.log(`[OIDC_CLIENT] Token expired at ${new Date(this.tokenParsed.exp * 1000)}`)
  }

  setTokens(tokens, clientTime) {
    this.#tokens = tokens

    this.#timeSkew = clientTime ? Math.floor(clientTime / 1000) - this.tokenParsed.iat : 0
    console.log('[OIDC_CLIENT] Estimated time difference between browser and server is ' + this.#timeSkew + ' seconds')
    console.log('[OIDC_CLIENT] Token expires ' + new Date(this.tokenParsed.exp * 1000))

    const tokenExpiresIn = (this.tokenParsed.exp - new Date().getTime() / 1000 + this.#timeSkew) * 1000
    if (tokenExpiresIn <= 0) {
      this.expiredCallback()
    } else {
      if (this.#tokenTimeoutHandle) {
        clearTimeout(this.#tokenTimeoutHandle)
      }
      this.#tokenTimeoutHandle = setTimeout(this.expiredCallback.bind(this), tokenExpiresIn)
    }

    if (this.autoRefresh && this.refreshToken) {
      const now = new Date().getTime()
      const expiration = this.refreshTokenParsed ? this.refreshTokenParsed.exp : this.tokenParsed.exp
      const updateDelay = (expiration - 60 - now / 1000 + this.#timeSkew) * 1000
      if (this.#refreshTimeoutHandle) {
        clearTimeout(this.#refreshTimeoutHandle)
      }
      this.#refreshTimeoutHandle = setTimeout(this.updateCallback.bind(this), updateDelay)
      console.log(`[OIDC_CLIENT] Scheduled token refresh at ${new Date(now + updateDelay)}`)
    }
  }

  clearTokens() {
    this.#tokens = {}
  }

  async updateToken(minValidity = 5) {
    return new Promise((resolve, reject) => {
      if (!this.refreshToken) {
        if (this.isTokenExpired(minValidity)) {
          this.clearTokens()
          // reject(new OIDCClient.TokenExpiredError())
          this.dispatchEvent(new Event('token_expired'))
          resolve(null)
          return
        }
        resolve(this.token)
        return
      }

      let willRefresh = false
      if (minValidity == -1) {
        willRefresh = true
        console.log('[OIDC_CLIENT] Refreshing token: forced refresh')
      } else if (this.isTokenExpired(minValidity)) {
        willRefresh = true
        console.log('[OIDC_CLIENT] Refreshing token: token expired')
      }
      if (!willRefresh) {
        resolve(this.token)
        return
      }

      this.#refreshQueue.push({ resolve, reject })

      if (this.#refreshQueue.length === 1) {
        let beforeTime = new Date().getTime()
        this.requestRefresh()
          .then((tokens) => {
            const clientTime = (beforeTime + new Date().getTime()) / 2
            console.log('[OIDC_CLIENT] Token refreshed')
            this.setTokens(tokens, clientTime)
            console.log('[OIDC_CLIENT] Estimated time difference between browser and server is ' + this.#timeSkew + ' seconds')
            for (let p = this.#refreshQueue.pop(); p != null; p = this.#refreshQueue.pop()) {
              p.resolve(this.token)
            }
          })
          .catch((e) => {
            this.dispatchEvent(new Event('refresh_failed'))
            for (let p = this.#refreshQueue.pop(); p != null; p = this.#refreshQueue.pop()) {
              // p.reject(e)
              p.reolve(null)
            }
          })
      }
    })
  }

  isTokenExpired(minValidity) {
    if (!this.tokenParsed) {
      throw new Error('Not authenticated')
    }
    let expiresIn = this.tokenParsed.exp - Math.ceil(new Date().getTime() / 1000) + this.#timeSkew
    if (minValidity) {
      if (isNaN(minValidity)) {
        throw 'Invalid minValidity'
      }
      expiresIn -= minValidity
    }
    return expiresIn < 0
  }

  async requestToken(body) {
    const response = await fetch(this.oidcConfiguration.token_endpoint, {
      method: 'post',
      body,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text)
    }
    return response.json()
  }

  async requestRefresh() {
    const body = this.getRefreshRequestBody()
    const response = await fetch(this.oidcConfiguration.token_endpoint, {
      method: 'post',
      body,
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text)
    }
    return response.json()
  }

  getTokenRequestBody(code, codeVerifier, redirectUri) {
    const params = new URLSearchParams()
    params.append('code', code)
    params.append('grant_type', 'authorization_code')
    params.append('client_id', this.clientId)
    params.append('redirect_uri', redirectUri)
    params.append('code_verifier', codeVerifier)

    return params
  }

  getRefreshRequestBody() {
    const params = new URLSearchParams()
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', this.#tokens.refresh_token)
    params.append('client_id', this.clientId)
    return params
  }

  processRedirectParams(paramStr) {
    const params = {}
    const usp = new URLSearchParams(paramStr)
    for (const [key, value] of usp) {
      params[key] = value
    }
    return params
  }

  async getAuthorizationUrl() {
    const pkce = await this.getPkce()
    const oidcState = crypto.randomUUID()
    const params = new URLSearchParams()
    params.append('client_id', this.clientId)
    params.append('redirect_uri', window.location.href)
    params.append('state', oidcState)
    params.append('response_mode', this.responseMode)
    params.append('response_type', 'code')
    params.append('scope', this.scope)
    params.append('nonce', crypto.randomUUID())
    params.append('code_challenge', pkce.codeChallenge)
    params.append('code_challenge_method', 'S256')

    const authEndpoint = this.oidcConfiguration.authorization_endpoint
    const authRequest = `${authEndpoint}?${params.toString()}`

    localStorage.setItem(
      'last-oidc',
      JSON.stringify({
        state: oidcState,
        pkce,
        authRequest,
      })
    )

    return authRequest
  }

  async getPkce() {
    function dec2hex(dec) {
      return ('0' + dec.toString(16)).substr(-2)
    }

    function generateRandomString() {
      var array = new Uint32Array(56 / 2)
      window.crypto.getRandomValues(array)
      return Array.from(array, dec2hex).join('')
    }

    function sha256(plain) {
      const encoder = new TextEncoder()
      const data = encoder.encode(plain)
      return window.crypto.subtle.digest('SHA-256', data)
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

  decodeToken(str) {
    try {
      str = str.split('.')[1]

      str = str.replace(/-/g, '+')
      str = str.replace(/_/g, '/')
      switch (str.length % 4) {
        case 0:
          break
        case 2:
          str += '=='
          break
        case 3:
          str += '='
          break
        default:
          throw new Error('Invalid token')
      }

      str = decodeURIComponent(escape(atob(str)))
      str = JSON.parse(str)
      return str
    } catch {
      return false
    }
  }
}

export default OIDCClient