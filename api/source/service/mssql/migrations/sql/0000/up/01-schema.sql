CREATE TABLE [config]
(
	[key] nvarchar(45) NOT NULL, 
	value nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_config_key] PRIMARY KEY ([key])
);
CREATE TABLE [action]
(
	actionId int NOT NULL IDENTITY(4, 1), 
	api nvarchar(16) NOT NULL, 
	en nvarchar(64) NOT NULL, 
	CONSTRAINT [PK_action_actionId] PRIMARY KEY (actionId)
);
CREATE TABLE [cci]
(
	cci nvarchar(20) NOT NULL, 
	status nvarchar(20) NOT NULL, 
	publishdate date NOT NULL, 
	contributor nvarchar(255) NOT NULL, 
	type nvarchar(20) NOT NULL, 
	definition nvarchar(max) NOT NULL, 
	apAcronym nvarchar(20) NULL DEFAULT NULL, 
	implementation nvarchar(max) NULL, 
	assessmentProcedure nvarchar(max) NULL, 
	CONSTRAINT [PK_cci_cci] PRIMARY KEY (cci)
);
CREATE TABLE [cci_reference_map]
(
	cciRefId int NOT NULL IDENTITY(24394, 1), 
	cci nvarchar(20) NOT NULL, 
	creator nvarchar(255) NOT NULL, 
	title nvarchar(255) NOT NULL, 
	version nvarchar(255) NOT NULL, 
	location nvarchar(255) NOT NULL, 
	indexDisa nvarchar(255) NOT NULL, 
	textRefNist nvarchar(255) NOT NULL, 
	parentControl nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_cci_reference_map_cciRefId] PRIMARY KEY (cciRefId)
);
CREATE 
	NONCLUSTERED INDEX cci
		ON [cci_reference_map] (cci ASC);
CREATE 
	NONCLUSTERED INDEX textRefNist
		ON [cci_reference_map] (textRefNist ASC);
CREATE 
	NONCLUSTERED INDEX ap
		ON [cci] (apAcronym ASC);
CREATE TABLE [check]
(
	checkId nvarchar(255) NOT NULL, 
	content nvarchar(max) NULL, 
	CONSTRAINT [PK_check_checkId] PRIMARY KEY (checkId)
);
CREATE TABLE [collection]
(
	collectionId int NOT NULL IDENTITY(133, 1), 
	name nvarchar(45) NOT NULL, 
	description nvarchar(255) NULL DEFAULT NULL, 
	workflow nvarchar(45) NOT NULL, 
	metadata nvarchar(max) NOT NULL, 
	created datetime2(0) NOT NULL DEFAULT getdate(), 
	CONSTRAINT [PK_collection_collectionId] PRIMARY KEY (collectionId), 
	CONSTRAINT collection$index2 UNIQUE (name)
);
CREATE TABLE [current_group_rule]
(
	cgrId int NOT NULL IDENTITY(130888, 1), 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	groupId nvarchar(45) NOT NULL, 
	ruleId nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_current_group_rule_cgrId] PRIMARY KEY (cgrId)
);
CREATE 
	NONCLUSTERED INDEX idx_benchmarkId
		ON [current_group_rule] (benchmarkId ASC);
CREATE 
	NONCLUSTERED INDEX idx_rule
		ON [current_group_rule] (ruleId ASC);
CREATE 
	NONCLUSTERED INDEX idx_group
		ON [current_group_rule] (groupId ASC);
CREATE TABLE [user_data]
(
	userId int NOT NULL IDENTITY(1560, 1), 
	username nvarchar(255) NOT NULL, 
	created datetime2(0) NOT NULL DEFAULT getdate(), 
	lastAccess int NULL DEFAULT NULL, 
	lastClaims nvarchar(max) NULL DEFAULT N'{}', 
	CONSTRAINT [PK_user_data_userId] PRIMARY KEY (userId), 
	CONSTRAINT user_data$INDEX_username UNIQUE (username)
);
CREATE TABLE [collection_grant]
(
	cgId int NOT NULL IDENTITY(1936, 1), 
	collectionId int NOT NULL, 
	userId int NOT NULL, 
	accessLevel int NOT NULL, 
	CONSTRAINT [PK_collection_grant_cgId] PRIMARY KEY (cgId), 
	CONSTRAINT collection_grant$INDEX_USER UNIQUE (userId, collectionId), 
	CONSTRAINT [collection_grant$fk_collection_grant_1] FOREIGN KEY (userId) REFERENCES user_data (userId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE, 
	CONSTRAINT [collection_grant$fk_collection_grant_2] FOREIGN KEY (collectionId) REFERENCES collection (collectionId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX INDEX_COLLECTION
		ON [collection_grant] (collectionId ASC, accessLevel ASC);
CREATE TABLE [current_rev]
(
	revId nvarchar(255) NOT NULL, 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	version int NOT NULL, 
	release nvarchar(45) NOT NULL, 
	benchmarkDate nvarchar(45) NULL DEFAULT NULL, 
	benchmarkDateSql date NULL DEFAULT NULL, 
	status nvarchar(45) NULL DEFAULT NULL, 
	statusDate nvarchar(45) NULL DEFAULT NULL, 
	description nvarchar(4000) NULL DEFAULT NULL, 
	active smallint NULL DEFAULT NULL, 
	groupCount int NOT NULL DEFAULT 0, 
	ruleCount int NOT NULL DEFAULT 0, 
	checkCount int NOT NULL DEFAULT 0, 
	fixCount int NOT NULL DEFAULT 0, 
	ovalCount int NOT NULL DEFAULT 0, 
	CONSTRAINT [PK_current_rev_revId] PRIMARY KEY (revId), 
	CONSTRAINT current_rev$index2 UNIQUE (benchmarkId)
);
CREATE TABLE [asset]
(
	assetId int NOT NULL IDENTITY(899, 1), 
	name nvarchar(255) NOT NULL, 
	fqdn nvarchar(255) NULL DEFAULT NULL, 
	collectionId int NOT NULL, 
	ip nvarchar(255) NULL DEFAULT NULL, 
	mac nvarchar(255) NULL DEFAULT NULL, 
	description nvarchar(255) NULL DEFAULT NULL, 
	noncomputing binary(1) NOT NULL DEFAULT 0x0, 
	metadata nvarchar(max) NOT NULL, 
	CONSTRAINT [PK_asset_assetId] PRIMARY KEY (assetId), 
	CONSTRAINT asset$INDEX_NAMECOLLECTION UNIQUE (name, collectionId), 
	CONSTRAINT [asset$FK_ASSET_2] FOREIGN KEY (collectionId) REFERENCES collection (collectionId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX INDEX_COMPUTING
		ON [asset] (noncomputing ASC);
CREATE 
	NONCLUSTERED INDEX INDEX_COLLECTIONID
		ON [asset] (collectionId ASC);
CREATE TABLE [fix]
(
	fixId nvarchar(255) NOT NULL, 
	text nvarchar(max) NULL, 
	CONSTRAINT [PK_fix_fixId] PRIMARY KEY (fixId)
);
CREATE TABLE [group]
(
	groupId nvarchar(45) NOT NULL, 
	title nvarchar(255) NULL DEFAULT NULL, 
	severity nvarchar(45) NULL DEFAULT NULL, 
	CONSTRAINT [PK_group_groupId] PRIMARY KEY (groupId)
);
CREATE TABLE [result]
(
	resultId int NOT NULL IDENTITY(10, 1), 
	api nvarchar(32) NOT NULL, 
	ckl nvarchar(32) NOT NULL, 
	abbr nvarchar(2) NOT NULL, 
	en nvarchar(64) NOT NULL, 
	CONSTRAINT [PK_result_resultId] PRIMARY KEY (resultId), 
	CONSTRAINT result$RESULT_API UNIQUE (api)
);
CREATE TABLE [stig]
(
	benchmarkId nvarchar(255) NOT NULL, 
	title nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_stig_benchmarkId] PRIMARY KEY (benchmarkId)
);
CREATE 
	NONCLUSTERED INDEX idx_benchmark_title
		ON [stig] (title ASC);
CREATE TABLE [revision]
(
	revId nvarchar(255) NOT NULL, 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	version int NOT NULL, 
	release nvarchar(45) NOT NULL, 
	benchmarkDate nvarchar(45) NULL DEFAULT NULL, 
	benchmarkDateSql date NULL DEFAULT NULL, 
	status nvarchar(45) NULL DEFAULT NULL, 
	statusDate nvarchar(45) NULL DEFAULT NULL, 
	description nvarchar(4000) NULL DEFAULT NULL, 
	active smallint NULL DEFAULT 1, 
	groupCount int NOT NULL DEFAULT 0, 
	ruleCount int NOT NULL DEFAULT 0, 
	checkCount int NOT NULL DEFAULT 0, 
	fixCount int NOT NULL DEFAULT 0, 
	ovalCount int NOT NULL DEFAULT 0, 
	CONSTRAINT [PK_revision_revId] PRIMARY KEY (revId), 
	CONSTRAINT revision$uidx_revision_benchmarkId_version_release UNIQUE (benchmarkId, version, release), 
	CONSTRAINT [revision$FK_REVISION_1] FOREIGN KEY (benchmarkId) REFERENCES stig (benchmarkId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE TABLE [rule]
(
	ruleId nvarchar(255) NOT NULL, 
	version nvarchar(45) NOT NULL, 
	title nvarchar(1000) NULL DEFAULT NULL, 
	severity nvarchar(45) NULL DEFAULT NULL, 
	weight nvarchar(45) NULL DEFAULT NULL, 
	vulnDiscussion nvarchar(max) NULL, 
	falsePositives nvarchar(max) NULL, 
	falseNegatives nvarchar(max) NULL, 
	documentable nvarchar(45) NULL DEFAULT NULL, 
	mitigations nvarchar(max) NULL, 
	severityOverrideGuidance nvarchar(max) NULL, 
	potentialImpacts nvarchar(max) NULL, 
	thirdPartyTools nvarchar(max) NULL, 
	mitigationControl nvarchar(max) NULL, 
	responsibility nvarchar(255) NULL DEFAULT NULL, 
	iaControls nvarchar(255) NULL DEFAULT NULL, 
	CONSTRAINT [PK_rule_ruleId] PRIMARY KEY (ruleId)
);
CREATE 
	NONCLUSTERED INDEX idx_rule_severity
		ON [rule] (severity ASC);
CREATE TABLE [rev_group_map]
(
	rgId int NOT NULL IDENTITY(88663, 1), 
	revId nvarchar(255) NULL DEFAULT NULL, 
	groupId nvarchar(45) NULL DEFAULT NULL, 
	rules nvarchar(max) NULL DEFAULT NULL, 
	CONSTRAINT [PK_rev_group_map_rgId] PRIMARY KEY (rgId), 
	CONSTRAINT rev_group_map$uidx_rgm_revId_groupId UNIQUE (revId, groupId), 
	CONSTRAINT [rev_group_map$FK_rev_group_map_group] FOREIGN KEY (groupId) REFERENCES [group] (groupId), 
	CONSTRAINT [rev_group_map$FK_rev_group_map_revision] FOREIGN KEY (revId) REFERENCES [revision] (revId) 
		 ON DELETE CASCADE 
);
CREATE 
	NONCLUSTERED INDEX idx_rgm_groupId
		ON [rev_group_map] (groupId ASC);
CREATE TABLE [rev_group_rule_map]
(
	rgrId int NOT NULL IDENTITY(33586, 1), 
	rgId int NOT NULL, 
	ruleId nvarchar(255) NULL DEFAULT NULL, 
	checks nvarchar(max) NULL DEFAULT NULL, 
	fixes nvarchar(max) NULL DEFAULT NULL, 
	ccis nvarchar(max) NULL DEFAULT NULL, 
	CONSTRAINT [PK_rev_group_rule_map_rgrId] PRIMARY KEY (rgrId), 
	CONSTRAINT rev_group_rule_map$uidx_rgrm_rgId_ruleId UNIQUE (rgId, ruleId), 
	CONSTRAINT [rev_group_rule_map$FK_rev_group_rule_map_rev_group_map] FOREIGN KEY (rgId) REFERENCES rev_group_map (rgId) 
		 ON DELETE CASCADE, 
	CONSTRAINT [rev_group_rule_map$FK_rev_group_rule_map_rule] FOREIGN KEY (ruleId) REFERENCES [rule] (ruleId)
);
CREATE 
	NONCLUSTERED INDEX idx_rgrm_ruleId
		ON [rev_group_rule_map] (ruleId ASC);
CREATE TABLE [rev_group_rule_check_map]
(
	rgrcId int NOT NULL IDENTITY(33626, 1), 
	rgrId int NOT NULL, 
	checkId nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_rev_group_rule_check_map_rgrcId] PRIMARY KEY (rgrcId), 
	CONSTRAINT rev_group_rule_check_map$uidx_rcm_ruleId_checkId UNIQUE (rgrId, checkId), 
	CONSTRAINT [rev_group_rule_check_map$FK_rev_group_rule_check_map_check] FOREIGN KEY (checkId) REFERENCES [check] (checkId), 
	CONSTRAINT [rev_group_rule_check_map$FK_rev_group_rule_check_map_rev_group_rule_map] FOREIGN KEY (rgrId) REFERENCES rev_group_rule_map (rgrId) 
		 ON DELETE CASCADE
);
CREATE 
	NONCLUSTERED INDEX idx_rcm_checkId
		ON [rev_group_rule_check_map] (checkId ASC);
CREATE TABLE [rev_group_rule_fix_map]
(
	rgrfId int NOT NULL IDENTITY(33586, 1), 
	rgrId int NOT NULL, 
	fixId nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_rev_group_rule_fix_map_rgrfId] PRIMARY KEY (rgrfId), 
	CONSTRAINT rev_group_rule_fix_map$uidx_rfm_ruleId_fixId UNIQUE (rgrId, fixId), 
	CONSTRAINT [rev_group_rule_fix_map$FK_rev_group_rule_fix_map_fix] FOREIGN KEY (fixId) REFERENCES fix (fixId), 
	CONSTRAINT [rev_group_rule_fix_map$FK_rev_group_rule_fix_map_rev_group_rule_map] FOREIGN KEY (rgrId) REFERENCES rev_group_rule_map (rgrId) 
		 ON DELETE CASCADE
);
CREATE 
	NONCLUSTERED INDEX idx_rfm_fixId
		ON [rev_group_rule_fix_map] (fixId ASC);
CREATE TABLE [rev_xml_map]
(
	rxId int NOT NULL IDENTITY, 
	revId nvarchar(255) NOT NULL, 
	xml varbinary(max) NULL, 
	CONSTRAINT [PK_rev_xml_map_rxId] PRIMARY KEY (rxId), 
	CONSTRAINT rev_xml_map$uidx_rxm_revId UNIQUE (revId)
);
CREATE TABLE [review]
(
	reviewId int NOT NULL IDENTITY(29, 1), 
	assetId int NULL DEFAULT NULL, 
	ruleId nvarchar(45) NULL DEFAULT NULL, 
	resultId int NULL DEFAULT NULL, 
	resultComment nvarchar(max) NULL, 
	actionId int NULL DEFAULT NULL, 
	actionComment nvarchar(max) NULL, 
	autoResult binary(1) NULL DEFAULT 0x0, 
	ts datetime2(0) NOT NULL DEFAULT getdate(), 
	userId int NULL DEFAULT NULL, 
	rejecttext nvarchar(max) NULL, 
	rejectUserId int NULL DEFAULT NULL, 
	statusId int NOT NULL, 
	CONSTRAINT [PK_review_reviewId] PRIMARY KEY (reviewId), 
	CONSTRAINT review$INDEX_ASSETID_RULEID UNIQUE (assetId, ruleId), 
	CONSTRAINT [review$FK_REVIEWS_1] FOREIGN KEY (assetId) REFERENCES asset (assetId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX INDEX_RESULTID
		ON [review] (resultId ASC);
CREATE 
	NONCLUSTERED INDEX INDEX_RULEID
		ON [review] (ruleId ASC);
CREATE 
	NONCLUSTERED INDEX INDEX_STATUSID
		ON [review] (statusId ASC);
CREATE TABLE [review_history]
(
	historyId int NOT NULL IDENTITY(10565, 1), 
	reviewId int NOT NULL, 
	resultId int NULL DEFAULT NULL, 
	resultComment nvarchar(max) NULL, 
	actionId int NULL DEFAULT NULL, 
	actionComment nvarchar(max) NULL, 
	autoResult binary(1) NULL DEFAULT NULL, 
	ts datetime2(0) NOT NULL, 
	userId int NULL DEFAULT NULL, 
	rejectText nvarchar(max) NULL, 
	rejectUserId int NULL DEFAULT NULL, 
	statusId int NOT NULL, 
	CONSTRAINT [PK_review_history_historyId] PRIMARY KEY (historyId), 
	CONSTRAINT [review_history$fk_review_history_1] FOREIGN KEY (reviewId) REFERENCES review (reviewId) 
		 ON DELETE CASCADE 
);
CREATE 
	NONCLUSTERED INDEX index_reviewId
		ON [review_history] (reviewId ASC);
CREATE TABLE [rule_cci_map]
(
	rcId int NOT NULL IDENTITY(102610, 1), 
	ruleId nvarchar(255) NOT NULL, 
	cci nvarchar(60) NOT NULL, 
	CONSTRAINT [PK_rule_cci_map_rcId] PRIMARY KEY (rcId), 
	CONSTRAINT rule_cci_map$rule_cci_unique UNIQUE (ruleId, cci), 
	CONSTRAINT [rule_cci_map$FK_rule_cci_map_1] FOREIGN KEY (ruleId) REFERENCES [rule] (ruleId) 
		 ON DELETE CASCADE
);
CREATE 
	NONCLUSTERED INDEX index_cci
		ON [rule_cci_map] (cci ASC);
CREATE TABLE [rule_oval_map]
(
	roId int NOT NULL IDENTITY(1281, 1), 
	ruleId nvarchar(255) NOT NULL, 
	ovalRef nvarchar(255) NOT NULL, 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	releaseInfo nvarchar(255) NOT NULL, 
	CONSTRAINT [PK_rule_oval_map_roId] PRIMARY KEY (roId)
);
CREATE 
	NONCLUSTERED INDEX index2
		ON [rule_oval_map] (ruleId ASC);
CREATE 
	NONCLUSTERED INDEX index3
		ON [rule_oval_map] (benchmarkId ASC);
CREATE TABLE [stats_asset_stig]
(
	id int NOT NULL IDENTITY(43452, 1), 
	assetId int NULL DEFAULT NULL, 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	minTs datetime2(0) NULL DEFAULT NULL, 
	maxTs datetime2(0) NULL DEFAULT NULL, 
	savedManual int NULL DEFAULT NULL, 
	savedAuto int NULL DEFAULT NULL, 
	submittedManual int NULL DEFAULT NULL, 
	submittedAuto int NULL DEFAULT NULL, 
	rejectedManual int NULL DEFAULT NULL, 
	rejectedAuto int NULL DEFAULT NULL, 
	acceptedManual int NULL DEFAULT NULL, 
	acceptedAuto int NULL DEFAULT NULL, 
	highCount int NULL DEFAULT NULL, 
	mediumCount int NULL DEFAULT NULL, 
	lowCount int NULL DEFAULT NULL, 
	CONSTRAINT [PK_stats_asset_stig_id] PRIMARY KEY (id), 
	CONSTRAINT stats_asset_stig$INDEX_2_2_C UNIQUE (assetId, benchmarkId), 
	CONSTRAINT [stats_asset_stig$FK_STATS_ASSET_STIG_1] FOREIGN KEY (assetId) REFERENCES asset (assetId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX FK_STATS_ASSET_STIG_2
		ON [stats_asset_stig] (benchmarkId ASC);
CREATE TABLE [status]
(
	statusId int NOT NULL, 
	api nvarchar(16) NOT NULL, 
	en nvarchar(16) NOT NULL, 
	CONSTRAINT [PK_status_statusId] PRIMARY KEY (statusId), 
	CONSTRAINT status$IDX_API UNIQUE (api)
);
CREATE TABLE [stig_asset_map]
(
	saId int NOT NULL IDENTITY(36831, 1), 
	benchmarkId nvarchar(255) NULL DEFAULT NULL, 
	assetId int NOT NULL, 
	userIds nvarchar(max) NULL DEFAULT NULL, 
	CONSTRAINT [PK_stig_asset_map_saId] PRIMARY KEY (saId), 
	CONSTRAINT stig_asset_map$IDX_BAID UNIQUE (benchmarkId, assetId), 
	CONSTRAINT [stig_asset_map$FK_STIG_ASSET_MAP_1] FOREIGN KEY (assetId) REFERENCES asset (assetId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE, 
	CONSTRAINT [stig_asset_map$FK_STIG_ASSET_MAP_2] FOREIGN KEY (benchmarkId) REFERENCES stig (benchmarkId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX IDX_ASSETID
		ON [stig_asset_map] (assetId ASC);
CREATE TABLE [user_stig_asset_map]
(
	id int NOT NULL IDENTITY(645, 1), 
	userId int NOT NULL, 
	saId int NOT NULL, 
	CONSTRAINT [PK_user_stig_asset_map_id] PRIMARY KEY (id), 
	CONSTRAINT [user_stig_asset_map$fk_user_stig_asset_map_1] FOREIGN KEY (saId) REFERENCES stig_asset_map (saId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE, 
	CONSTRAINT [user_stig_asset_map$fk_user_stig_asset_map_2] FOREIGN KEY (userId) REFERENCES user_data (userId) 
		 ON DELETE CASCADE 
		 ON UPDATE CASCADE
);
CREATE 
	NONCLUSTERED INDEX fk_user_stig_asset_map_2
		ON [user_stig_asset_map] (userId ASC);
CREATE 
	NONCLUSTERED INDEX fk_user_stig_asset_map_1
		ON [user_stig_asset_map] (saId ASC);