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
    source as (
      select
          sa.assetId,
          sa.benchmarkId,
          any_value(reJson.resultEngines) as resultEngines      
        from
          asset a
          left join stig_asset_map sa using (assetId)
          left join default_rev dr on (sa.benchmarkId = dr.benchmarkId and a.collectionId = dr.collectionId)
          left join rev_group_rule_map rgr on dr.revId = rgr.revId
          left join rule_version_check_digest rvcd on rgr.ruleId = rvcd.ruleId
          left join review on (rvcd.version=review.version and rvcd.checkDigest=review.checkDigest and review.assetId=sa.assetId)
          inner join reJson on (sa.assetId = reJson.assetId and sa.benchmarkId = reJson.benchmarkId)
      group by
        sa.assetId,
        sa.benchmarkId
        )
    update
      stig_asset_map sam
      inner join source on sam.assetId = source.assetId and source.benchmarkId = sam.benchmarkId
    set
      sam.resultEngines = source.resultEngines`
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

