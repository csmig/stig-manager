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
   * @throws {Error} Throws an error if pool or state is not provided.
   */
  constructor({ pool, state, retryInterval = 40000 }) {
    if (!pool || !state) {
      throw new Error('PoolMonitor requires a pool and state object.')
    }
    this.pool = pool
    this.state = state
    this.retryInterval = retryInterval
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
      this.intervalId = setInterval(this.retryConnection.bind(this), this.retryInterval)
      return
    }
    if (!poolEmpty && !this.state.dependencyStatus.db) {
      this.state.setDbStatus(true)
      clearInterval(this.intervalId)
    }
  }

  /**
   * Attempts to create a new connection.
   * If successful, sets the database status to true and clears the retry interval.
   * If unsuccessful, increments the retry count.
   */
  async retryConnection() {
    try {
      await this.pool.getConnection()
      console.log('Pool connection restored.')
      this.state.setDbStatus(true)
      clearInterval(this.intervalId)
    } 
    catch (error) {
      console.log(`Error retrying connection: ${error.message}`)
      this.retries++
    }
  }
}

module.exports = PoolMonitor
