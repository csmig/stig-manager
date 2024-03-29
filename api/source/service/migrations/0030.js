const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  // table: user_group
  `CREATE TABLE user_group (
    userGroupId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NULL,
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    lastModifiedUserId INT NOT NULL,
    lastModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    PRIMARY KEY (userGroupId),
    UNIQUE INDEX idx_name (name ASC) VISIBLE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
  
  // table user_group_map
  `CREATE TABLE user_group_map (
    ugmId INT NOT NULL AUTO_INCREMENT,
    userGroupId INT NOT NULL,
    userId INT NOT NULL,
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    lastModifiedUserId INT NOT NULL,
    lastModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    PRIMARY KEY (ugmId),
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
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    lastModifiedUserId INT NOT NULL,
    lastModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
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
    createdUserId INT NOT NULL,
    createdDate DATETIME DEFAULT CURRENT_TIMESTAMP, 
    lastModifiedUserId INT NOT NULL,
    lastModifiedDate DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, 
    PRIMARY KEY (id),
    KEY fk_user_group_stig_asset_map_2 (userGroupId),
    KEY fk_user_group_stig_asset_map_1 (saId),
    CONSTRAINT fk_user_group_stig_asset_map_1 FOREIGN KEY (saId) REFERENCES stig_asset_map (saId) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_user_group_stig_asset_map_2 FOREIGN KEY (userGroupId) REFERENCES user_group (userGroupId) ON DELETE CASCADE ON UPDATE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`
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


