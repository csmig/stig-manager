
// 42 = "Collection_X_lvl1_asset-1"
// 29 = ACHERNAR_Collection_X_asset
// 62 = Collection_X_asset
// 154 = Collection_X_lvl1_asset-2
// full label = 755

//https://www.geeksforgeeks.org/pairwise-software-testing/

//create acl resolves to nothing, then create it with data 

const reference = require('../../referenceData.js')

const requestBodies = {
    // none: [],
    // all: [],
   
      // labelBenchmark_rw_assetBenchmark_r: {
      //   put: [{"benchmarkId": reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId": reference.testAsset.assetId,"access":"r"}],
      //   response: [
      //     {
      //       access: "rw",
      //       asset: {
      //         name: "Collection_X_asset",
      //         assetId: "62",
      //       },
      //       benchmarkId: reference.testCollection.benchmark,
      //       aclSources: [
      //         {
      //           aclRule: {
      //             label: {
      //               name: reference.testCollection.fullLabelName,
      //               labelId: reference.testCollection.fullLabel,
      //             },
      //             access: "rw",
      //             benchmarkId: reference.testCollection.benchmark,
      //           },
      //           grantee: {
      //             userId: 85,
      //             username: "lvl1",
      //             accessLevel: 1,
      //           },
      //         },
      //       ],
      //     },
      //     {
      //       access: "r",
      //       asset: {
      //         name: "Collection_X_lvl1_asset-1",
      //         assetId: reference.testAsset.assetId,
      //       },
      //       benchmarkId: reference.testCollection.benchmark,
      //       aclSources: [
      //         {
      //           aclRule: {
      //             asset: {
      //               name: "Collection_X_lvl1_asset-1",
      //               assetId: reference.testAsset.assetId,
      //             },
      //             access: "r",
      //             benchmarkId: reference.testCollection.benchmark,
      //           },
      //           grantee: {
      //             userId: 85,
      //             username: "lvl1",
      //             accessLevel: 1,
      //           },
      //         },
      //       ],
      //     },
      //   ]
      //   // assigns all assets in full label and VPN stig to RW, asset 42 with VPN stig is R
      // }, 
      label_rw: {
       put: [{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
       response: [
        {
          access: "rw",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.benchmark,
          aclSources: [
            {
              aclRule: {
                label: {
                  name: reference.testCollection.fullLabelName,
                  labelId: reference.testCollection.fullLabel,
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                label: {
                  name: reference.testCollection.fullLabelName,
                  labelId: reference.testCollection.fullLabel,
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                label: {
                  name: reference.testCollection.fullLabelName,
                  labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_asset",
            assetId: "62",
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                label: {
                  name: reference.testCollection.fullLabelName,
                  labelId: reference.testCollection.fullLabel,
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
         
       ]
       // all assets (4) will be RW on both windows and VPN bnechmark
      },
      label_r: {
        put: [{"labelId":reference.testCollection.fullLabel,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
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
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: "755b8a28-9a68-11ec-b1bc-0242ac110002",
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
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
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
        ]
        // all assets (4) will be R on both windows and VPN bnechmark
      },
      label_none: {
        put:[{"labelId":reference.testCollection.fullLabel,"access":"none"}],
        response: []
        // no assets
      },
      benchmark_rw: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}],
        response: [
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "rw",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "rw",
            asset: {
              name: "Collection_X_asset",
              assetId: "62",
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "rw",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "rw",
            asset: {
              name: "Collection_X_lvl1_asset-2",
              assetId: "154",
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "rw",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      benchmark_r: {
        put:[{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
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
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
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
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  benchmarkId: reference.testCollection.benchmark,
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      benchmark_none: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"}],
        response: []
      },
    
      asset_rw: {
        put: [{"assetId":reference.testAsset.assetId,"access":"rw"}],
        response: [
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "rw",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "rw",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      asset_r: {
        put: [{"assetId":reference.testAsset.assetId,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.windowsBenchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "r",
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      asset_none: {
        put: [{"assetId":reference.testAsset.assetId,"access":"none"}],
        response: []
      },
      
      assetBenchmark_rw: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"}],
        response: [
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "rw",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      assetBenchmark_r: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  asset: {
                    name: reference.testAsset.name,
                    assetId: reference.testAsset.assetId,
                  },
                  access: "r",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      assetBenchmark_none: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}],
        response: []
      },
  
      labelBenchmark_rw: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"}],
        response: [
          {
            access: "rw",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "rw",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          },
          {
            access: "rw",
            asset: {
              name: "Collection_X_asset",
              assetId: "62",
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "rw",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      labelBenchmark_r: {
        put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}],
        response: [
          {
            access: "r",
            asset: {
              name: reference.testAsset.name,
              assetId: reference.testAsset.assetId,
            },
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
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
            benchmarkId: reference.testCollection.benchmark,
            aclSources: [
              {
                aclRule: {
                  label: {
                    name: reference.testCollection.fullLabelName,
                    labelId: reference.testCollection.fullLabel,
                  },
                  access: "r",
                  benchmarkId: reference.testCollection.benchmark,
                },
                grantee: {
                  userId: 85,
                  username: "lvl1",
                  accessLevel: 1,
                },
              },
            ],
          }
        ]
      },
      labelBenchmark_none: {
         put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"}],
         response: []
      },

   
      //double asset +/- asset
      asset_rw_asset_rw: {
        put:[{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"rw"}],
        response: [
        {
          access: "rw",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: reference.testAsset.name,
            assetId: reference.testAsset.assetId,
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: reference.testAsset.name,
                  assetId: reference.testAsset.assetId,
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.windowsBenchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        },
        {
          access: "rw",
          asset: {
            name: "Collection_X_lvl1_asset-2",
            assetId: "154",
          },
          benchmarkId: reference.testCollection.benchmark,
          aclSources: [
            {
              aclRule: {
                asset: {
                  name: "Collection_X_lvl1_asset-2",
                  assetId: "154",
                },
                access: "rw",
              },
              grantee: {
                userId: 85,
                username: "lvl1",
                accessLevel: 1,
              },
            },
          ],
        }
      ]
      },


      asset_rw_asset_r: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"r"}],
      asset_rw_asset_none: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"none"}],
      asset_r_asset_rw: [{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"154","access":"rw"}],
      asset_r_asset_r: [{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"154","access":"r"}],
      asset_r_asset_none: [{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"154","access":"none"}],
      asset_none_asset_rw: [{"assetId":reference.testAsset.assetId,"access":"none"},{"assetId":"154","access":"rw"}],
      asset_none_asset_r: [{"assetId":reference.testAsset.assetId,"access":"none"},{"assetId":"154","access":"r"}],
      
      // double assetBenchmark +/- label
      assetBenchmark_rw_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
      assetBenchmark_rw_label_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
    //  assetBenchmark_rw_label_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"none"}],
      assetBenchmark_r_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
      assetBenchmark_r_label_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
      //assetBenchmark_r_label_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"none"}],
      assetBenchmark_none_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
      assetBenchmark_none_label_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],

      // double assetBenchmark +/- benchmark
      assetBenchmark_rw_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
      assetBenchmark_rw_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    //  assetBenchmark_rw_benchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
      assetBenchmark_r_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
      assetBenchmark_r_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    //  assetBenchmark_r_benchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
      assetBenchmark_none_benchmark_rw: [{"benchmarkId":reference.windowsBenchmark,"assetId":"62","access":"none"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
      assetBenchmark_none_benchmark_r: [{"benchmarkId":reference.windowsBenchmark,"assetId":"62","access":"none"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],

      // double assetBenchmark +/- asset
      assetBenchmark_rw_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
      assetBenchmark_rw_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}],
      //assetBenchmark_rw_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      assetBenchmark_r_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
      assetBenchmark_r_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"}],
      //assetBenchmark_r_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      assetBenchmark_none_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"rw"}],
      assetBenchmark_none_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"r"}],
   //   assetBenchmark_none_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"none"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      

   // leaggvin goff here 
      // double assetBenchmark +/- assetBenchmark 
      assetBenchmark_rw_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
      assetBenchmark_rw_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
      //assetBenchmark_rw_benchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
      assetBenchmark_r_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
      assetBenchmark_r_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
      //assetBenchmark_r_benchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}],
      assetBenchmark_none_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}],
      assetBenchmark_none_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],

      // double label +/- benchmark
      // dont think the data will allow this one to happen
      //equally specific 
      label_rw_benchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], // additive but the bnechmark dopesnt do anything
      label_rw_benchmark_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}], /// all vpns are r 
      label_rw_benchmark_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"none"}], // removes the benchmark
      label_r_benchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], // all vpns are rw others are r which is what i 
      //thoght but its really only taking the rs in label and adding trhe last asset not i the label to rw must have been a tie, which causes lowest access of r
      label_r_benchmark_r: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}], // all r
      //label_r_benchmark_none: [],
      label_none_benchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], // only get asset not in that label with VPN

      // double label +/- asset
      label_rw_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"154","access":"rw"}],
      label_rw_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"154","access":"r"}],
      label_rw_asset_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      label_r_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"rw"}],
      label_r_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":"154","access":"r"}],
      label_r_asset_none: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"none"}],
      label_none_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":"154","access":"rw"}],// tie so go with none and get nothing 

      // double label +/- label 
      label_rw_label_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"}],
      label_rw_label_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"}],
      label_rw_label_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"none"}],
      label_r_label_rw: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"}],
      label_r_label_r: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"}],
      label_r_label_none: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"none"}],
      label_none_label_rw: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"}],
      label_none_label_r: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"}],

      // double benchmark +/- asset
      // could use better data but not really too neccessary
      // when quierying the effective endpoint I do not see asset 29 in the response this is wrong? 
      benchmark_rw_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":"29","access":"rw"}], //adds 
      benchmark_rw_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}], // colisison resolves to read only
      benchmark_rw_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset
      benchmark_r_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":"29","access":"rw"}], // adds
      benchmark_r_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"}], // tie, does nothing.
      benchmark_r_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset (redundant)
      benchmark_none_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"},{"assetId":"29","access":"rw"}], // no overlap here, means nothing ? 
      benchmark_none_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"r"}], // removes a benchmark from asset

      // double benchmark +/- benchmark
      benchmark_rw_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}], // asset stig for both 
      benchmark_rw_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}], //redundant skip this one 
  
      // labelBenchmark +/- label
      labelBenchmark_rw_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}], // doesnt do anything, tie at asset 42 but same access so it doesnt matter
      labelBenchmark_rw_label_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], // collsion at 42 rw wins 
      //labelBenchmark_rw_label_none: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"none"}], only 
      labelBenchmark_r_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}], // test stigs are r 
      labelBenchmark_r_label_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], // does nothing
      labelBenchmark_r_label_none: [],
      labelBenchmark_none_label_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}], // removes the VPN for asset 42
      labelBenchmark_none_label_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}], // removes the VPN stigs

      // labelBenchmark +/- benchmark
      labelBenchmark_rw_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}], // adds benchmark + labelBenchmark 
      labelBenchmark_rw_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}], // collsion on the asset not in the label, resolve to read 
      labelBenchmark_rw_benchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"none"}], // gives just the two assets in the labels as rw like the bnechmark doenst apply
      labelBenchmark_r_benchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}], //combines label with benchmark all r
      //labelBenchmark_r_benchmark_none: [], // redundant?
      labelBenchmark_none_benchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], //benchmark minus those in label
      labelBenchmark_none_benchmark_r: [{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}], // jst the benchamrk kinda redundant

      // labelBenchmark +/- asset
      labelBenchmark_rw_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":"154","access":"rw"}], // adds asset to label
      labelBenchmark_rw_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}], // changes just the asset to r
      labelBenchmark_rw_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset from label
      labelBenchmark_r_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"rw"}], // asset is only one rw
      //labelBenchmark_r_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"}], // asset is only one r
      //labelBenchmark_r_asset_none: [],
      labelBenchmark_none_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"rw"}], // will only get windows stig rw on that asset 
      labelBenchmark_none_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":"154","access":"r"}], // asset outside of label kinda dumb test

      // labelBenchmark +/- assetBenchmark
      labelBenchmark_rw_assetBenchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":"154","access":"none"}], // adds asset
      labelBenchmark_rw_assetBenchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"}], // changes asset to r
      labelBenchmark_rw_assetBenchmark_none: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset should onyl see one asset rw
      labelBenchmark_r_assetBenchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"}], // asset is only one rw
      //labelBenchmark_r_assetBenchmark_r: [],
      //labelBenchmark_r_assetBenchmark_none: [],
      labelBenchmark_none_assetBenchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"}], // only asset 154 rw
      labelBenchmark_none_assetBenchmark_r: [{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"r"}], // only asset 154 r

      // labelBenchmark +/- labelBenchmark
      labelBenchmark_rw_labelBenchmark_rw: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"}], // adds two labels
      labelBenchmark_rw_labelBenchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}], // all windows are r
      //labelBenchmark_rw_labelBenchmark_none: [],
      //labelBenchmark_r_labelBenchmark_rw: [],
      labelBenchmark_r_labelBenchmark_r: [{"benchmarkId":reference.testCollection.benchmark,"labelId":"5130dc84-9a68-11ec-b1bc-0242ac110002","access":"r"},{"benchmarkId":reference.windowsBenchmark,"labelId":reference.testCollection.fullLabel,"access":"r"}], // all are r
      //labelBenchmark_r_labelBenchmark_none: [],
      //labelBenchmark_none_labelBenchmark_rw: [],
      //labelBenchmark_none_labelBenchmark_r: [],
    

//     triple: {
//       // triple label benchmark asset
//        // label_rw_benchmark_rw_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"}], // lots over overlap all rw tho
//         label_rw_benchmark_rw_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}], // asset is r and its 2 stigs
//         label_rw_benchmark_rw_asset_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset
//         label_rw_benchmark_r_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"rw"}], // all vpn are r because enchmark must tie asset and go with lwest?
//         label_rw_benchmark_r_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"}], // all are r besides 42 and windows 10 stig because if all the ties and we take lowest thats the only one that doesnt aaply 
//         label_rw_benchmark_r_asset_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"none"}], // removes asset, windows are rw and vpn are r
//         label_r_benchmark_rw_asset_rw: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"}], // dontundestand this one 
//         label_r_benchmark_rw_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}], // all are r in the label the asset not in the label has rw on vpn
//         label_none_benchmark_rw_asset_r: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"benchmarkId":reference.testCollection.benchmark,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"r"}], // only have asset 154 from the benchmark we all tied and went with lowest none
       
//         // assetBenchmark +/- label +/- benchmarkId
//         assetBenchmark_rw_label_rw_benchmark_rw: [],
//         assetBenchmark_rw_label_r_benchmark_none: [],
//         assetBenchmark_rw_label_none_benchmark_r: [],
//         assetBenchmark_r_label_none_benchmark_rw: [],
//         assetBenchmark_r_label_rw_benchmark_r: [],
//         assetBenchmark_r_label_rw_benchmark_rw: [],
//         assetBenchmark_none_label_r_benchmark_rw: [],
//         assetBenchmark_none_label_rw_benchmark_none: [],
//         assetBenchmark_none_label_r_benchmark_r: [],

//         // label asset labelBenchmark 
//         label_rw_asset_rw_labelBenchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], // all are rw 
//         label_rw_asset_rw_labelBenchmark_r: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.windowsBenchmark,"access":"r"}], // windows are r 
//         label_rw_asset_rw_labelBenchmark_none: [{"labelId":reference.testCollection.fullLabel,"access":"rw"},{"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.windowsBenchmark,"access":"none"}], // only vpn rw
//         label_r_asset_r_labelBenchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.testCollection.benchmark,"access":"rw"}], // windows are r and vpns rw
//         label_none_asset_r_labelBenchmark_none: [{"labelId":reference.testCollection.fullLabel,"access":"r"},{"assetId":reference.testAsset.assetId,"access":"r"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.testCollection.benchmark,"access":"none"}], // nmothing? 
//         label_none_asset_r_labelBenchmark_rw: [{"labelId":reference.testCollection.fullLabel,"access":"none"},{"assetId":reference.testAsset.assetId,"access":"r"},{"labelId":reference.testCollection.fullLabel,"benchmarkId":reference.testCollection.benchmark,"access":"rw"}],

        
//         //assetBenchmark +/- label +/- asset
//         assetBenchmark_rw_label_rw_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}, {"assetId":"62","access":"rw"}],
//         assetBenchmark_rw_label_r_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}, {"assetId":"62","access":"none"}],// should only see test asset with 2 benmchmarks 
//         assetBenchmark_rw_label_none_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"none"}, {"assetId":reference.testAsset.assetId,"access":"r"}], // asset benchmark wins only see that
//         assetBenchmark_r_label_none_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"none"}, {"assetId":"62","access":"rw"}], // this done doesnt make sense 
//         assetBenchmark_r_label_rw_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}, {"assetId":reference.testAsset.assetId,"access":"r"}],// wr on 42 windows cuz of label, r on the others 
//         assetBenchmark_none_label_r_asset_rw: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}, {"assetId":"154","access":"rw"}], // cant see vpn on 42, can see windows and vpn on 42 and 62, 154 is normal as is rw
//         assetBenchmark_none_label_rw_asset_none: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}, {"assetId":"62","access":"none"}], // only see winbdows on 42
//         assetBenchmark_none_label_r_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}, {"assetId":reference.testAsset.assetId,"access":"r"}], 

//         //assetBenchmark +/- benchmark +/- asset
//         assetBenchmark_rw_benchmark_rw_asset_rw: [],
//         assetBenchmark_rw_benchmark_r_asset_none: [],
//         assetBenchmark_rw_benchmark_none_asset_r: [],
//         assetBenchmark_r_benchmark_none_asset_rw: [],
//         assetBenchmark_r_benchmark_rw_asset_r: [],
//         assetBenchmark_r_benchmark_rw_asset_rw: [],
//         assetBenchmark_none_benchmark_r_asset_rw: [],
//         assetBenchmark_none_benchmark_rw_asset_none: [],
//         assetBenchmark_none_benchmark_r_asset_r: [],

//         // label asset labelBenchmark 

//         // label benchmark labelBenchmark

//         //label assetBenchmark labelBenchmark

//         //asset benchmark labelBenchmark

//         // asset assetBenchmark labelBenchamrk

//         // benchmark labelBenchmark assetBenchmark

        

//     },

//     quad: {
//       // Pairwise test cases assetBenchmark +/- label +/- benchmark +/- asset
//       assetBenchmark_rw_label_rw_benchmark_rw_asset_rw: [],
//       assetBenchmark_rw_label_r_benchmark_r_asset_none: [],
//       assetBenchmark_rw_label_none_benchmark_rw_asset_r: [],
//       assetBenchmark_r_label_rw_benchmark_r_asset_rw: [],
//       assetBenchmark_r_label_none_benchmark_r_asset_none: [],
//       assetBenchmark_r_label_r_benchmark_none_asset_rw: [],
//       assetBenchmark_none_label_rw_benchmark_none_asset_r: [],
//       assetBenchmark_none_label_r_benchmark_rw_asset_none: [],
//       assetBenchmark_none_label_none_benchmark_none_asset_rw: [],
//     },

//     multiples: {
//       // label - multiple assets
//       label_rw_asset_rw_asset_r: [{"labelId": reference.testCollection.fullLabel, "access": "rw"}, {"assetId":"29","access":"rw"}, {"assetId": "154", "access": "r"}], // whole label rw, asset 1 rw, asset 2 r
//       label_rw_asset_rw_asset_none: [{"labelId": reference.testCollection.fullLabel, "access": "rw"}, {"assetId":"29","access":"rw"}, {"assetId": reference.testAsset.assetId, "access": "none"}], // whole label rw, asset 1 rw, minus asset 2 which is in whole label rw label

//       // label - multiple benchmarks
//       //data is not set up to allow this to happen
//       label_rw_benchmark_rw_benchmark_r: [], // whole label rw, benchmark 1 rw, benchmark 2 r
//       label_rw_benchmark_rw_benchmark_none: [], // whole label rw, benchmark 1 rw, minus benchmark 2

//       // benchmark - multiple assets
//       benchmark_rw_asset_rw_asset_r: [{"benchmarkId": reference.testCollection.benchmark, "access": "rw"}, {"assetId":"29","access":"rw"}, {"assetId": reference.testAsset.assetId, "access": "r"}], // whole benchmark rw, add new asset asset 1 rw which isnt in the benchamrk then make asset 2 test assset read only
//       benchmark_rw_asset_rw_asset_none: [{"benchmarkId": reference.testCollection.benchmark, "access": "rw"}, {"assetId":"29","access":"rw"}, {"assetId": reference.testAsset.assetId, "access": "none"}], // whole benchmark rw, asset 1 rw, minus asset 2 test asset

//       // benchmark - multiple labels
//       // data is not set up to allow this to happen
//       // one below shows some double assets 
//       benchmark_rw_label_rw_label_none:  [{"benchmarkId": reference.testCollection.benchmark, "access": "rw"}, {"labelId": reference.testCollection.fullLabel, "access": "rw"}, {"labelId": "5130dc84-9a68-11ec-b1bc-0242ac110002", "access": "none"}], // whole benchmark rw, label 1 rw, label 2 r

//       // asset - multiple labels
//       asset_rw_label_rw_label_r: [{"assetId": "154", "access": "rw"}, {"labelId":reference.testCollection.fullLabel,"access":"rw"}, {"labelId": "5130dc84-9a68-11ec-b1bc-0242ac110002", "access": "r"}], // whole asset rw, label 1 rw, label 2 r
//       asset_rw_label_rw_label_none: [{"assetId": "154", "access": "rw"}, {"labelId":reference.testCollection.fullLabel,"access":"rw"}, {"labelId": "5130dc84-9a68-11ec-b1bc-0242ac110002", "access": "none"}], // whole asset rw, label 1 rw, minus label 2

//       // asset - multiple benchmarks
//       asset_rw_benchmark_rw_benchmark_r: [{"assetId": "154", "access": "rw"}, {"benchmarkId":reference.testCollection.benchmark,"access":"rw"}, {"benchmarkId": reference.windowsBenchmark, "access": "r"}], // whole asset rw, benchmark 1 rw, benchmark 2 r
//       asset_rw_benchmark_rw_benchmark_none: [{"assetId": "154", "access": "rw"}, {"benchmarkId":reference.testCollection.benchmark,"access":"rw"}, {"benchmarkId": reference.windowsBenchmark, "access": "none"}], // whole asset rw, benchmark 1 rw, minus benchmark 2

//       // label - multiple assetBenchmarks
//       // data is not set up to allow this to happen
//       label_rw_assetBenchmark_rw_assetBenchmark_r: [], // whole label rw, assetBenchmark 1 rw, assetBenchmark 2 r
//       label_rw_assetBenchmark_rw_assetBenchmark_none: [], // whole label rw, assetBenchmark 1 rw, minus assetBenchmark 2

//       // asset - multiple assetBenchmarks
//       asset_rw_assetBenchmark_rw_assetBenchmark_r: [{"assetId": "62", "access": "rw"}, {"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"rw"}, {"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"}], // whole asset rw, assetBenchmark 1 rw, assetBenchmark 2 r
//       asset_rw_assetBenchmark_rw_assetBenchmark_none: [{"assetId": reference.testAsset.assetId, "access": "rw"}, {"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"}, {"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}], // whole asset rw, assetBenchmark 1 rw, minus assetBenchmark 2

//       // benchmark - multiple assetBenchmarks
//       benchmark_rw_assetBenchmark_rw_assetBenchmark_r: [{"benchmarkId": reference.testCollection.benchmark, "access": "rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":"62","access":"r"} ], // whole benchmark rw, assetBenchmark 1 rw, assetBenchmark 2 r
//       benchmark_rw_assetBenchmark_rw_assetBenchmark_none: [{"benchmarkId": reference.testCollection.benchmark, "access": "rw"},{"benchmarkId":reference.windowsBenchmark,"assetId":reference.testAsset.assetId,"access":"rw"},{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"}], // whole benchmark rw, assetBenchmark 1 rw, minus assetBenchmark 2

//       // assetBenchmark - multiple labels
//       // idk if this is even realisitc
//       assetBenchmark_rw_label_rw_label_r: [], // whole assetBenchmark rw, label 1 rw, label 2 r
//       assetBenchmark_rw_label_rw_label_none: [], // whole assetBenchmark rw, label 1 rw, minus label 2

//       // assetBenchmark - multiple benchmarks
//       // need another benchmark
//       assetBenchmark_rw_benchmark_rw_benchmark_r: [{}], // whole assetBenchmark rw, benchmark 1 rw, benchmark 2 r
//       assetBenchmark_rw_benchmark_rw_benchmark_none: [], // whole assetBenchmark rw, benchmark 1 rw, minus benchmark 2

//       // assetBenchmark - multiple assets
//       assetBenchmark_rw_asset_rw_asset_r: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"assetId": reference.testAsset.assetId, "access": "rw"},{"assetId": "154", "access": "r"}], // whole assetBenchmark rw, asset 1 rw, asset 2 r
//       assetBenchmark_rw_asset_rw_asset_rw: [[{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"assetId": reference.testAsset.assetId, "access": "rw"},{"assetId": "154", "access": "rw"}]], // whole assetBenchmark rw, asset 1 rw, minus asset 2
//     }
}

module.exports = requestBodies
