const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `with ordered_reviews as (
    select
      reviewId,
      ROW_NUMBER() OVER (PARTITION BY assetId, \`version\`, checkDigest ORDER BY reviewId DESC) as rowNum
    FROM
      review
  )
  delete from review where reviewId IN (select reviewId from ordered_reviews where rowNum > 1)`,
  `ALTER TABLE review ADD INDEX idx_asset (assetId ASC)`,
  `ALTER TABLE review DROP INDEX idx_asset_vcd`,
  `ALTER TABLE review ADD UNIQUE INDEX idx_asset_vcd (assetId ASC, \`version\` ASC, checkDigest ASC)`,
  `ALTER TABLE asset ADD INDEX idx_state (state ASC)`,
  `ALTER TABLE collection ADD INDEX idx_state (state ASC)`
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

