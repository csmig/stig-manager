const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE stig_asset_map CHANGE COLUMN userIds resultEngines JSON NULL`,
    `UPDATE stig_asset_map SET resultEngines = NULL`,
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    await migrationHandler.down(pool, __filename)
  }
}

