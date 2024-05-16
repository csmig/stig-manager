const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS user_group_stig_asset_map`,
  `DROP TABLE IF EXISTS collection_grant_acl`,
  `DROP TABLE IF EXISTS collection_grant_group_acl`,
  `DROP TABLE IF EXISTS collection_grant_group`,
  `DROP TABLE IF EXISTS user_group_user_map`,
  `DROP TABLE IF EXISTS user_group`,

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

  // table collection_grant_group
  `CREATE TABLE collection_grant_group (
    cggId int NOT NULL AUTO_INCREMENT,
    collectionId int NOT NULL,
    userGroupId int NOT NULL,
    accessLevel int NOT NULL,
    PRIMARY KEY (cggId),
    UNIQUE KEY INDEX_UG_COLLECTION (userGroupId,collectionId),
    KEY INDEX_COLLECTION_ACCESS (collectionId,accessLevel),
    CONSTRAINT fk_collection_grant_group_1 FOREIGN KEY (userGroupId) REFERENCES user_group (userGroupId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_group_2 FOREIGN KEY (collectionId) REFERENCES collection (collectionId) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table user_group_stig_asset_map
  `CREATE TABLE user_group_stig_asset_map (
    id int NOT NULL AUTO_INCREMENT,
    userGroupId int NOT NULL,
    saId int NOT NULL,
    PRIMARY KEY (id),
    KEY fk_user_group_stig_asset_map_2 (userGroupId),
    KEY fk_user_group_stig_asset_map_1 (saId),
    CONSTRAINT fk_user_group_stig_asset_map_1 FOREIGN KEY (saId) REFERENCES stig_asset_map (saId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_group_stig_asset_map_2 FOREIGN KEY (userGroupId) REFERENCES user_group (userGroupId) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  // table collection_grant_acl
  `CREATE TABLE collection_grant_acl (
    cgAclId INT NOT NULL AUTO_INCREMENT,
    cgId INT NOT NULL,
    benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NULL,
    assetId INT NULL,
    clId INT NULL,
    access enum('none','r', 'rw') NOT NULL,
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

  // table collection_grant_group_acl
  `CREATE TABLE collection_grant_group_acl (
    cggAclId INT NOT NULL AUTO_INCREMENT,
    cggId INT NOT NULL,
    benchmarkId VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_as_cs NULL,
    assetId INT NULL,
    clId INT NULL,
    access enum('none','r', 'rw') NOT NULL,
    isRead tinyint GENERATED ALWAYS AS (case when (access = 'r' or access = 'rw') then 1 else NULL end) VIRTUAL,
    isWrite tinyint GENERATED ALWAYS AS (case when (access = 'rw') then 1 else NULL end) VIRTUAL,
    PRIMARY KEY (cggAclId),
    KEY fk_collection_grant_group_acl_1 (cggId),
    KEY fk_collection_grant_group_acl_2 (assetId, benchmarkId),
    KEY fk_collection_grant_group_acl_3 (benchmarkId, assetId),
    KEY fk_collection_grant_group_acl_4 (clId, benchmarkId),
    CONSTRAINT fk_collection_grant_group_acl_1 FOREIGN KEY (cggId) REFERENCES collection_grant_group (cggId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_group_acl_2 FOREIGN KEY (assetId) REFERENCES collection_grant_group (cggId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_group_acl_3 FOREIGN KEY (benchmarkId) REFERENCES stig (benchmarkId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_group_acl_4 FOREIGN KEY (clId) REFERENCES collection_label (clId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_collection_grant_group_acl_5 FOREIGN KEY (benchmarkId, assetId) REFERENCES stig_asset_map (benchmarkId, assetId) ON DELETE CASCADE ON UPDATE CASCADE
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
  UNION 
  select
    cgg.collectionId, 
    ugu.userId, 
    MAX(cgg.accessLevel) as accessLevel
  from 
    collection_grant_group cgg 
    left join user_group_user_map ugu on cgg.userGroupId = ugu.userGroupId
    left join collection_grant cg on (cgg.collectionId = cg.collectionId and ugu.userId = cg.userId)
    inner join collection c on (cgg.collectionId = c.collectionId and c.state = 'enabled')
  where
    cg.userId is null
  group by
    cgg.collectionId,
    ugu.userId`,

  // view v_collection_grant_sources
  `CREATE OR REPLACE VIEW v_collection_grant_sources AS
  select 
    cg.collectionId,
    cg.userId,
    cg.accessLevel,
    'user' AS grantSource,
	  json_array(json_object('userId', cast(ud.userId as char), 'username', ud.username)) as grantSources
  from
    collection_grant cg
    inner join collection c on (cg.collectionId = c.collectionId and c.state = 'enabled')
    left join user_data ud on cg.userId = ud.userId
  union 
  select
    collectionId,
    userId,
    accessLevel,
    'userGroup' as grantSource,
    userGroups as grantSources
  from
    (select
      ROW_NUMBER() OVER(PARTITION BY ugu.userId, cgg.collectionId ORDER BY cgg.accessLevel desc) as rn,
      cgg.collectionId, 
      ugu.userId, 
      cgg.accessLevel,
      json_arrayagg(
        json_object(
          'userGroupId', cast(cgg.userGroupId as char),
          'name', ug.name
        )) OVER (PARTITION BY ugu.userId, cgg.collectionId, cgg.accessLevel) as userGroups
    from 
      collection_grant_group cgg 
      left join user_group_user_map ugu on cgg.userGroupId = ugu.userGroupId
      left join user_group ug on ugu.userGroupId = ug.userGroupId
      left join collection_grant cg on (cgg.collectionId = cg.collectionId and ugu.userId = cg.userId)
      inner join collection c on (cgg.collectionId = c.collectionId and c.state = 'enabled')
    where
      cg.userId is null) dt
  where
    dt.rn = 1`,

  // view v_user_stig_asset_effective
  `CREATE OR REPLACE VIEW v_user_stig_asset_effective AS
  select 
    usa.userId,
    usa.saId
  from
    user_stig_asset_map usa
	  left join stig_asset_map sa on usa.saId = sa.saId
	  left join asset a on sa.assetId = a.assetId
    inner join collection c on (a.collectionId = c.collectionId and c.state = 'enabled')
  union 
	select
	  ugu.userId, 
	  ugsa.saId
	from 
	  user_group_stig_asset_map ugsa 
	  left join user_group_user_map ugu on ugsa.userGroupId = ugu.userGroupId
	  left join stig_asset_map sa on ugsa.saId = sa.saId
	  left join asset a on sa.assetId = a.assetId
	  left join collection_grant cg on (a.collectionId = cg.collectionId and ugu.userId = cg.userId)
    inner join collection c on (a.collectionId = c.collectionId and c.state = 'enabled')
  where
    cg.cgId is null`,

  // // delete phantom records from user_stig_asset_map
  // `delete usa
  // from
  //   user_stig_asset_map usa
  //   left join stig_asset_map sa using (saId)
  //   left join asset a on sa.assetId = a.assetId
  //   left join collection_grant cg on (a.collectionId = cg.collectionId and usa.userId = cg.userId and cg.accessLevel = 1)
  // where 
  //   cg.cgId is null`,

  // initialize collection_grant_acl
  `INSERT INTO collection_grant_acl (cgId, assetId, benchmarkId, access) SELECT
  cg.cgId,
  sa.assetId,
  sa.benchmarkId,
  'rw' 
FROM
  user_stig_asset_map usa
  left join stig_asset_map sa using (saId)
  left join asset a on sa.assetId = a.assetId
  left join collection_grant cg on (a.collectionId = cg.collectionId and usa.userId = cg.userId )
WHERE
  cg.cgId is not null`,

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


