/**
 * Class representing a PoolMonitor.
 * Monitors the database connection status and determines if the API should enter an Unavailable state.
 */
class PoolMonitor {
  /**
   * Creates an instance of PoolMonitor.
   * @param {Object} options - Constructor options.
   * @param {Object} options.pool - The mysql2 PromisePool object.
   * @param {Object} options.state - The API state object.
   * @param {number} [options.retryInterval=40000] - The interval at which to retry creating a new connection (in milliseconds).
   * @param {Function} [options.retryFn=async ()=>{})] - The retry function.
   * @throws {Error} Throws an error if pool or state is not provided.
   */
  constructor({ pool, state, retryInterval = 40000, retryFn = async () => {} }) {
    if (!pool || !state) {
      throw new Error('PoolMonitor requires a pool and state object.')
    }
    this.pool = pool
    this.state = state
    this.retryInterval = retryInterval
    this.retryFn = retryFn
    this.retries = 0
    this.pool.on('remove', this.onRemove.bind(this))
  }

  /**
   * Handler for the pool's remove event.
   * Sets the database status based on the pool's connection status.
   */
  onRemove() {
    const poolEmpty = this.pool.pool._allConnections.length === 0
    if (poolEmpty && this.state.dependencyStatus.db) {
      this.state.setDbStatus(false)
      this.retries = 0
      this.timeoutId = setTimeout(this.callRetryFn.bind(this), this.retryInterval)
    }
  }

  /**
   * Attempts to create a new connection.
   * If successful, sets the database status to true and clears the retry interval.
   * If unsuccessful, increments the retry count.
   */
  async callRetryFn() {
    try {
      await this.retryFn()
      console.log('Pool connection restored.')
      this.state.setDbStatus(true)
    } 
    catch (error) {
      console.log(`Error retrying connection: ${error.message}`)
      this.retries++
      this.timeoutId = setTimeout(this.callRetryFn.bind(this), this.retryInterval)
    }
  }
}

module.exports = PoolMonitor
