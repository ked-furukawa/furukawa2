import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

export const schema = a.schema({
  Order: a.model({ //店舗-商品名のテーブル　←注文情報、主に読み用
    importId:a.string().required(), //取り込み単位のID '20250606_103000'
    //2025年6月6日 10:30:00 の取り込み、A.importIdとB.importIdの文字列比較で新しい方を特定可能(文字列として大きいほうが新しい)
    
    date: a.string().required(),    // 納品日 '20250606'

    storeId: a.string().required(), // 店舗ID '019'
    storeName: a.string(), //店舗名 '内野店'
    storeTc: a.string(), //納品先物流センター '中之島'

    itemId: a.string().required(), // 商品コード '210039'
    itemName: a.string(), //社内呼称 '大エビ'
    itemFormalName: a.string(), //商品名・規格 '大エビ天重キット'
    itemCount: a.integer().required(), // 商品注文数 '3'

    departmentId: a.string(), //並び順グループから計算される 'souzai2' 
    departmentName: a.string(), //担当部門名 '惣菜2'

    status:a.string().default('PENDING'), //作業状態 'PENDING' or 'DONE'
    //'PENDING'=保留中　'DONE'=完了済み
  })
  .identifier(['importId','date', 'storeId', 'itemId']) // PKとSK
  .secondaryIndexes((index) => [ 
  index("date") //GSI 部門ごとに全部取得したいとき用
    .sortKeys(["departmentId","importId"])
    .queryField("listOrdersByDeptAndImport") //フロントでこのメソッド名を使えばこのGSIが使える
    .name("GSI_OrderDateDeptImport"),
  index("date") //GSI 新旧の注文から差分を取りたい時用
    .sortKeys(["storeId","itemId"])
    .queryField("listOrdersByStoreAndItem")
    .name("GSI_OrderDateStoreItem"),
  ])
  .authorization(allow => [allow.authenticated()]), //認証情報の設定


  Box: a.model({ //店舗-箱色のテーブル　←箱数情報、主に書き用(最後はこれを読む)
    date: a.string().required(),    // 注文日 '20250606'

    storeId: a.string().required(), // 店舗ID '019'
    storeName: a.string(), //店舗名 '内野店'
    storeTc: a.string(), //納品先物流センター '中之島'

    boxColor: a.string().required(),  // 箱色 'green'など
    boxCount: a.integer().required(),   // 箱数 '20' 再作業分は累積にしたい

    departmentId: a.string().required(), // 箱を作った部門ID

    status:a.string().default('PENDING') // 'PENDING' or 'CONFIRMED' or 'DOUBLE_CHECKED'
  })
  .identifier(['date', 'storeId', 'boxColor','departmentId']) //PKとSK
  .secondaryIndexes((index) => [ 
  index("date") //GSI 部門ごとに全部取得したいとき用
    .sortKeys(["departmentId"])
    .queryField("listBoxesByDate") //フロントでこのメソッド名を使えばこのGSIが使える
    .name("GSI_BoxDateDept"),
  index("date") //GSI 事務所で全部合計する用
    .sortKeys(["storeId", "boxColor"])
    .queryField("listBoxesByDateAll")
    .name("GSI_BoxDateAll")
  ])
  .authorization((allow) => [allow.authenticated()]), //認証情報の設定

ImportWorkStatus: a.model({
    date: a.string().required(),             // '20250606'
    departmentId: a.string().required(),     // 'test'

    importId: a.string().required(),   // '20250606_103000'
    status: a.string().default('PENDING') // 'PENDING' | 'IN_PROGRESS' | 'DONE'
  })
  .identifier(['date', 'departmentId', 'importId'])
  .authorization((allow) => [allow.authenticated()])
  });


  // CompleteFlag: a.model({ //その日の作業完了フラグ　←このフラグで表示されるデータのフィルタリングを決める
  //   date: a.string().required(),    // 注文日 '20250606'

  //   departmentId: a.string().required(), // 部門ID(仮) 'test'
  //   departmentName: a.string(), //部門名(仮) 'test部門'

  //   nakanoshimaState:a.string().default('PENDING'), //中之島の完了状態
  //   jyoetsuState:a.string().default('PENDING'), //上越の完了状態
  //   //'PENDING' → 'DONE' → 'REWORK_PENDING' → 'REWORK_DONE' の順にめぐるイメージ
  // })
  // .identifier(['date', 'departmentId']) //PKとSK
  // .authorization((allow) => [allow.authenticated()]), //認証情報の設定


//↑で定義したschemaの型情報を安全に再利用するためにSchemaという変数に格納(準必須)
export type Schema = ClientSchema<typeof schema>; 

//Amplifyにおけるデータ設定の定義、これがないとDynamoDBに登録されない(必須)
export const data = defineData({ 
  schema, //↑のa.schemaで定義したテーブルたち
  authorizationModes: { //認可情報の設定
    defaultAuthorizationMode: 'userPool', //デフォルトをapiKey(誰でもアクセス可能)に設定←ここをuserPoolとかiamとかにしてアクセス制限する
    // apiKeyAuthorizationMode: { 
    //   expiresInDays: 30, //apiKeyの設定、ここでは有効期限30日
    // },
  },
});