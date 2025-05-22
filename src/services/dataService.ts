// src/services/dataService.ts
import { Store, Product, ApiResponse } from '../types';

/**
 * 店舗データを取得する
 * @returns Promise<Store> 店舗データ
 */
export const fetchStoreData = async (): Promise<Store> => {
  // 注: 実際の実装ではDynamoDBからデータを取得します
  // 現時点ではモックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        id: 'store-001',
        storeNumber: '123',
        storeName: '東京中央店',
        address: '東京都中央区日本橋1-1-1',
        phone: '03-1234-5678',
        updatedAt: new Date()
      });
    }, 500); // 通信の遅延をシミュレート
  });
};

/**
 * 商品リストを取得する
 * @returns Promise<Product[]> 商品リスト
 */
export const fetchProducts = async (): Promise<Product[]> => {
  // 注: 実際の実装ではDynamoDBからデータを取得します
  // 現時点ではモックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'prod-001',
          name: 'りんご',
          description: '山形県産 ふじ',
          quantity: 50,
          category: '果物',
          isChecked: false
        },
        {
          id: 'prod-002',
          name: 'バナナ',
          description: 'フィリピン産',
          quantity: 30,
          category: '果物',
          isChecked: false
        },
        {
          id: 'prod-003',
          name: 'キャベツ',
          description: '千葉県産',
          quantity: 20,
          category: '野菜',
          isChecked: false
        },
        {
          id: 'prod-004',
          name: 'トマト',
          description: '熊本県産',
          quantity: 15,
          category: '野菜',
          isChecked: false
        },
        {
          id: 'prod-005',
          name: '牛乳',
          description: '1000ml',
          quantity: 10,
          category: '乳製品',
          isChecked: false
        }
      ]);
    }, 800); // 通信の遅延をシミュレート
  });
};

/**
 * 商品の数量を更新する
 * @param productId 商品ID
 * @param quantity 新しい数量
 * @returns Promise<ApiResponse<Product>> 更新結果
 */
export const updateProductQuantity = async (
  productId: string,
  quantity: number
): Promise<ApiResponse<Product>> => {
  // 注: 実際の実装ではDynamoDBのデータを更新します
  return new Promise((resolve) => {
    setTimeout(() => {
      // 成功レスポンスをシミュレート
      resolve({
        success: true,
        data: {
          id: productId,
          name: 'サンプル商品', // 実際の実装では更新後の商品データが返ります
          quantity: quantity,
          updatedAt: new Date()
        },
        message: '商品数量を更新しました'
      });
    }, 300);
  });
};

/**
 * 商品のチェック状態を更新する
 * @param productId 商品ID
 * @param isChecked チェック状態
 * @returns Promise<ApiResponse<Product>> 更新結果
 */
// src/services/DataService.ts の修正部分
export const updateProductCheckStatus = async (
  productId: string,
  isChecked: boolean
): Promise<ApiResponse<Product>> => {
  // 注: 実際の実装ではDynamoDBのデータを更新します
  return new Promise((resolve) => {
    setTimeout(() => {
      // 成功レスポンスをシミュレート
      resolve({
        success: true,
        data: {
          id: productId,
          name: 'サンプル商品', // 実際の実装では更新後の商品データが返ります
          quantity: 0,  // quantity プロパティを追加
          isChecked: isChecked,
          updatedAt: new Date()
        },
        message: '商品のチェック状態を更新しました'
      });
    }, 300);
  });
};

/**
 * DynamoDBとの接続を初期化する
 * 注: Amplify Gen2を使用する場合は、この関数を呼び出してセットアップします
 */
export const initializeDataService = (): void => {
  // 将来的にはここでAmplify SDKの初期化などを行います
  console.log('データサービスを初期化しました');
};

/**
 * DynamoDBに実際に接続するための実装例（コメントアウト）
 * Amplify Gen2を使用する場合は、以下のようなコードを使用します
 */
/*
import { generateClient } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';
import { Schema } from '../amplify/data/resource';

// APIクライアントの生成
const client = generateClient<Schema>();

// 店舗データを取得する実装例
export const fetchStoreData = async (): Promise<Store> => {
  try {
    // 認証セッションを取得
    const { tokens } = await fetchAuthSession();
    if (!tokens) throw new Error('認証されていません');

    // DynamoDBからデータを取得
    const response = await client.models.Store.get('store-001');
    return response.data;
  } catch (error) {
    console.error('店舗データの取得に失敗しました', error);
    throw error;
  }
};

// 商品リストを取得する実装例
export const fetchProducts = async (): Promise<Product[]> => {
  try {
    // DynamoDBからデータを取得
    const response = await client.models.Product.list();
    return response.data;
  } catch (error) {
    console.error('商品リストの取得に失敗しました', error);
    throw error;
  }
};
*/