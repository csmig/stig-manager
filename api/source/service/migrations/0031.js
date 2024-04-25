const MigrationHandler = require('./lib/MigrationHandler')

const upMigration = [
    `ALTER TABLE stig_asset_map ADD COLUMN resultEngines JSON NULL`,
    // `ALTER TABLE stig_asset_map CHANGE COLUMN userIds resultEngines JSON NULL`,
    `UPDATE stig_asset_map SET resultEngines = NULL`,
    `with reReview as (
        select
            review.assetId,
            dr.benchmarkId,
            review.reProduct,
            json_unquote(json_extract(review.resultEngine,'$.version')) as reVersion
        from
           asset a
           left join stig_asset_map sa using (assetId)
           left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
           left join rev_group_rule_map rgr on dr.revId = rgr.revId
           left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
           left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
        where
          review.reProduct is not null
         ),
      reCount as (
        select
          assetId,
          benchmarkId,
          reProduct,
          reVersion,
          count(*) as resultCount
        from
          reReview
        group by
          assetId,
          benchmarkId,
          reProduct,
          reVersion),
      reJson as (
        select
          assetId,
          benchmarkId,
          json_arrayagg(json_object('product', reProduct, 'version', reVersion, 'resultCount', resultCount)) as resultEngines
        from
          reCount
        group by
          assetId,
          benchmarkId),
      source as
        ( select
           sa.assetId,
           sa.benchmarkId,
           reJson.resultEngines,
           min(review.ts) as minTs,
           max(review.ts) as maxTs,  
           max(review.touchTs) as maxTouchTs,  
           
           sum(CASE WHEN review.statusId = 0 THEN 1 ELSE 0 END) as saved,
           sum(CASE WHEN review.resultEngine is not null and review.statusId = 0 THEN 1 ELSE 0 END) as savedResultEngine,
           sum(CASE WHEN review.statusId = 1 THEN 1 ELSE 0 END) as submitted,
           sum(CASE WHEN review.resultEngine is not null and review.statusId = 1 THEN 1 ELSE 0 END) as submittedResultEngine,
           sum(CASE WHEN review.statusId = 2 THEN 1 ELSE 0 END) as rejected,
           sum(CASE WHEN review.resultEngine is not null and review.statusId = 2 THEN 1 ELSE 0 END) as rejectedResultEngine,
           sum(CASE WHEN review.statusId = 3 THEN 1 ELSE 0 END) as accepted,
           sum(CASE WHEN review.resultEngine is not null and review.statusId = 3 THEN 1 ELSE 0 END) as acceptedResultEngine,
    
           sum(CASE WHEN review.resultId=4 and rgr.severity='high' THEN 1 ELSE 0 END) as highCount,
           sum(CASE WHEN review.resultId=4 and rgr.severity='medium' THEN 1 ELSE 0 END) as mediumCount,
           sum(CASE WHEN review.resultId=4 and rgr.severity='low' THEN 1 ELSE 0 END) as lowCount,
           
           sum(CASE WHEN review.resultId = 1 THEN 1 ELSE 0 END) as notchecked,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 1 THEN 1 ELSE 0 END) as notcheckedResultEngine,
           sum(CASE WHEN review.resultId = 2 THEN 1 ELSE 0 END) as notapplicable,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 2 THEN 1 ELSE 0 END) as notapplicableResultEngine,
           sum(CASE WHEN review.resultId = 3 THEN 1 ELSE 0 END) as pass,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 3 THEN 1 ELSE 0 END) as passResultEngine,
           sum(CASE WHEN review.resultId = 4 THEN 1 ELSE 0 END) as fail,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 4 THEN 1 ELSE 0 END) as failResultEngine,
           sum(CASE WHEN review.resultId = 5 THEN 1 ELSE 0 END) as unknown,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 5 THEN 1 ELSE 0 END) as unknownResultEngine,
           sum(CASE WHEN review.resultId = 6 THEN 1 ELSE 0 END) as error,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 6 THEN 1 ELSE 0 END) as errorResultEngine,
           sum(CASE WHEN review.resultId = 7 THEN 1 ELSE 0 END) as notselected,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 7 THEN 1 ELSE 0 END) as notselectedResultEngine,            
           sum(CASE WHEN review.resultId = 8 THEN 1 ELSE 0 END) as informational,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 8 THEN 1 ELSE 0 END) as informationalResultEngine,
           sum(CASE WHEN review.resultId = 9 THEN 1 ELSE 0 END) as fixed,
           sum(CASE WHEN review.resultEngine is not null and review.resultId = 9 THEN 1 ELSE 0 END) as fixedResultEngine
           
           from
             asset a
             left join stig_asset_map sa using (assetId)
             left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
             left join rev_group_rule_map rgr on dr.revId = rgr.revId
             left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
             left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
             left join reJson on (sa.assetId = reJson.assetId and sa.benchmarkId = reJson.benchmarkId)
        group by
          sa.assetId,
          sa.benchmarkId,
          reJson.resultEngines
          )
      update stig_asset_map sam
        inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
        set sam.resultEngines = source.resultEngines,
            sam.minTs = source.minTs,
            sam.maxTs = source.maxTs,
            sam.maxTouchTs = source.maxTouchTs,
            sam.saved = source.saved,
            sam.savedResultEngine = source.savedResultEngine,
            sam.submitted = source.submitted,
            sam.submittedResultEngine = source.submittedResultEngine,
            sam.rejected = source.rejected,
            sam.rejectedResultEngine = source.rejectedResultEngine,
            sam.accepted = source.accepted,
            sam.acceptedResultEngine = source.acceptedResultEngine,
            sam.highCount = source.highCount,
            sam.mediumCount = source.mediumCount,
            sam.lowCount = source.lowCount,
            sam.notchecked = source.notchecked,
            sam.notcheckedResultEngine = source.notcheckedResultEngine,
            sam.notapplicable = source.notapplicable,
            sam.notapplicableResultEngine = source.notapplicableResultEngine,
            sam.pass = source.pass,
            sam.passResultEngine = source.passResultEngine,
            sam.fail = source.fail,
            sam.failResultEngine = source.failResultEngine,
            sam.unknown = source.unknown,
            sam.unknownResultEngine = source.unknownResultEngine,
            sam.error = source.error,
            sam.errorResultEngine = source.errorResultEngine,
            sam.notselected = source.notselected,
            sam.notselectedResultEngine = source.notselectedResultEngine,
            sam.informational = source.informational,
            sam.informationalResultEngine = source.informationalResultEngine,
            sam.fixed = source.fixed,
            sam.fixedResultEngine = source.fixedResultEngine  `

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

