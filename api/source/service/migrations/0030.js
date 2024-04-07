const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
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

  // view v_collection_grant_effective
  `CREATE OR REPLACE VIEW v_collection_grant_effective AS
  select 
    collectionId,
    userId,
    accessLevel,
    'user' AS grantSource,
    userId as grantSourceId
  from
    collection_grant
  union 
  select
    collectionId,
    userId,
    accessLevel,
    'userGroup' as grantSource,
    userGroupId as grantSourceId
    from
      (select
        ROW_NUMBER() OVER(PARTITION BY ugu.userId, cgg.collectionId ORDER BY cgg.accessLevel desc) as rn,
        cgg.collectionId, 
        ugu.userId, 
        cgg.accessLevel,
        cgg.userGroupId
      from 
        collection_grant_group cgg 
        left join user_group_user_map ugu using (userGroupId)
        left join collection_grant cg on (cgg.collectionId = cg.collectionId and ugu.userId = cg.userId)
      where
        cg.userId is null) dt
    where
      dt.rn = 1`,
  
  // view v_user_stig_asset_effective
  `CREATE OR REPLACE VIEW v_user_stig_asset_effective AS
  select  userId, saId from user_stig_asset_map
  union 
  select
	  ugu.userId, 
	  ugsa.saId
	from 
	  user_group_stig_asset_map ugsa 
	  left join user_group_user_map ugu using (userGroupId)
	  left join user_stig_asset_map usa on (ugsa.saId = usa.saId and ugu.userId = usa.userId)
	where
	  usa.id is null`,
    
  // delete phantom records from user_stig_asset_map
  `delete usa
  from
    user_stig_asset_map usa
    left join stig_asset_map sa using (saId)
    left join asset a on sa.assetId = a.assetId
    left join collection_grant cg on (a.collectionId = cg.collectionId and usa.userId = cg.userId and cg.accessLevel = 1)
  where 
    cg.cgId is null`
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


