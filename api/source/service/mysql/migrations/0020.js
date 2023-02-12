const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `ALTER TABLE rule DROP FOREIGN KEY fk_rule_1`,
  `ALTER TABLE rule DROP COLUMN ccId, DROP INDEX ccId`,

  `ALTER TABLE rev_group_map DROP COLUMN rules`,

  `ALTER TABLE rev_group_rule_map DROP COLUMN checks, DROP COLUMN fixes, DROP COLUMN ccis`,
  // `ALTER TABLE rev_group_rule_map
  // ADD COLUMN \`version\` varchar(45),
  // ADD COLUMN \`title\` varchar(1000),
  // ADD COLUMN \`severity\` varchar(45),
  // ADD COLUMN \`weight\` varchar(45),
  // ADD COLUMN \`vulnDiscussion\` text,
  // ADD COLUMN \`falsePositives\` text,
  // ADD COLUMN \`falseNegatives\` text,
  // ADD COLUMN \`documentable\` varchar(45) ,
  // ADD COLUMN \`mitigations\` text,
  // ADD COLUMN \`severityOverrideGuidance\` text,
  // ADD COLUMN \`potentialImpacts\` text,
  // ADD COLUMN \`thirdPartyTools\` text,
  // ADD COLUMN \`mitigationControl\` text,
  // ADD COLUMN \`responsibility\` varchar(255) ,
  // ADD COLUMN \`iaControls\` varchar(255)`,

  `ALTER TABLE rev_group_rule_check_map DROP FOREIGN KEY FK_rev_group_rule_check_map_check`,
  `ALTER TABLE rev_group_rule_check_map ADD INDEX idx_rgrId (rgrId ASC) VISIBLE`,
  `ALTER TABLE rev_group_rule_check_map DROP INDEX uidx_rcm_ruleId_checkId`,
  'ALTER TABLE rev_group_rule_check_map ADD COLUMN ccId INT DEFAULT NULL',
  'ALTER TABLE rev_group_rule_check_map ADD INDEX idx_ccId (ccId)',
  'ALTER TABLE rev_group_rule_check_map CHANGE COLUMN `checkId` `checkId` VARCHAR(255) NULL',

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
