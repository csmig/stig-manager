
const distinct = {
  stigmanadmin: {
    iteration: "admin",
    acl: [],
    defaultAccess: "rw",
    accessLevel: 4,
    userId: "87",
    userGroupIds: [],
    collectionGrants: ["21", "83", "1", "84", "85", "92"],
    privileges: {
      canAdmin: true,
      canCreateCollection: true,
    }
  },
  lvl1: {
    iteration: "lvl1",
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
    defaultAccess: "none",
    userId: "85",
    accessLevel: 1,
    userGroupIds: ["1"],
    collectionGrants: ["21"],
    privileges: {
      canAdmin: false,
      canCreateCollection: false,
    }
   
  },
  lvl2: {
    iteration: "lvl2",
    userId: "87",
    acl: [],
    defaultAccess: "rw",
    accessLevel: 2,
    userGroupIds: [],
    collectionGrants: ["21","1"],
    privileges: {
      canAdmin: false,
      canCreateCollection: false,
    }
   
  },
  lvl3: {
    iteration: "lvl3",
    acl: [],
    defaultAccess: "rw",
    userId: "87",
    accessLevel: 3,
    userGroupIds: [],
    collectionGrants: ["21", "1"],
    privileges: {
      canAdmin: false,
      canCreateCollection: false,
    }
   
  },
  lvl4: {
    iteration: "lvl4",
    acl: [],
    defaultAccess: "rw",
    userId: "87",
    accessLevel: 4,
    userGroupIds: [],
    collectionGrants: ["21", "1", "85"],
    privileges: {
      canAdmin: false,
      canCreateCollection: false,
    }
   
  },
  collectioncreator: {
    iteration: "collectioncreator",
    userId: "82",
    userGroupIds: [],
    collectionGrants: [],
    privileges: {
      canAdmin: false,
      canCreateCollection: true,
    }
  },
};
module.exports = distinct;