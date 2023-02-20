const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // if absent here, the query UPDATE rev_group_rule_map runs very slowly
  `ALTER TABLE rule DROP FOREIGN KEY fk_rule_1`,
  `ALTER TABLE rule DROP COLUMN ccId, DROP INDEX ccId`,

  // rev_group_map
  `ALTER TABLE rev_group_map DROP COLUMN rules`,
  `ALTER TABLE rev_group_map ADD COLUMN \`title\` varchar(255), ADD COLUMN severity varchar(45)`,
  `ALTER TABLE rev_group_map DROP FOREIGN KEY FK_rev_group_map_group`,
  `UPDATE rev_group_map rg left join \`group\` g using (groupId) SET rg.title = g.title, rg.severity = g.severity`,

  // rev_group_rule_map
  `ALTER TABLE rev_group_rule_map DROP COLUMN checks, DROP COLUMN fixes, DROP COLUMN ccis`,
  `ALTER TABLE rev_group_rule_map
  ADD COLUMN \`version\` varchar(45),
  ADD COLUMN \`title\` varchar(1000),
  ADD COLUMN \`severity\` varchar(45),
  ADD COLUMN \`weight\` varchar(45),
  ADD COLUMN \`vulnDiscussion\` text,
  ADD COLUMN \`falsePositives\` text,
  ADD COLUMN \`falseNegatives\` text,
  ADD COLUMN \`documentable\` varchar(45) ,
  ADD COLUMN \`mitigations\` text,
  ADD COLUMN \`severityOverrideGuidance\` text,
  ADD COLUMN \`potentialImpacts\` text,
  ADD COLUMN \`thirdPartyTools\` text,
  ADD COLUMN \`mitigationControl\` text,
  ADD COLUMN \`responsibility\` varchar(255) ,
  ADD COLUMN \`iaControls\` varchar(255)`,
  `UPDATE rev_group_rule_map rgr LEFT JOIN rule r using (ruleId) SET
  rgr.\`version\` = r.\`version\`,
  rgr.title = r.title,
  rgr.severity = r.severity,
  rgr.weight = r.weight,
  rgr.vulnDiscussion = r.vulnDiscussion,
  rgr.falsePositives = r.falsePositives,
  rgr.falseNegatives = r.falseNegatives,
  rgr.documentable = r.documentable,
  rgr.mitigations = r.mitigations,
  rgr.severityOverrideGuidance = r.severityOverrideGuidance,
  rgr.potentialImpacts = r.potentialImpacts,
  rgr.thirdPartyTools = r.thirdPartyTools,
  rgr.mitigationControl = r.mitigationControl,
  rgr.responsibility = r.responsibility,
  rgr.iaControls = r.iaControls`,
  `ALTER TABLE rev_group_rule_map DROP FOREIGN KEY FK_rev_group_rule_map_rule`,

  // rev_group_rule_check_map
  `ALTER TABLE rev_group_rule_check_map DROP FOREIGN KEY FK_rev_group_rule_check_map_check`,
  // `ALTER TABLE rev_group_rule_check_map ADD INDEX idx_rgrId (rgrId ASC) VISIBLE`,
  // `ALTER TABLE rev_group_rule_check_map DROP INDEX uidx_rcm_ruleId_checkId`,
  'ALTER TABLE rev_group_rule_check_map ADD COLUMN ccId INT DEFAULT NULL',
  'ALTER TABLE rev_group_rule_check_map ADD INDEX idx_ccId (ccId)',
  'ALTER TABLE rev_group_rule_check_map CHANGE COLUMN `checkId` `system` VARCHAR(255) NULL',
  `UPDATE rev_group_rule_check_map rgrc LEFT JOIN \`check\` c on rgrc.system = c.checkId SET rgrc.ccId = c.ccId`,

  // rev_group_rule_fix_map
  `CREATE TABLE fix_text (
    ftId INT NOT NULL AUTO_INCREMENT,
    digest BINARY(32) GENERATED ALWAYS AS (UNHEX(SHA2(text, 256))) STORED,
    text TEXT NOT NULL,
    PRIMARY KEY (ftId),
    UNIQUE INDEX digest_UNIQUE (digest ASC) VISIBLE)`,
  'INSERT INTO fix_text (text) SELECT text from fix f ON DUPLICATE KEY UPDATE text=f.text',
  'ALTER TABLE fix ADD COLUMN ftId INT DEFAULT NULL',
  'UPDATE fix SET ftId = (SELECT ftId from fix_text WHERE digest = UNHEX(SHA2(fix.text, 256)))',
  'ALTER TABLE rev_group_rule_fix_map CHANGE COLUMN `fixId` `fixref` VARCHAR(255) NULL',
  `ALTER TABLE rev_group_rule_fix_map DROP FOREIGN KEY FK_rev_group_rule_fix_map_fix`,
  'ALTER TABLE rev_group_rule_fix_map ADD COLUMN ftId INT DEFAULT NULL',
  'ALTER TABLE rev_group_rule_fix_map ADD INDEX idx_ftId (ftId)',
  `UPDATE rev_group_rule_fix_map rgrf LEFT JOIN fix f on rgrf.fixref = f.fixId SET rgrf.ftId = f.ftId`,

  // rev_group_rule_cci_map
  `CREATE TABLE rev_group_rule_cci_map (
    rgrccId INT NOT NULL AUTO_INCREMENT,
    rgrId INT NOT NULL,
    cci VARCHAR(20) NOT NULL,
    PRIMARY KEY (rgrccId),
    UNIQUE INDEX index2 (rgrId ASC, cci ASC) VISIBLE,
    INDEX index3 (cci ASC) VISIBLE)`,
  `INSERT INTO rev_group_rule_cci_map (rgrId, cci) 
  SELECT
    rgrId,
    rc.cci
  FROM
    rev_group_rule_map rgr
      left join rule_cci_map rc using (ruleId)
  WHERE
    rc.cci is not null`,

  // drop legacy tables
  `DROP TABLE \`group\``,
  `DROP TABLE rule_cci_map`,
  `DROP TABLE rule`,
  `DROP table \`check\``,
  `DROP table fix`,
  `DROP table poam_rar_entry`,

  // VIEW for current_group_rule
  `CREATE OR REPLACE VIEW v_current_group_rule AS
  SELECT
  cr.benchmarkId
  ,rg.groupId
  ,rgr.ruleId
  ,rgr.\`version\`
  ,rgr.title
  ,rgr.severity
  ,rgr.weight
  ,rgr.vulnDiscussion
  ,rgr.falsePositives
  ,rgr.falseNegatives
  ,rgr.documentable
  ,rgr.mitigations
  ,rgr.severityOverrideGuidance
  ,rgr.potentialImpacts
  ,rgr.thirdPartyTools
  ,rgr.mitigationControl
  ,rgr.responsibility
  ,rgr.iaControls
  from current_rev cr left join rev_group_map rg using (revId) left join rev_group_rule_map rgr using(rgId)`
]

const downMigration = [
]

const migrationHandler = new MigrationHandler(upMigration, downMigration)
module.exports = {
  up: async (pool) => {
    await migrationHandler.up(pool, __filename)
  },
  down: async (pool) => {
    // await migrationHandler.down(pool, __filename)
  }
}
