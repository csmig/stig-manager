const EventEmitter = require('events')
const logger = require('./logger')

/**
 * Represents the state of the API.
 * @typedef {'starting' | 'fail' | 'operational' | 'unavailable' | 'stop'} StateType
 */

/**
 * Represents the mode of the API.
 * @typedef {'normal' | 'maintenance'} ModeType
 */

/**
 * @typedef {Object} DependencyStatus
 * @property {boolean} db
 * @property {boolean} oidc
 */


class State extends EventEmitter {
  /** @type {StateType} */
  #currentState
  
  /** @type {StateType} */
  #previousState
  
  /** @type {DependencyStatus} */
  #dependencyStatus

  /** @type {Object} */
  #dbPool

  /** @type {ModeType} */
  #mode

  constructor(initialState, initialMode = 'normal') {
    super()
    this.#currentState = initialState
    this.#mode = initialMode
    this.#dependencyStatus = {
      db: false,
      oidc: false
    }
  }

  /**
   * Emits 'statechanged', passing the previous and current state and dependency status
   */
  #emitStateChangedEvent() {
    this.emit('statechanged', this.#currentState, this.#previousState, this.#dependencyStatus)
  }

  /**
   * Emits 'modechanged', passing the current mode
   */
  #emitModeChangedEvent() {
    this.emit('modechanged', this.#mode)
  }

  #setStateFromDependencyStatus() {
    if (this.#dependencyStatus.db && this.#dependencyStatus.oidc) {
      this.setState('operational')
    }
    else {
      this.setState(this.#currentState === 'starting' ? 'starting' : 'unavailable')
    }
  }

  /**
   * Sets the state to the provided state and emits statechanged event
   * @param {StateType} state 
   */
  setState(state) {
    if (this.#currentState === state) return
    this.#previousState = this.#currentState
    this.#currentState = state
    this.#emitStateChangedEvent()
  }

  /**
   * Sets the mode to the provided mode and emits modechanged event
   * @param {ModeType} mode 
   */
  #setMode(mode) {
    if (this.#mode === mode) return
    this.#mode = mode
    this.#emitModeChangedEvent()
  }

  /**
   * Sets the status of the database dependency
   * @param {boolean} status 
   */
  setDbStatus(status) {
    if (this.#dependencyStatus.db === status) return
    this.#dependencyStatus.db = status
    this.#setStateFromDependencyStatus()
  }

  /**
   * Sets the status of the OIDC dependency
   * @param {boolean} status 
   */
  setOidcStatus(status) {
    if (this.#dependencyStatus.oidc === status) return
    this.#dependencyStatus.oidc = status
    this.#setStateFromDependencyStatus()
  }

  /** @type {StateType} */
  get currentState() {
    return this.#currentState
  }

  /** @type {DependencyStatus} */
  get dependencyStatus() {
    return {...this.#dependencyStatus}
  }

  /** @type {ModeType} */
  get currentMode() {
    return this.#mode
  }

  /** @param {ModeType} */
  set currentMode(mode) {
    this.#setMode(mode)
  }

  /** @param {Object} */
  set dbPool(pool) {
    this.#dbPool = pool
  }

  /** @type {Object} */
  get dbPool() {
    return this.#dbPool
  }
}

const state = new State('starting')
state.on('statechanged', async (currentState, previousState, dependencyStatus) => {
  logger.writeInfo('state','statechanged', {currentState, previousState, dependencyStatus})
  switch (currentState) {
    case 'fail':
      logger.writeError('state','fail', {message:'Application failed'})
      process.exit(1)
      break
    case 'stop':
      logger.writeInfo('state','stop', {message:'Application stopped'})
      try {
        await state.dbPool?.end()
      }
      catch (err) {
        logger.writeError('state','stop', {message:'Error closing database pool', error: serializeError(err)})
      } 
      process.exit(0)
      break
  }
})

module.exports = state