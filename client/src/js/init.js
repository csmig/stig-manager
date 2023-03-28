import * as OP from './oidcProvider.js'
import { loadResources } from './loadResources.js'

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

async function authorizeOidc() {
  window.oidcProvider = OP
  try {
    const tokens = await OP.authorize({
      oidcProvider: STIGMAN.Env.oauth.authority,
      clientId: STIGMAN.Env.oauth.clientId,
      autoRefresh: true,
      scope: getScopeStr()
    })
    if (tokens) {
      loadResources()
    }
  }
  catch (e) {
    document.getElementById("loading-text").innerHTML = e.message
  }
}

document.getElementById("loading-text").innerHTML = `Loading ${STIGMAN?.Env?.version}`
authorizeOidc()