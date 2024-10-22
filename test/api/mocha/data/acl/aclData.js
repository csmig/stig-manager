
// 42 = "Collection_X_lvl1_asset-1"
// 29 = ACHERNAR_Collection_X_asset
// 62 = Collection_X_asset
// 154 = Collection_X_lvl1_asset-2
// full label = 755

//create acl resolves to nothing, then create it with data 

const reference = require('../../referenceData.js')

const requestBodies = {

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
