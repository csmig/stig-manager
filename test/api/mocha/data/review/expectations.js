//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests.

const distinct = {
    stigmanadmin: {
      canPatchReview: true,
      testAsset: {
        reviewsAvailableToUser: 9,
        reviewsForResultPass: 4,
        reviewsForResultFail: 4,
        reviewsForStatusSaved: 2,
        reviewsForStatusSubmitted: 7
      },
      testCollection: {
        reviewsForTestBenchmark: 14,
        reviewsForResultFail: 8,
        reviewsForResultFailAllAssets: 8,
        reviewsForTestRuleId: 3,
        reviewsForStatusSaved: 6,
        reviewsForStigmanadmin: 14,
        reviewsForResultPass: 4,
        reviewsForTestGroup: 3,
        reviewsForRulesAll: 17,
        reviewsDefaultMapped: 0
      },
      postReviews:{
        targetAssetsWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetAssetsOneRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetAssetsAndRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetStigWholeStigInsert:{
          inserted: 1,
          updated: 0,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStigMerge:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetRulesDefinedByStig:{
          inserted:241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 6
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 3,
          validationErrors: 3,
          reviewsLength: 2
        },
        
      },
      accessLevel:4
    },
    lvl1: {
      canPatchReview: false,
      testAssetStats: {
        ruleCount: 81,
        stigCount: 1,
        savedCount: 1,
        acceptedCount: 0,
        rejectedCount: 0,
        submittedCount: 5
      },
      postReviews:{
        targetAssetsWholeStig:{
          inserted: 160,
          updated: 2,
          failedValidation: 81,
          validationErrors: 50,
          reviewsLength: 162
        },
        targetAssetsOneRule:{
          inserted: 0,
          updated: 2,
          failedValidation: 1,
          validationErrors: 1,
          reviewsLength: 2
        },
        targetAssetsAndRule:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetStigWholeStig:{
          inserted: 160,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 162
        },
        targetStigWholeStigInsert:{
          inserted: 0,
          updated: 0,
          failedValidation: 1,
          validationErrors: 1,
          reviewsLength: 2
        },
        targetStigWholeStigMerge:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetRulesDefinedByStig:{
          inserted:160,
          updated: 2,
          failedValidation: 81,
          validationErrors: 50,
          reviewsLength: 6
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 2,
          validationErrors: 2,
          reviewsLength: 2
        },
      },
      testAsset: {
        reviewsAvailableToUser: 6,
        reviewsForResultPass: 2,
        reviewsForResultFail: 3,
        reviewsForStatusSaved: 1,
        reviewsForStatusSubmitted: 5
      },
      testCollection: {
        reviewsForTestBenchmark: 14,
        reviewsForResultFail: 6,
        reviewsForTestRuleId: 3,
        reviewsForResultFailAllAssets: 7,
        reviewsForStatusSaved: 5,
        reviewsForStigmanadmin: 11,
        reviewsForResultPass: 2,
        reviewsForTestGroup: 3,
        reviewsForRulesAll: 14,
        reviewsDefaultMapped: 0
      },
      accessLevel:1
    },
    lvl2: {
      canPatchReview: true,
      testAssetStats: {
        ruleCount: 368,
        stigCount: 2,
        savedCount: 2,
        acceptedCount: 0,
        rejectedCount: 0,
        submittedCount: 7
      },
      testAsset: {
        reviewsAvailableToUser: 9,
        reviewsForResultPass: 4,
        reviewsForResultFail: 4,
        reviewsForStatusSaved: 2,
        reviewsForStatusSubmitted: 7
        
      },
       postReviews:{
        targetAssetsWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetAssetsOneRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetAssetsAndRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetStigWholeStigInsert:{
          inserted: 1,
          updated: 0,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStigMerge:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetRulesDefinedByStig:{
          inserted:241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 6
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 3,
          validationErrors: 3,
          reviewsLength: 2
        },
      },
      testCollection: {
        reviewsForTestBenchmark: 14,
        reviewsForResultFail: 8,
        reviewsForResultFailAllAssets: 8,
        reviewsForTestRuleId: 3,
        reviewsForStatusSaved: 6,
        reviewsForStigmanadmin: 14,
        reviewsForResultPass: 4,
        reviewsForTestGroup: 3,
        reviewsForRulesAll: 17,
        reviewsDefaultMapped: 0
      },
      accessLevel:2
    },
    lvl3: {
      canPatchReview: true,
      testAssetStats: {
        ruleCount: 368,
        stigCount: 2,
        savedCount: 2,
        acceptedCount: 0,
        rejectedCount: 0,
        submittedCount: 7
      },
      testAsset: {
        reviewsAvailableToUser: 9,
        reviewsForResultPass: 4,
        reviewsForResultFail: 4,
        reviewsForStatusSaved: 2,
        reviewsForStatusSubmitted: 7
      },
      testCollection: {
        reviewsForTestBenchmark: 14,
        reviewsForResultFailAllAssets: 8,
        reviewsForTestRuleId: 3,
        reviewsForStatusSaved: 6,
        reviewsForStigmanadmin: 14,
        reviewsForResultPass: 4,
        reviewsForTestGroup: 3,
        reviewsForRulesAll: 17,
        reviewsDefaultMapped: 0
      },
      postReviews:{
        targetAssetsWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetAssetsOneRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetAssetsAndRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetStigWholeStigInsert:{
          inserted: 1,
          updated: 0,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStigMerge:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetRulesDefinedByStig:{
          inserted:241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 6
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 3,
          validationErrors: 3,
          reviewsLength: 2
        },
      },
      accessLevel:3
    },
    lvl4: {
      canPatchReview: true,
      testAssetStats: {
        ruleCount: 368,
        stigCount: 2,
        savedCount: 2,
        acceptedCount: 0,
        rejectedCount: 0,
        submittedCount: 7
      },
      testAsset: {
        reviewsAvailableToUser: 9,
        reviewsForResultPass: 4,
        reviewsForResultFail: 4,
        reviewsForStatusSaved: 2,
        reviewsForStatusSubmitted: 7
      },
      testCollection: {
        reviewsForTestBenchmark: 14,
        reviewsForResultFail: 8,
        reviewsForResultFailAllAssets: 8,
        reviewsForTestRuleId: 3,
        reviewsForStatusSaved: 6,
        reviewsForStigmanadmin: 14,
        reviewsForTestGroup: 3,
        reviewsForRulesAll: 17,
        reviewsDefaultMapped: 0
      
      },
      postReviews:{
        targetAssetsWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetAssetsOneRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetAssetsAndRule:{
          inserted: 1,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStig:{
          inserted: 241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 243
        },
        targetStigWholeStigInsert:{
          inserted: 1,
          updated: 0,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 3
        },
        targetStigWholeStigMerge:{
          inserted: 0,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 2
        },
        targetRulesDefinedByStig:{
          inserted:241,
          updated: 2,
          failedValidation: 0,
          validationErrors: 0,
          reviewsLength: 6
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 3,
          validationErrors: 3,
          reviewsLength: 2
        },
        targetByStigOneRuleValidationFailure:{
          inserted: 0,
          updated: 0,
          failedValidation: 3,
          validationErrors: 3,
          reviewsLength: 2
        },
      },
      accessLevel:4
    }
}
  module.exports = distinct
  