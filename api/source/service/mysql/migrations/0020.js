const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE rule DROP FOREIGN KEY fk_rule_1`,
  `ALTER TABLE rule DROP COLUMN ccId, DROP INDEX ccId`,

  `ALTER TABLE rev_group_map DROP COLUMN rules`,
  `ALTER TABLE rev_group_rule_map DROP COLUMN checks, DROP COLUMN fixes, DROP COLUMN ccis`,

  `ALTER TABLE rev_group_rule_check_map DROP FOREIGN KEY FK_rev_group_rule_check_map_check`,
  `ALTER TABLE rev_group_rule_check_map ADD INDEX idx_rgrId (rgrId ASC) VISIBLE`,
  `ALTER TABLE rev_group_rule_check_map DROP INDEX uidx_rcm_ruleId_checkId`,
  'ALTER TABLE rev_group_rule_check_map ADD COLUMN ccId INT DEFAULT NULL',
  'ALTER TABLE rev_group_rule_check_map ADD INDEX idx_ccId (ccId)',

  `UPDATE rev_group_rule_check_map rgr LEFT JOIN \`check\` c using (checkId) SET rgr.ccId = c.ccId`,

  `DROP table \`check\``
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
