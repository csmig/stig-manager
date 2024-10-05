const reference = require('../../referenceData.js')
const { benchmark, testCollection } = require('./referenceData')

const iterations = [
  // {
  //   
  //   name: 'labelBenchmark_rw_assetBenchmark_r',
  //   grant: 'Restricted',
  //   userId: '85',
  //   token:
  //     'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ3MDg5ODQsImlhdCI6MTY3MDU2ODE4NCwiYXV0aF90aW1lIjoxNjcwNTY4MTg0LCJqdGkiOiIxMDhmMDc2MC0wYmY5LTRkZjEtYjE0My05NjgzNmJmYmMzNjMiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJlM2FlMjdiOC1kYTIwLTRjNDItOWRmOC02MDg5ZjcwZjc2M2IiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjE0ZmE5ZDdkLTBmZTAtNDQyNi04ZmQ5LTY5ZDc0YTZmMzQ2NCIsInNlc3Npb25fc3RhdGUiOiJiNGEzYWNmMS05ZGM3LTQ1ZTEtOThmOC1kMzUzNjJhZWM0YzciLCJhY3IiOiIxIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImRlZmF1bHQtcm9sZXMtc3RpZ21hbiJdfSwicmVzb3VyY2VfYWNjZXNzIjp7InJlYWxtLW1hbmFnZW1lbnQiOnsicm9sZXMiOlsidmlldy11c2VycyIsInF1ZXJ5LWdyb3VwcyIsInF1ZXJ5LXVzZXJzIl19LCJhY2NvdW50Ijp7InJvbGVzIjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX19LCJzY29wZSI6Im9wZW5pZCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbiBzdGlnLW1hbmFnZXI6c3RpZzpyZWFkIHN0aWctbWFuYWdlcjp1c2VyOnJlYWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb246cmVhZCIsInNpZCI6ImI0YTNhY2YxLTlkYzctNDVlMS05OGY4LWQzNTM2MmFlYzRjNyIsIm5hbWUiOiJyZXN0cmljdGVkIiwicHJlZmVycmVkX3VzZXJuYW1lIjoibHZsMSIsImdpdmVuX25hbWUiOiJyZXN0cmljdGVkIn0.OqLARi5ILt3j2rMikXy0ECTTqjWco0-CrMwzE88gUv2i8rVO9kMgVsXbtPk2L2c9NNNujnxqg7QIr2_sqA51saTrZHvzXcsT8lBruf74OubRMwcTQqJap-COmrzb60S7512k0WfKTYlHsoCn_uAzOb9sp8Trjr0NksU8OXCElDU'
  // },
  {
    
    name: 'label_rw',
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
  },
  {
    name: 'label_r',
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
  },
  {
    name: 'label_none',
    put:[{"labelId":reference.testCollection.fullLabel,"access":"none"}],
    response: []
  },
  {
    name: 'benchmark_rw',
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
  {
    name: 'benchmark_r',
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
  {
    name: 'benchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"access":"none"}],
    response: []
  
   
  },
  {
    name: 'asset_rw',
   
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
  {
    name: 'asset_r',
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
  {
    name: 'asset_none',
    put: [{"assetId":reference.testAsset.assetId,"access":"none"}],
    response: []
  },
  {
    name: 'assetBenchmark_rw',
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
  {
    name: 'assetBenchmark_r',
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
  {
    name: 'assetBenchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":reference.testAsset.assetId,"access":"none"}],
    response: []
  },
  {
    name: 'labelBenchmark_rw',
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
  {
    name: 'labelBenchmark_r',
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
  {
    name: 'labelBenchmark_none',
    put: [{"benchmarkId":reference.testCollection.benchmark,"labelId":reference.testCollection.fullLabel,"access":"none"}],
    response: []
  },
  {
    name: 'asset_rw_asset_rw',
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
  {
    name: 'asset_rw_asset_r',
    put: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"r"}],
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
        access: "r",
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
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
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
  {
    name: 'asset_rw_asset_none',
    put: [{"assetId":reference.testAsset.assetId,"access":"rw"},{"assetId":"154","access":"none"}],
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
    ]
  },
  {
    name: 'asset_r_asset_r',
    put: [{"assetId":reference.testAsset.assetId,"access":"r"},{"assetId":"154","access":"r"}],
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
      },
      {
        access: "r",
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
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
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
  {
    name: 'assetBenchmark_rw_label_rw',
    put:[{"benchmarkId":reference.windowsBenchmark,"assetId":"62","access":"rw"},{"labelId":reference.testCollection.lvl1Label,"access":"rw"}],
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
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
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
                name: reference.testCollection.lvl1LabelName,
                labelId: reference.testCollection.lvl1Label,
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
          assetId: "62"
        },
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              asset: {
                name: "Collection_X_asset",
                assetId: "62"
              },
              access: "rw",
              benchmarkId: reference.windowsBenchmark
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
  },
  {
    name: 'assetBenchmark_rw_label_r',
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"rw"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
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
              benchmarkId: reference.testCollection.benchmark,
            },
            grantee: {
              userId: 85,
              username: "lvl1",
              accessLevel: 1,
            },
          },
        ]
      }
    ]
  },
  {
    name: "assetBenchark_r_label_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"154","access":"r"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
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
              asset: {
                name: "Collection_X_lvl1_asset-2",
                assetId: "154",
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
        ]
      }
    ]
  },
  {
    name: "assetBenchmark_none_label_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"rw"}],
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
        "access": "rw",
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
      }
    ]
  },
  {
    name: "assetBenchmark_none_label_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"62","access":"none"},{"labelId":reference.testCollection.fullLabel,"access":"r"}],
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
        "access": "r",
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
      }
    ]
  },
  {
    name: "assetBenchmark_rw_benchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"rw"}],
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
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
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
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
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
              access: "rw",
              benchmarkId: reference.windowsBenchmark,
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
  { 
    name: "assetBenchmark_rw_benchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"rw"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
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
              access: "r",
              benchmarkId: reference.windowsBenchmark,
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
              access: "r",
              benchmarkId: reference.windowsBenchmark,
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
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
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
  { 
    name: "assetBenchmark_r_benchmark_rw",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"r"},{"benchmarkId":reference.benchmark,"access":"rw"}],
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
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
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
  { 
    name: "assetBenchmark_r_benchmark_r",
    put: [{"benchmarkId":reference.testCollection.benchmark,"assetId":"42","access":"r"},{"benchmarkId":reference.testCollection.benchmark,"access":"r"}],
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
          name: "Collection_X_lvl1_asset-2",
          assetId: "154",
        },
        benchmarkId: reference.testCollection.benchmark,
        aclSources: [
          {
            aclRule: {
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
  { 
    name: "assetBenchmark_none_benchmark_r",
    put: [{"benchmarkId":reference.windowsBenchmark, "assetId":"42","access":"none"},{"benchmarkId":reference.windowsBenchmark,"access":"r"}],
    response: [
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
              access: "r",
              benchmarkId: reference.windowsBenchmark,
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
        benchmarkId: reference.windowsBenchmark,
        aclSources: [
          {
            aclRule: {
              access: "r",
              benchmarkId: reference.windowsBenchmark,
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
  }
]

module.exports = iterations
