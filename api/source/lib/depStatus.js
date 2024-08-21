let depStatus = {
  db: 'waiting',
  auth: 'waiting'
}

function setStatus(service, status) {
  if (depStatus.hasOwnProperty(service)) {
    depStatus[service] = status
  } else {
    throw new Error(`Service ${service} is not recognized in depStatus`)
  }
}

function getStatus() {
  return depStatus
}

module.exports = {
  setStatus,
  getStatus
}
