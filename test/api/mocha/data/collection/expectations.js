//This data contains expected response data that varies by iteration "scenario" or "iteration" for each test case. These expectations are relative to the "referenceData.js" data used to construct the API requests. 
const reference = require('../../referenceData.js')

const distinct = {
  stigmanadmin: {
    iteration: "admin",
    acl: [],
    aclByGrantId: [],
    usersLength: 7,
    defaultAccess: "rw",
    accessLevel: 4,
    userId: "87",
    canElevate: true,
    canCreateCollection: true,
    canModifyOwnerGrants: true,
    collectionCount: 6,
    collectionIdsAccess: ["21", "83", "1", "84", "85", "92"],
    collectionCountElevated: 7,
    testAssetChecklists: 2,
    collectionMatch: {
      collectionExactMatchCnt: 1,
      collectionContainsMatchCnt: 3,
      collectionStartMatchCnt: 3,
      collectionEndMatchCnt: 1,
      collectionDeleteMatchCnt: 2,
      collectionDeleteMatchCntElevated: 3,
      collectionMetadataMatchCnt: 1,
    },
    //relative to testCollection
    grant: "lvl4",
    fullLabelUses: 2,
    lvl1LabelUses: 1,
    historyResponseStatus: 200,
    checklistCnt: 6,
    grantCnt: 7,
    assetIds: ["29", "62", "42", "154"],
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    testBenchmarkAssignedCount: 3,
    findings: {
      findingsCnt: 8,
      findingsByGroupCnt: 4,
      findingsByRuleCnt: 3,
      findingsByRuleForAssetCnt: 4,
      findingsByRuleForBenchmarkCnt: 3,
      findingsByCciCnt: 8,
    },
    canDeleteCollection: true,
    canModifyCollection: true,
    windowsStigAssetCount: 2,
    vpnStigAssetCount: 2,
  },
  lvl1: {
    iteration: "lvl1",
    aclByGrantId:[
      {
        label: {
          name: "test-label-lvl1",
          color: "99CCFF",
          labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
        },
        access: "rw",
        benchmarkId: "VPN_SRG_TEST",
      },
      {
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        access: "r",
      },
      {
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        access: "r",
        benchmarkId: "VPN_SRG_TEST",
      },
    ],
    acl: [
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
              access: "r",
            },
            grantee: {
              name: "TestGroup",
              accessLevel: 1,
              userGroupId: 1,
            },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_asset",
          assetId: "62",
        },
        benchmarkId: "Windows_10_STIG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62",
              },
              access: "r",
            },
            grantee: {
              name: "TestGroup",
              accessLevel: 1,
              userGroupId: 1,
            },
          },
        ],
      },
      {
        access: "rw",
        asset: {
          name: "Collection_X_lvl1_asset-1",
          assetId: "42",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              label: {
                name: "test-label-lvl1",
                labelId: "5130dc84-9a68-11ec-b1bc-0242ac110002",
              },
              access: "rw",
              benchmarkId: "VPN_SRG_TEST",
            },
            grantee: {
              name: "TestGroup",
              accessLevel: 1,
              userGroupId: 1,
            },
          },
        ],
      },
      {
        access: "r",
        asset: {
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: "VPN_SRG_TEST",
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
              },
              access: "r",
              benchmarkId: "VPN_SRG_TEST",
            },
            grantee: {
              name: "TestGroup",
              accessLevel: 1,
              userGroupId: 1,
            },
          },
        ],
      },
    ],
    usersLength: 3,
    defaultAccess: "none",
    userId: "85",
    accessLevel: 1,
    canElevate: false,
    canCreateCollection: false,
    canModifyOwnerGrants: false,
    collectionCount: 1,
    collectionIdsAccess: ["21"],
    testAssetChecklists: 1,
    collectionMatch: {
      collectionExactMatchCnt: 1,
      collectionContainsMatchCnt: 1,
      collectionStartMatchCnt: 1,
      collectionEndMatchCnt: 1,
      collectionMetadataMatchCnt: 1,
      collectionDeleteMatchCnt: 0,
    },
    //relative to testCollection
    grant: "restricted",
    fullLabelUses: 2,
    lvl1LabelUses: 1,
    historyResponseStatus: 403,
    checklistCnt: 3,
    grantCnt: 1,
    assetIds: ["42", "154", "62"],
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    testBenchmarkAssignedCount: 3,
    findings: {
      findingsCnt: 7,
      findingsByGroupCnt: 3,
      findingsByRuleCnt: 3,
      findingsByRuleForAssetCnt: 3,
      findingsByRuleForBenchmarkCnt: 3,
      findingsByCciCnt: 7,
    },
    canDeleteCollection: false,
    canModifyCollection: false,
    windowsStigAssetCount: 1,
    vpnStigAssetCount: 2,
  },
  lvl2: {
    iteration: "lvl2",
    userId: "87",
    acl: [],
    aclByGrantId: [],
    usersLength: 7,
    defaultAccess: "rw",
    accessLevel: 2,
    canElevate: false,
    canCreateCollection: false,
    collectionCount: 2,
    canModifyOwnerGrants: false,
    collectionIdsAccess: ["21", "1"],
    testAssetChecklists: 2,
    collectionMatch: {
      collectionExactMatchCnt: 1,
      collectionContainsMatchCnt: 1,
      collectionStartMatchCnt: 2,
      collectionEndMatchCnt: 1,
      collectionMetadataMatchCnt: 1,
      collectionDeleteMatchCnt: 0,
    },
    //relative to testCollection
    grant: "full",
    fullLabelUses: 2,
    lvl1LabelUses: 1,
    historyResponseStatus: 200,
    checklistCnt: 6,
    grantCnt: 7,
    assetIds: ["29", "62", "42", "154"],
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    testBenchmarkAssignedCount: 3,
    findings: {
      findingsCnt: 8,
      findingsByGroupCnt: 4,
      findingsByRuleCnt: 3,
      findingsByRuleForAssetCnt: 4,
      findingsByRuleForBenchmarkCnt: 3,
      findingsByCciCnt: 8,
    },
    canDeleteCollection: false,
    canModifyCollection: false,
    windowsStigAssetCount: 2,
    vpnStigAssetCount: 2,
  },
  lvl3: {
    iteration: "lvl3",
    acl: [],
    aclByGrantId: [],
    usersLength: 7,
    defaultAccess: "rw",
    userId: "87",
    accessLevel: 3,
    canElevate: false,
    collectionCount: 2,
    collectionIdsAccess: ["21", "1"],
    canCreateCollection: false,
    canModifyOwnerGrants: false,
    testAssetChecklists: 2,
    collectionMatch: {
      collectionExactMatchCnt: 1,
      collectionContainsMatchCnt: 1,
      collectionStartMatchCnt: 2,
      collectionEndMatchCnt: 1,
      collectionMetadataMatchCnt: 1,
      collectionDeleteMatchCnt: 0,
    },
    //relative to testCollection
    grant: "manage",
    fullLabelUses: 2,
    lvl1LabelUses: 1,
    historyResponseStatus: 200,
    checklistCnt: 6,
    grantCnt: 7,
    assetIds: ["29", "62", "42", "154"],
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    testBenchmarkAssignedCount: 3,
    findings: {
      findingsCnt: 8,
      findingsByGroupCnt: 4,
      findingsByRuleCnt: 3,
      findingsByRuleForAssetCnt: 4,
      findingsByRuleForBenchmarkCnt: 3,
      findingsByCciCnt: 8,
    },
    canDeleteCollection: false,
    canModifyCollection: true,
    windowsStigAssetCount: 2,
    vpnStigAssetCount: 2,
  },
  lvl4: {
    iteration: "lvl4",
    acl: [],
    aclByGrantId: [],
    usersLength: 7,
    defaultAccess: "rw",
    userId: "87",
    accessLevel: 4,
    canCreateCollection: false,
    canModifyOwnerGrants: true,
    canElevate: false,
    collectionCount: 3,
    collectionIdsAccess: ["21", "1", "85"],
    testAssetChecklists: 2,
    collectionMatch: {
      collectionExactMatchCnt: 1,
      collectionContainsMatchCnt: 1,
      collectionStartMatchCnt: 2,
      collectionEndMatchCnt: 1,
      collectionMetadataMatchCnt: 1,
      collectionDeleteMatchCnt: 1,
    },
    //relative to testCollection
    grant: "owner",
    fullLabelUses: 2,
    lvl1LabelUses: 1,
    historyResponseStatus: 200,
    checklistCnt: 6,
    grantCnt: 7,
    assetIds: ["29", "62", "42", "154"],
    validStigs: ["VPN_SRG_TEST", "Windows_10_STIG_TEST"],
    testBenchmarkAssignedCount: 3,
    findings: {
      findingsCnt: 8,
      findingsByGroupCnt: 4,
      findingsByRuleCnt: 3,
      findingsByRuleForAssetCnt: 4,
      findingsByRuleForBenchmarkCnt: 3,
      findingsByCciCnt: 8,
    },
    canDeleteCollection: true,
    canModifyCollection: true,
    windowsStigAssetCount: 2,
    vpnStigAssetCount: 2,
  },
  collectioncreator: {
    iteration: "collectioncreator",
    userId: "82",
    accessLevel: -1,
    canElevate: false,
    canCreateCollection: true,
    canModifyOwnerGrants: false,
    collectionCount: 0,
    collectionIdsAccess: [],
    testAssetChecklists: 0,
    collectionMatch: {
      collectionExactMatchCnt: 0,
      collectionContainsMatchCnt: 0,
      collectionStartMatchCnt: 0,
      collectionEndMatchCnt: 0,
      collectionMetadataMatchCnt: 0,
      collectionDeleteMatchCnt: 0,
    },
    //relative to testCollection
    grant: "none",
    fullLabelUses: 0,
    lvl1LabelUses: 0,
    historyResponseStatus: 403,
    checklistCnt: 0,
    grantCnt: 0,
    assetIds: [],
    validStigs: [],
    testBenchmarkAssignedCount: 0,
    findings: {
      findingsCnt: 0,
      findingsByGroupCnt: 0,
      findingsByRuleCnt: 0,
      findingsByRuleForAssetCnt: 0,
      findingsByRuleForBenchmarkCnt: 0,
      findingsByCciCnt: 0,
    },
    canDeleteCollection: false,
    canModifyCollection: false,
  },
};
module.exports = distinct;