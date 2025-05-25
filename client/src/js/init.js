import { stylesheets, scripts, isMinimizedSource } from './resources.js'

const statusEl = document.getElementById("loading-text")

if (window.isSecureContext) {
  await setupOidcWorker()
  await bootstrap()
} else {
  appendStatus(`SECURE CONTEXT REQUIRED<br><br>
    The App is not executing in a <a href=https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts target="_blank">secure context</a> and cannot continue.
    <br><br>To be considered secure, resources that are not local must be served over https:// URLs and the security 
    properties of the network channel used to deliver the resource must not be considered deprecated.`)
}

async function bootstrap() {
  const OW = window.oidcWorker

  const responseSeparator = STIGMAN.Env.oauth.responseMode === 'fragment' ? '#' : '?'
  const [redirectUri, paramStr] = window.location.href.split(responseSeparator)

  const response = await OW.sendWorkerRequest({ request: 'initialize', redirectUri })
  if (response.error) {
    appendError(response.error)
    return
  }
  appendStatus(`Authorizing`)

  if (paramStr) {
    const params = OW.processRedirectParams(paramStr)
    appendStatus(`exchangeCodeForToken`)
    const response = await OW.sendWorkerRequest({
      request: 'exchangeCodeForToken',
      code: params.code,
      codeVerifier: sessionStorage.getItem('codeVerifier'),
      clientId: STIGMAN.Env.oauth.clientId,
      redirectUri
    })
    if (response.success) {
      OW.token = response.accessToken
      OW.tokenParsed = response.accessTokenPayload
      window.history.replaceState(window.history.state, '', redirectUri)
      sessionStorage.removeItem('codeVerifier')
      loadResources()
    }
    else {
      appendError(response.error || 'Failed to exchange code for token')
    }
  }
  else {
    const response = await OW.sendWorkerRequest({ request: 'getAccessToken' })
    if (response.accessToken) {
      OW.token = response.accessToken
      OW.tokenParsed = response.accessTokenPayload
      appendStatus(`getAccessToken`)
      loadResources()
    } else if (response.redirect) {
      sessionStorage.setItem('codeVerifier', response.codeVerifier)
      window.location.href = response.redirect
      // hideSpinner()
      // appendStatus(`
      //   <button id="sign-in-btn" class="dark-large-btn">
      //     <img src="img/login.svg" alt="">
      //     Sign In
      //   </button>
      // `)
      // document.getElementById('sign-in-btn').onclick = async function () {
      //   const response = await OW.sendWorkerRequest({ request: 'getAccessToken' })
      //   if (response.accessToken) {
      //     OW.token = response.accessToken
      //     OW.tokenParsed = response.accessTokenPayload
      //     appendStatus(`getAccessToken`)
      //     loadResources()
      //   } else {
      //     window.location.href = response.redirect
      //   }
      // }
    }
  }
}

function appendStatus(html) {
  statusEl.innerHTML += `${statusEl.innerHTML ? '<br/><br/>' : ''}${html}`
}

function appendError(message) {
  const cleanHref = window.location.origin + window.location.pathname
  statusEl.innerHTML += `<br/><br/><span style="color:#ff5757">Error: ${message}</span><br><br><a href="${cleanHref}">Retry authorization.</a>`
  hideSpinner()
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

async function setupOidcWorker() {
  window.oidcWorker = {
    updateToken: async function () {
      const response = await this.sendWorkerRequest({ request: 'getAccessToken' })
      if (response.accessToken) {
        this.token = response.accessToken
        this.tokenParsed = response.accessTokenPayload
        return response.accessToken
      }
    },
    logout: async function () {
      const response = await this.sendWorkerRequest({ request: 'logout' })
      if (response.success) {
        this.token = null
        this.tokenParsed = null
        window.location.href = response.redirect
      }
    },
    sendWorkerRequest: function (request) {
      const requestId = crypto.randomUUID()
      const port = this.worker.port
      port.postMessage({ ...request, requestId })
      return new Promise((resolve) => {
        function handler(event) {
          if (event.data.requestId === requestId) {
            port.removeEventListener('message', handler)
            resolve(event.data.response)
          }
        }
        port.addEventListener('message', handler)
      })
    },
    worker: new SharedWorker("js/oidc-worker.js", { name: 'stigman-oidc-worker', type: "module" }),
    processRedirectParams: function (paramStr) {
      const params = {}
      const usp = new URLSearchParams(paramStr)
      for (const [key, value] of usp) {
        params[key] = value
      }
      return params
    }
  }

  const OW = window.oidcWorker
  OW.worker.port.start()

  const bc = new BroadcastChannel('stigman-oidc-worker')
  bc.onmessage = (event) => {
    if (event.data.type === 'accessToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = event.data.accessToken
      OW.tokenParsed = event.data.accessTokenPayload
    }
    else if (event.data.type === 'noToken') {
      console.log('{init] Received from worker:', event.type, event.data)
      OW.token = null
      OW.tokenParsed = null
    }
  }
}

function hideSpinner() {
  const loadingEl = document.getElementById("indicator")
  if (loadingEl) {
    loadingEl.style.background = "none"
  }
}