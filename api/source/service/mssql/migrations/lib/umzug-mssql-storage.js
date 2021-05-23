module.exports = class MyStorage {
  constructor(options) {
    this.dbUtils = options.dbUtils
    this.hasMigrationTable = false
  }

  async createMigrationTable () {
    try {
      await this.dbUtils.queryPool(`IF NOT EXISTS
      (  SELECT [name]
         FROM sys.tables
         WHERE [name] = '_migrations'
      ) CREATE TABLE _migrations (
        name NVARCHAR(128) 
      )`)
      this.hasMigrationTable = true
    }
    catch (err) {
      throw (err)
    }
  }

  async logMigration(migrationName) {
    // This function logs a migration as executed.
    // It will get called once a migration was
    // executed successfully.
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      // await this.pool.connect()
      const result = await this.dbUtils.queryPool(`INSERT into _migrations (name) VALUES (@migrationName)`,{ migrationName })
      // await this.pool.request().query`INSERT into _migrations (name) VALUES (${migrationName})`
    }
    catch (err) {
      throw (err)
    }
  }

  async unlogMigration(migrationName) {
    // This function removes a previously logged migration.
    // It will get called once a migration has been reverted.
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      // await this.pool.connect()
      await this.dbUtils.queryPool(`DELETE from _migrations WHERE name = @migrationName`, {migrationName})
    }
    catch (err) {
      throw (err)
    }
  }

  async executed() {
    // This function lists the names of the logged
    // migrations. It will be used to calculate
    // pending migrations. The result has to be an
    // array with the names of the migration files.
    try {
      if (!this.hasMigrationTable) {
        await this.createMigrationTable()
      }
      // await this.pool.connect()
      let result = await this.dbUtils.queryPool('SELECT name from _migrations')
      if (!result.recordset.length) {
        return []
      }
      else {
        return result.recordset.map(r => r.name)
      }
    }
    catch (err) {
      throw (err)
    }
  }
}