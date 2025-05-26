// src/models/index.ts
// クライアント側のモデル定義のみ

// クライアント側で使用するためのモデル型定義
export interface SortingProduct {
  id: string;
  name: string;
  expectedCount: number;
  actualCount?: number;
  isChecked: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// クライアント側で使用するためのスキーマ定義
const schema = {
  SortingProduct: {
    primaryKey: {
      partitionKey: 'id'
    },
    fields: {
      id: 'ID!',
      name: 'String!',
      expectedCount: 'Int!',
      actualCount: 'Int',
      isChecked: 'Boolean!',
      storeId: 'ID!',
      createdAt: 'AWSDateTime!',
      updatedAt: 'AWSDateTime!'
    }
  }
};

export default schema;