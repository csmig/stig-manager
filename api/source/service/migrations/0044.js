const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
  `DROP TABLE IF EXISTS job`,
  `CREATE TABLE job (
    jobId INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(45) NOT NULL,
    description VARCHAR(255) NULL,
    createdBy INT NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jobId),
    CONSTRAINT fk_job_createdBy FOREIGN KEY (createdBy) REFERENCES user_data(userId) ON DELETE RESTRICT
  )`,

  `DROP TABLE IF EXISTS job_task_map`,
  `CREATE TABLE job_task_map (
    jtId INT NOT NULL AUTO_INCREMENT,
    jobId INT NOT NULL,
    taskname VARCHAR(255) NOT NULL,
    parameters VARCHAR(1024) NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jtId),
    CONSTRAINT fk_job_task_jobId FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE
  )`,

  `DROP TABLE IF EXISTS job_run`,
  `CREATE TABLE job_run (
    jrId INT NOT NULL AUTO_INCREMENT,
    jobId INT NOT NULL,
    runId BINARY(16) NOT NULL,
    state VARCHAR(255) NULL,
    created TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (jrId),
    CONSTRAINT fk_job_run_jobId FOREIGN KEY (jobId) REFERENCES job(jobId) ON DELETE CASCADE
  )`,

  `DROP procedure IF EXISTS run_job`,  
  `CREATE PROCEDURE run_job(
    IN in_jobId INT,
    IN in_runIdStr VARCHAR(36)
  )
    main:BEGIN
        DECLARE v_done INT DEFAULT FALSE;
        DECLARE v_task_name VARCHAR(255);
        DECLARE v_task_params VARCHAR(255);
        DECLARE v_runId BINARY(16);
        DECLARE v_jrId INT;
        DECLARE v_numTasks INT;
        DECLARE v_currentTask INT DEFAULT 0;
        DECLARE v_sql TEXT;
        DECLARE cur CURSOR FOR
          SELECT taskname, parameters FROM job_task_map WHERE jobId = in_jobId ORDER BY jtId ASC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = TRUE;

        -- Get the number of tasks for the job
        SELECT COUNT(*) INTO v_numTasks FROM job_task_map WHERE jobId = in_jobId;

        IF v_numTasks = 0 THEN
          LEAVE main; -- No tasks to run, exit the procedure
        END IF;

        -- === Pre-task-loop logic ===
        IF in_runIdStr IS NOT NULL AND in_runIdStr REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$' THEN
          SET v_runId = UUID_TO_BIN(in_runIdStr, 1);
        ELSE
          SET v_runId = UUID_TO_BIN(UUID(), 1);
        END IF;

        INSERT INTO job_run(jobId, runId, state) VALUES (in_jobId, v_runId, 'running');
        SET v_jrId = LAST_INSERT_ID();
        CREATE TEMPORARY TABLE IF NOT EXISTS t_runId SELECT v_runId AS runId, v_jrId AS jrId;

        OPEN cur;
        read_loop: LOOP
          FETCH cur INTO v_task_name, v_task_params;
          IF v_done THEN
            LEAVE read_loop;
          END IF;

          -- Dynamic SQL to call the task procedure with or without parameters
          IF v_task_params IS NULL OR LENGTH(TRIM(v_task_params)) = 0 THEN
            SET @sql = CONCAT('CALL ', v_task_name, '()');
          ELSE
            SET @sql = CONCAT('CALL ', v_task_name, '(', v_task_params, ')');
          END IF;
          PREPARE stmt FROM @sql;
          EXECUTE stmt;
          DEALLOCATE PREPARE stmt;
        END LOOP;
        CLOSE cur;

        -- === Post-task-loop logic ===
        UPDATE job_run SET state = 'completed' WHERE jobId = in_jobId AND state = 'running';  
    END`,

  `DROP TABLE IF EXISTS task_output`,
  `CREATE TABLE task_output (
    id INT NOT NULL AUTO_INCREMENT,
    runId BINARY(16) NOT NULL,
    taskname VARCHAR(255) NOT NULL,
    ts TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    data JSON NULL,
    PRIMARY KEY (id)
  )`,

  `DROP procedure IF EXISTS task_output`,
  `CREATE PROCEDURE task_output(
    IN in_runId BINARY(16),
    IN in_taskname VARCHAR(255),
    IN in_data JSON
    )
    BEGIN
      insert into task_output (runId, taskname, data) values (in_runId, in_taskname, in_data);
    END`,

  `DROP PROCEDURE IF EXISTS task_delete_disabled`,
  `CREATE PROCEDURE task_delete_disabled()
    BEGIN
    DECLARE v_incrementValue INT DEFAULT 10000;
    DECLARE v_curMinId BIGINT DEFAULT 1;
    DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;
    DECLARE v_numCollectionIds INT;
    DECLARE v_numAssetIds INT;
    DECLARE v_numReviewIds INT;
    DECLARE v_numHistoryIds INT;
    DECLARE v_runId BINARY(16);
    DECLARE v_taskname VARCHAR(255) DEFAULT 'task_delete_disabled';
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
      DECLARE err_code INT;
      DECLARE err_msg TEXT;
      GET DIAGNOSTICS CONDITION 1
        err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
      CALL task_output(v_runId, v_taskname, JSON_OBJECT('message', 'error', 'error_code', err_code, 'error_message', err_msg));
    END;


    -- Set v_runId from t_runId if table exists, else generate a new UUID
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 't_runId') THEN
      SET v_runId = (SELECT runId FROM t_runId LIMIT 1);
    ELSE
      SET v_runId = UUID_TO_BIN(UUID(),1);
    END IF;


    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'Task started'));
    drop temporary table if exists t_collectionIds;
    create temporary table t_collectionIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select collectionId from collection where isEnabled is null;
    select max(seq) into v_numCollectionIds from t_collectionIds;
    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_collectionIds', 'count', v_numCollectionIds));

    drop temporary table if exists t_assetIds;
    create temporary table t_assetIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select assetId from asset where isEnabled is null or collectionId in (select collectionId from t_collectionIds);
    select max(seq) into v_numAssetIds from t_assetIds;
    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_assetIds', 'count', v_numAssetIds));

    drop temporary table if exists t_reviewIds;
    create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select reviewId from review where assetId in (select assetId from t_assetIds);
    select max(seq) into v_numReviewIds from t_reviewIds;
    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_reviewIds', 'count', v_numReviewIds));

    drop temporary table if exists t_historyIds;
    create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
      select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
    select max(seq) into v_numHistoryIds from t_historyIds;
    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_historyIds', 'count', v_numHistoryIds));

    IF v_numHistoryIds > 0 THEN
    REPEAT
      CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'review_history', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numHistoryIds));
      delete from review_history where historyId IN (
          select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
        );
      SET v_curMinId = v_curMinId + v_incrementValue;
      SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_historyIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numReviewIds > 0 THEN
      REPEAT
        CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'review', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numReviewIds));
        delete from review where reviewId IN (
            select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_reviewIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numAssetIds > 0 THEN
      REPEAT
        CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'asset', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numAssetIds));
        delete from asset where assetId IN (
            select assetId from t_assetIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
    UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_assetIds;

    SET v_curMinId = 1;
    SET v_curMaxId = v_curMinId + v_incrementValue;
    IF v_numCollectionIds > 0 THEN
      REPEAT
        CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'collection', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numCollectionIds));
        delete from collection where collectionId IN (
            select collectionId from t_collectionIds where seq >= v_curMinId and seq < v_curMaxId
          );
        SET v_curMinId = v_curMinId + v_incrementValue;
        SET v_curMaxId = v_curMaxId + v_incrementValue;
      UNTIL ROW_COUNT() = 0 END REPEAT;
    END IF;
    drop temporary table if exists t_collectionIds;

    CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'Task finished'));
    END`,

  `DROP PROCEDURE IF EXISTS task_delete_stale`,
  `CREATE PROCEDURE task_delete_stale(IN in_context VARCHAR(255))
    BEGIN
      DECLARE v_runId BINARY(16);
      DECLARE v_numReviewIds INT;
      DECLARE v_numHistoryIds INT;
      DECLARE v_incrementValue INT DEFAULT 10000;
      DECLARE v_curMinId BIGINT DEFAULT 1;
      DECLARE v_curMaxId BIGINT DEFAULT v_incrementValue + 1;

      DECLARE v_taskname VARCHAR(255) DEFAULT 'task_delete_stale';
      DECLARE EXIT HANDLER FOR SQLEXCEPTION
      BEGIN
        DECLARE err_code INT;
        DECLARE err_msg TEXT;
        GET DIAGNOSTICS CONDITION 1
          err_code = MYSQL_ERRNO, err_msg = MESSAGE_TEXT;
        CALL task_output(v_runId, v_taskname, JSON_OBJECT('message', 'error', 'error_code', err_code, 'error_message', err_msg));
      END;

      -- Set v_runId from t_runId if table exists, else generate a new UUID
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 't_runId') THEN
        SET v_runId = (SELECT runId FROM t_runId LIMIT 1);
      ELSE
        SET v_runId = UUID_TO_BIN(UUID(),1);
      END IF;
      CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'Task started'));

      drop temporary table if exists t_reviewIds;
      create temporary table t_reviewIds (seq INT AUTO_INCREMENT PRIMARY KEY, reviewId INT);
      -- Context-specific logic
      IF in_context = 'system' THEN
        INSERT into t_reviewIds (reviewId)
        select r.reviewId from review r
        left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
        where rgr.rgrId is null;
      ELSEIF in_context = 'asset' THEN
        INSERT into t_reviewIds (reviewId)
        select
          r.reviewId
        from
          review r
          left join rev_group_rule_map rgr on (r.version = rgr.version and r.checkDigest = rgr.checkDigest)
          left join revision on (rgr.revId = revision.revId)
          left join stig_asset_map sa on (r.assetId = sa.assetId and revision.benchmarkId = sa.benchmarkId)
        group by
          r.reviewId
        having
          count(sa.saId) = 0;
      END IF;

      select max(seq) into v_numReviewIds from t_reviewIds;
      CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_reviewIds', 'count', v_numReviewIds));

      IF v_numReviewIds > 0 THEN
        drop temporary table if exists t_historyIds;
        create temporary table t_historyIds (seq INT AUTO_INCREMENT PRIMARY KEY)
          select historyId from review_history where reviewId in (select reviewId from t_reviewIds);
        select max(seq) into v_numHistoryIds from t_historyIds;
        CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'created table', 'table', 't_historyIds', 'count', v_numHistoryIds));
        IF v_numHistoryIds > 0 THEN
          SET v_curMinId = 1;
          SET v_curMaxId = v_curMinId + v_incrementValue;
          REPEAT
            CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'review_history', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numHistoryIds));
            delete from review_history where historyId IN (
                select historyId from t_historyIds where seq >= v_curMinId and seq < v_curMaxId
              );
            SET v_curMinId = v_curMinId + v_incrementValue;
            SET v_curMaxId = v_curMaxId + v_incrementValue;
          UNTIL ROW_COUNT() = 0 END REPEAT;
        END IF;
        SET v_curMinId = 1;
        SET v_curMaxId = v_curMinId + v_incrementValue;
        REPEAT
          CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'delete range', 'table', 'review', 'range_start', v_curMinId, 'range_end', v_curMaxId, 'range_size', v_numReviewIds));
          delete from review where reviewId IN (
              select reviewId from t_reviewIds where seq >= v_curMinId and seq < v_curMaxId
            );
          SET v_curMinId = v_curMinId + v_incrementValue;
          SET v_curMaxId = v_curMaxId + v_incrementValue;
        UNTIL ROW_COUNT() = 0 END REPEAT;
      END IF;
      CALL task_output (v_runId, v_taskname, JSON_OBJECT('message', 'Task finished'));
    END;`

]

const downMigration = [
  `DROP TABLE IF EXISTS job_run`,
  `DROP TABLE IF EXISTS job_task_map`,
  `DROP TABLE IF EXISTS job`,
  `DROP TABLE IF EXISTS task_output`,
  `DROP PROCEDURE IF EXISTS task_output`,
  // `DROP PROCEDURE IF EXISTS task_start`, --- IGNORE ---
  // `DROP PROCEDURE IF EXISTS task_failed`, --- IGNORE ---
  // `DROP PROCEDURE IF EXISTS task_finished`, --- IGNORE ---
  `DROP PROCEDURE IF EXISTS task_delete_disabled`
  // `DROP PROCEDURE IF EXISTS delete_disabled_objects` --- IGNORE ---
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
