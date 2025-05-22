import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

// const schema = a.schema({
//   Todo: a
//     .model({
//       content: a.string(),
//     })
//     .authorization((allow) => [allow.publicApiKey()]),
// });





export const schema = a.schema({
  Order: a.model({ //店舗-商品名のテーブル　←注文情報、主に読み用
    storeId: a.string().required(), // 店舗ID '019'
    storeName: a.string(), //店舗名 '内野店'
    storeTc: a.string(), //納品先物流センター '中之島'

    date: a.string().required(),    // 注文日 '2025-05-22'

    itemId: a.string().required(), // 商品コードが使えそう '210039'
    itemName: a.string(), //商品名・規格 '大エビ天重キット'
    itemFormalName: a.string(), //社内呼称 '大エビ'
    resDeptId: a.string(), //部門から生成する担当部門ID 'niku1'
    resDeptName: a.string(), //担当部門名 '肉１'
    orderCount: a.integer().required(), // 商品注文数 '3'
  })
  .identifier(['storeId', 'date', 'itemId']), // PKとSK

  Box: a.model({ //店舗-箱色のテーブル　←箱数情報、主に書き用(最後はこれを読む)
    storeId: a.string().required(), // 店舗ID '019'
    storeName: a.string(), //店舗名 '内野店'
    storeTc: a.string(), //納品先物流センター '中之島'

    date: a.string().required(),    // 注文日 '2025-05-22'

    color: a.string().required(),  // 箱色 'green'
    boxCount: a.integer().required(),   // 箱数 '20'
    boxCreatedBy: a.string() // 箱を作った部門
  })
  .identifier(['storeId', 'date', 'color']) //PKとSK
});

//↑で定義したschemaの型情報を安全に再利用するためにSchemaという変数に格納(準必須)
export type Schema = ClientSchema<typeof schema>; 

//Amplifyにおけるデータ設定の定義、これがないとDynamoDBに登録されない(必須)
export const data = defineData({ 
  schema, //↑のa.schemaで定義したテーブルたち
  authorizationModes: { //認可情報の設定
    defaultAuthorizationMode: "apiKey", //デフォルトをapiKey(誰でもアクセス可能)に設定←ここをuserPoolとかiamとかにしてアクセス制限する
    apiKeyAuthorizationMode: { 
      expiresInDays: 30, //apiKeyの設定、ここでは有効期限30日
    },
  },
});