import { stylesheets, scripts, isMinimizedSource } from './resources.js'
// import OIDCClient from './modules/oidc-client.js'


const statusEl = document.getElementById("loading-text")
// window.oidcClient = new OIDCClient({
//   oidcProvider: STIGMAN.Env.oauth.authority,
//   clientId: STIGMAN.Env.oauth.clientId,
//   autoRefresh: true,
//   scope: getScopeStr(),
//   responseMode: STIGMAN.Env.oauth.responseMode,
// })
// const RP = window.oidcClient
let OW

function sendWorkerRequest(request) {
  const requestId = crypto.randomUUID()
  OW.port.postMessage({ ...request, requestId })
  return new Promise((resolve) => {
    function handler(event) {
      if (event.data.requestId === requestId) {
        OW.port.removeEventListener('message', handler)
        resolve(event.data.response)
      }
    }
    OW.port.addEventListener('message', handler)
  })
}

window.oidcClient = {
  updateToken: async function () {
    const response = await sendWorkerRequest({ request: 'getAccessToken' })
    if (response.accessToken) {
      this.token = response.accessToken
      this.tokenParsed = response.accessTokenDecoded
      return response.accessToken
    }
  },
  logout: async function () {
    const response = await sendWorkerRequest({ request: 'logout' })
    if (response.success) {
      this.token = null
      window.location.href = response.redirect
    }
  }
}

function processRedirectParams(paramStr) {
  const params = {}
  const usp = new URLSearchParams(paramStr)
  for (const [key, value] of usp) {
    params[key] = value
  }
  return params
}



if (window.isSecureContext) {
  window.oidcWorker = new SharedWorker("js/oidc-worker.js", { name: 'stigman-oidc-worker', type: "module" })
  OW = window.oidcWorker
  OW.port.start()
  await sendWorkerRequest({request:'initialize', redirectUri: window.location.href.replace(/\?.*$/, '')})
  appendStatus(`Authorizing`)
  
  const responseSeparator = STIGMAN.Env.oauth.responseMode === 'fragment' ? '#' : '?'
  const paramIndex = window.location.href.indexOf(responseSeparator)
  if (paramIndex !== -1) {
    const [redirectUri, paramStr] = window.location.href.split(responseSeparator)
    const params = processRedirectParams(paramStr)
    const response = await sendWorkerRequest({
      request: 'exchangeCodeForToken',
      code: params.code,
      codeVerifier: sessionStorage.getItem('codeVerifier'),
      clientId: STIGMAN.Env.oauth.clientId,
      redirectUri
    })
    if (response.accessToken) {
      window.oidcClient.token = response.accessToken
      window.oidcClient.tokenParsed = response.accessTokenDecoded
      appendStatus(`exchangeCodeForToken`)
      window.history.replaceState(window.history.state, '', redirectUri)
      sessionStorage.removeItem('codeVerifier')
      loadResources()
    } 
  }
  else {
    const response = await sendWorkerRequest({request:'getAccessToken'})
    if (response.accessToken) {
      window.oidcClient.token = response.accessToken
      window.oidcClient.tokenParsed = response.accessTokenDecoded
      appendStatus(`getAccessToken`)
      loadResources()
    } else if (response.redirect) {
      sessionStorage.setItem('codeVerifier', response.codeVerifier)
      appendStatus(`<button id="sign-in-btn">Sign In</button>`)
      document.getElementById('sign-in-btn').onclick = async function() {
        const response = await sendWorkerRequest({request:'getAccessToken'})
        if (response.accessToken) {
          window.oidcClient.token = response.accessToken
          window.oidcClient.tokenParsed = response.accessTokenDecoded
          appendStatus(`getAccessToken`)
          loadResources()
        } else {
          window.location.href = response.redirect
          // const width = 700
          // const height = 700
          // const left = window.screenX + (window.outerWidth - width) / 2
          // const top = window.screenY + (window.outerHeight - height) / 2

          // window.open(
          //   response.redirect,
          //   '_blank',
          //   `popup=yes,width=${width},height=${height},left=${left},top=${top}`
          // )
        }
      }
    }
  }
} else {
  appendStatus(`SECURE CONTEXT REQUIRED<br><br>
    The App is not executing in a <a href=https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts target="_blank">secure context</a> and cannot continue.
    <br><br>To be considered secure, resources that are not local must be served over https:// URLs and the security 
    properties of the network channel used to deliver the resource must not be considered deprecated.`)
}

function appendStatus(html) {
  statusEl.innerHTML += `${statusEl.innerHTML ? '<br/><br/>' : ''}${html}`
}

function getScopeStr() {
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

async function loadResources() {
  for (const href of stylesheets) {
    const link = document.createElement('link')
    link.href = href
    link.type = 'text/css'
    link.rel = 'stylesheet'
    link.async = false
    if (href === 'css/dark-mode.css') {
      link.disabled = (localStorage.getItem('darkMode') !== '1')
    }
    document.head.appendChild(link)
  }
  
  const { Chart } = await import('./modules/node_modules/chart.js/auto/auto.js')
  window.Chart = Chart

  for (const src of scripts) {
    const script = document.createElement('script')
    script.src = src
    script.async = false
    document.head.appendChild(script)
  }
  const { serializeError } = await import('./modules/node_modules/serialize-error/index.js')
  STIGMAN.serializeError = serializeError
  STIGMAN.ClientModules = await import('./modules/node_modules/@nuwcdivnpt/stig-manager-client-modules/index.js')
  
  STIGMAN.isMinimizedSource = isMinimizedSource
}

async function authorizeOidc() {
  try {
    await RP.getOpenIdConfiguration()
  } catch (e) {
    appendStatus(e.message)
    return
  }
  try {
    const tokens = await RP.authorize()
    if (tokens) {
      appendStatus(`Loading App ${STIGMAN?.Env?.version}`)
      loadResources()
    }
  }
  catch (e) {
    appendStatus(e.message)
  }
}


