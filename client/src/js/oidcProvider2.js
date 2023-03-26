const state = {}

async function authenticate({clientId, oidcProvider}) {
  state.clientId = clientId
  state.oidcProvider = oidcProvider
  state.oidcConfiguration = await getOpenIdConfiguration(oidcProvider)
  const fragmentIndex = window.location.href.indexOf('#')
  if (fragmentIndex !== -1) {
    // OP sent authorization_code
    
  }
  else {
    // need to get authorization_code from OP

    // send authentication request to OP
    const thing = await getAuthorizationUrl()
    window.location.href = thing
  }


}

async function getAuthorizationUrl() {
  const nonce = crypto.randomUUID()
  const stateVal = crypto.randomUUID()
  const pkce = await getPkce()
  const redirectUri = encodeURIComponent(window.location.href)
  const scopes = getScopes()
  const authEndpoint = state.oidcConfiguration.authorization_endpoint

  return authEndpoint
    + '?client_id=' + encodeURIComponent(state.clientId)
    + '&redirect_uri=' + encodeURIComponent(redirectUri)
    + '&state=' + encodeURIComponent(stateVal)
    + '&response_mode=fragment'
    + '&response_type=code'
    + '&scope=' + encodeURIComponent(scopes)
    + '&nonce=' + encodeURIComponent(nonce)
    + '&code_challenge=' + pkce.codeChallenge
    + '&code_challenge_method=S256'
}

async function getPkce() {  
  function dec2hex(dec) {
    return ('0' + dec.toString(16)).substr(-2)
  }
  
  function generateRandomString() {
    var array = new Uint32Array(56/2);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec2hex).join('');
  }

  function sha256(plain) { // returns promise ArrayBuffer
    const encoder = new TextEncoder()
    const data = encoder.encode(plain)
    return window.crypto.subtle.digest('SHA-256', data)
  }
  
  function base64UrlEncode(a) {
    let str = ""
    const bytes = new Uint8Array(a)
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      str += String.fromCharCode(bytes[i])
    }
    return btoa(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")
  }
  
  async function challengeFromVerifier(v) {
    const hashed = await sha256(v)
    const base64encoded = base64UrlEncode(hashed)
    return base64encoded
  }
    
  const codeVerifier = generateRandomString()
  const codeChallenge = await challengeFromVerifier(codeVerifier)
  return {codeChallenge, codeVerifier}
}

function getScopes() {
  const scopePrefix = STIGMAN.Env.oauth.scopePrefix
  let scopes = [
      `${scopePrefix}stig-manager:stig`,
      `${scopePrefix}stig-manager:stig:read`,
      `${scopePrefix}stig-manager:collection`,
      `${scopePrefix}stig-manager:user`,
      `${scopePrefix}stig-manager:user:read`,
      `${scopePrefix}stig-manager:op`
  ]
  if (STIGMAN.Env.oauth.extraScopes) {
      scopes.push(...STIGMAN.Env.oauth.extraScopes.split(" "))
  }
  return scopes.join(" ")
}

async function getOpenIdConfiguration(baseUrl) {
  try {
    const response = await fetch(`${baseUrl}/.well-known/openid-configuration`)
    if (!response.ok) {
      throw new Error(`failed to get: ${baseUrl}/.well-known/openid-configuration`)
    }
    return response.json()
  }
  catch (e) {
    alert(e.message)
  }
}

export default {
  authenticate,
  state
}