const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // `DROP TABLE IF EXISTS user_group_stig_asset_map`,
  `DROP TABLE IF EXISTS collection_grant_acl`,
  `DROP TABLE IF EXISTS collection_grant_group_acl`,
  `DROP TABLE IF EXISTS collection_grant_group`,
  `DROP TABLE IF EXISTS user_group_user_map`,
  `DROP TABLE IF EXISTS user_group`,

  `ALTER TABLE asset ADD INDEX idx_asset_state (state ASC)`,
  `ALTER TABLE collection ADD INDEX index4 (collectionId ASC, state ASC)`,

  // table: user_group
  `CREATE TABLE user_group (
    userGroupId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    modifiedUserId INT NOT NULL,
    modifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    PRIMARY KEY (userGroupId),
    UNIQUE INDEX idx_name (name ASC),
    INDEX fk_user_group_1_idx (createdUserId ASC),
    INDEX fk_user_group_2_idx (modifiedUserId ASC),
    CONSTRAINT fk_user_group_1
      FOREIGN KEY (createdUserId)
      REFERENCES user_data (userId)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT,
    CONSTRAINT fk_user_group_2
      FOREIGN KEY (modifiedUserId)
      REFERENCES user_data (userId)
      ON DELETE RESTRICT
      ON UPDATE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table user_group_user_map
  `CREATE TABLE user_group_user_map (
    ugumId INT NOT NULL AUTO_INCREMENT,
    userGroupId INT NOT NULL,
    userId INT NOT NULL,
    PRIMARY KEY (ugumId),
    UNIQUE KEY INDEX_UG_USER (userGroupId,userId),
    INDEX fk_user_group_map_2_idx (userId ASC) VISIBLE,
    CONSTRAINT fk_user_group_map_1
      FOREIGN KEY (userGroupId)
      REFERENCES user_group (userGroupId)
      ON DELETE CASCADE
      ON UPDATE CASCADE,
    CONSTRAINT fk_user_group_map_2
      FOREIGN KEY (userId)
      REFERENCES user_data (userId)
      ON DELETE CASCADE
      ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table collection_grant
  `ALTER TABLE collection_grant DROP FOREIGN KEY fk_collection_grant_1`,
  `ALTER TABLE collection_grant ADD COLUMN userGroupId INT NULL AFTER userId, CHANGE COLUMN userId userId INT NULL`,
  `ALTER TABLE collection_grant ADD UNIQUE INDEX INDEX_USER_GROUP (userGroupId ASC, collectionId ASC) VISIBLE`,
  `ALTER TABLE collection_grant ADD CONSTRAINT fk_collection_grant_1 FOREIGN KEY (userId) REFERENCES user_data (userId) ON DELETE CASCADE ON UPDATE CASCADE`,
  `ALTER TABLE collection_grant ADD CONSTRAINT fk_collection_grant_3 FOREIGN KEY (userGroupId) REFERENCES user_group (userGroupId) ON DELETE CASCADE ON UPDATE CASCADE`,

  // table collection_grant_acl
  `CREATE TABLE collection_grant_acl (
    cgAclId INT NOT NULL AUTO_INCREMENT,
    cgId INT NOT NULL,
    benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NULL,
    assetId INT NULL,
    clId INT NULL,
    access enum('none','r', 'rw') NOT NULL,
    modifiedUserId int NULL,
    modifiedDate datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    isRead tinyint GENERATED ALWAYS AS (case when (access = 'r' or access = 'rw') then 1 else NULL end) VIRTUAL,
    isWrite tinyint GENERATED ALWAYS AS (case when (access = 'rw') then 1 else NULL end) VIRTUAL,
    PRIMARY KEY (cgAclId),
    KEY fk_collection_grant_acl_1 (cgId),
    KEY fk_collection_grant_acl_2 (assetId, benchmarkId),
    KEY fk_collection_grant_acl_3 (benchmarkId, assetId),
    KEY fk_collection_grant_acl_4 (clId, benchmarkId),
    CONSTRAINT fk_collection_grant_acl_1 FOREIGN KEY (cgId) REFERENCES collection_grant (cgId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_2 FOREIGN KEY (assetId) REFERENCES asset (assetId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_3 FOREIGN KEY (benchmarkId) REFERENCES stig (benchmarkId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_4 FOREIGN KEY (clId) REFERENCES collection_label (clId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_acl_5 FOREIGN KEY (benchmarkId, assetId) REFERENCES stig_asset_map (benchmarkId, assetId) ON DELETE CASCADE ON UPDATE CASCADE
  )`,

  // view v_collection_grant_effective
  `CREATE OR REPLACE VIEW v_collection_grant_effective AS
  select 
    cg.collectionId,
    cg.userId,
    cg.accessLevel
  from
      collection_grant cg
      inner join collection c on (cg.collectionId = c.collectionId and c.state = 'enabled')
  where
  cg.userId is not null
  UNION 
  select
    cg.collectionId, 
    ugu.userId, 
    MAX(cg.accessLevel) as accessLevel
  from 
    collection_grant cg
    left join user_group_user_map ugu on cg.userGroupId = ugu.userGroupId
    left join collection_grant cgDirect on (cg.collectionId = cgDirect.collectionId and ugu.userId = cgDirect.userId)
    inner join collection c on (cg.collectionId = c.collectionId and c.state = 'enabled')
  where
    cg.userGroupId is not null
    and cgDirect.cgId is null
  group by
    cg.collectionId,
    ugu.userId`,

//   // view v_collection_grantees
//   `CREATE OR REPLACE VIEW v_collection_grantees AS
//   select 
//   cg.collectionId,
//   cg.userId,
//   cg.accessLevel,
//   'user' AS grantee,
//   json_array(json_object(
//     'cgId', cg.cgId,
//     'userId', cast(ud.userId as char),
//     'username', ud.username)) as grantees
// from
//   collection_grant cg
//   inner join collection c on (cg.collectionId = c.collectionId and c.state = 'enabled')
//   left join user_data ud on cg.userId = ud.userId
// where
//   cg.userId is not null
// union 
// select
//   collectionId,
//   userId,
//   accessLevel,
//   'userGroup' as grantee,
//   userGroups as grantees
// from
//   (select
//     ROW_NUMBER() OVER(PARTITION BY ugu.userId, cg.collectionId ORDER BY cg.accessLevel desc) as rn,
//     cg.collectionId, 
//     ugu.userId, 
//     cg.accessLevel,
//     json_arrayagg(
//       json_object(
//         'cgId', cg.cgId,
//         'userGroupId', cast(cg.userGroupId as char),
//         'name', ug.name
//       )) OVER (PARTITION BY ugu.userId, cg.collectionId, cg.accessLevel) as userGroups
//   from 
//     collection_grant cg
//     left join user_group_user_map ugu on cg.userGroupId = ugu.userGroupId
//     left join user_group ug on ugu.userGroupId = ug.userGroupId
//     left join collection_grant cgDirect on (cg.collectionId = cgDirect.collectionId and ugu.userId = cgDirect.userId)
//     inner join collection c on (cg.collectionId = c.collectionId and c.state = 'enabled')
//   where
//     cg.userGroupId is not null
//     and cgDirect.userId is null) dt
// where
//   dt.rn = 1`,

  // // view v_user_stig_asset_effective
  `CREATE OR REPLACE VIEW v_user_stig_asset_effective AS
  with cteDirectMapped as (select 
		cg.cgId,
		cg.collectionId,
		cg.userId,
		cg.userGroupId,
		sa.saId,
		sa.assetId,
		sa.benchmarkId,
		cga.access,
		case when cga.benchmarkId is not null then 1 else 0 end +
    case when cga.assetId is not null then 1 else 0 end +
		case when cga.clId is not null then 1 else 0 end as specificity
	from
		collection_grant_acl cga
		left join collection_grant cg on cga.cgId = cg.cgId
		inner join collection c on cg.collectionId = c.collectionId and c.state = 'enabled'
		left join collection_label_asset_map cla on cga.clId = cla.clId
		inner join stig_asset_map sa on (
      case when cga.assetId is not null 
			  then cga.assetId = sa.assetId 
        else true
      end and 
      case when cga.benchmarkId is not null 
        then cga.benchmarkId = sa.benchmarkId
         else true
		  end and
		  case when cga.clId is not null 
        then cla.assetId = sa.assetId
        else true
		  end)
   	inner join asset a on sa.assetId = a.assetId and cg.collectionId = a.collectionId and a.state = 'enabled'
	where
		cg.userId is not null
),
cteGroupMapped as (select 
		cg.cgId,
		cg.collectionId,
		ugu.userId,
		cg.userGroupId,
		sa.saId,
		sa.assetId,
		sa.benchmarkId,
		cga.access,
		case when cga.benchmarkId is not null then 1 else 0 end +
    case when cga.assetId is not null then 1 else 0 end +
		case when cga.clId is not null then 1 else 0 end as specificity
	from
		collection_grant_acl cga
		left join collection_grant cg on cga.cgId = cg.cgId
		inner join collection c on cg.collectionId = c.collectionId and c.state = 'enabled'
    left join user_group_user_map ugu on cg.userGroupId = ugu.userGroupId
    left join collection_grant cgDirect on c.collectionId = cgDirect.collectionId and ugu.userId = cgDirect.userId
		left join collection_label_asset_map cla on cga.clId = cla.clId
		inner join stig_asset_map sa on (
      case when cga.assetId is not null 
			  then cga.assetId = sa.assetId 
        else true
      end and 
      case when cga.benchmarkId is not null 
        then cga.benchmarkId = sa.benchmarkId
        else true
		  end and
		  case when cga.clId is not null 
        then cla.assetId = sa.assetId
        else true
		  end)
   		inner join asset a on sa.assetId = a.assetId and cg.collectionId = a.collectionId and a.state = 'enabled'
	where
		cg.userGroupId is not null
    and cgDirect.userId is null
),
cteDirectRanked as (
	select
		cgId,
		collectionId,
		userId,
		userGroupId,
		saId,
		assetId,
		benchmarkId,
		access,
		specificity,
		row_number() over (partition by userId, saId order by specificity desc, access asc) as rn
	from 
		cteDirectMapped),
cteGroupRanked as (
	select
		cgId,
		collectionId,
		userId,
		userGroupId,
		saId,
		assetId,
		benchmarkId,
		access,
		specificity,
		row_number() over (partition by userId, saId order by specificity desc, access asc) as rn
	from 
		cteGroupMapped)
  select * from cteDirectRanked where	rn = 1
  union
  select * from cteGroupRanked where	rn = 1`,

  // initialize collection_grant_acl
  `INSERT INTO collection_grant_acl (cgId, assetId, benchmarkId, access, modifiedUserId, modifiedDate) SELECT
  cg.cgId,
  sa.assetId,
  sa.benchmarkId,
  'rw',
  null,
  null 
FROM
  user_stig_asset_map usa
  left join stig_asset_map sa using (saId)
  left join asset a on sa.assetId = a.assetId
  left join collection_grant cg on (a.collectionId = cg.collectionId and usa.userId = cg.userId )
WHERE
  cg.cgId is not null`,

  `DROP TABLE user_stig_asset_map`
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


