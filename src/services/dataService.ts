// src/services/dataService.ts
import { Store, Product, ApiResponse } from '../types';

/**
 * 店舗一覧を取得する
 * @returns Promise<Store[]> 店舗一覧
 */
export const fetchStores = async (): Promise<Store[]> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'store-001',
          storeNumber: '123',
          storeName: '東京中央店',
          address: '東京都中央区日本橋1-1-1',
          phone: '03-1234-5678',
          updatedAt: new Date()
        },
        {
          id: 'store-002',
          storeNumber: '456',
          storeName: '大阪中之島店',
          address: '大阪府大阪市北区中之島1-1-1',
          phone: '06-1234-5678',
          updatedAt: new Date()
        },
        {
          id: 'store-003',
          storeNumber: '789',
          storeName: '名古屋栄店',
          address: '愛知県名古屋市中区栄3-1-1',
          phone: '052-123-4567',
          updatedAt: new Date()
        },
        {
          id: 'store-004',
          storeNumber: '321',
          storeName: '福岡天神店',
          address: '福岡県福岡市中央区天神2-2-2',
          phone: '092-345-6789',
          updatedAt: new Date()
        }
      ]);
    }, 500);
  });
};
/**
 * 店舗データを取得する
 * @param storeId 店舗ID (省略時はデフォルト店舗)
 * @returns Promise<Store> 店舗データ
 */
export const fetchStoreData = async (storeId: string = 'store-001'): Promise<Store> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      // 店舗データのマッピング
      const storeData: Record<string, Store> = {
        'store-001': {
          id: 'store-001',
          storeNumber: '123',
          storeName: '東京中央店',
          address: '東京都中央区日本橋1-1-1',
          phone: '03-1234-5678',
          updatedAt: new Date()
        },
        'store-002': {
          id: 'store-002',
          storeNumber: '456',
          storeName: '大阪中之島店',
          address: '大阪府大阪市北区中之島1-1-1',
          phone: '06-1234-5678',
          updatedAt: new Date()
        },
        'store-003': {
          id: 'store-003',
          storeNumber: '789',
          storeName: '名古屋栄店',
          address: '愛知県名古屋市中区栄3-1-1',
          phone: '052-123-4567',
          updatedAt: new Date()
        },
        'store-004': {
          id: 'store-004',
          storeNumber: '321',
          storeName: '福岡天神店',
          address: '福岡県福岡市中央区天神2-2-2',
          phone: '092-345-6789',
          updatedAt: new Date()
        }
      };
      
      // 指定されたIDの店舗が存在しない場合はデフォルト店舗を返す
      resolve(storeData[storeId] || storeData['store-001']);
    }, 500);
  });
};

/**
 * 商品リストを取得する
 * @param storeId 店舗ID (省略時はデフォルト店舗)
 * @returns Promise<Product[]> 商品リスト
 */
export const fetchProducts = async (storeId: string = 'store-001'): Promise<Product[]> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      // 店舗ごとの商品データのマッピング
      const productData: Record<string, Product[]> = {
        'store-001': [
          { id: 'prod-001', name: 'りんご', description: '山形県産 ふじ', quantity: 50, category: '果物', isChecked: false },
          { id: 'prod-002', name: 'バナナ', description: 'フィリピン産', quantity: 30, category: '果物', isChecked: false },
          { id: 'prod-003', name: 'キャベツ', description: '千葉県産', quantity: 20, category: '野菜', isChecked: false },
          { id: 'prod-004', name: 'トマト', description: '熊本県産', quantity: 15, category: '野菜', isChecked: false },
          { id: 'prod-005', name: '牛乳', description: '1000ml', quantity: 10, category: '乳製品', isChecked: false }
        ],
        'store-002': [
          { id: 'prod-101', name: 'みかん', description: '和歌山県産', quantity: 45, category: '果物', isChecked: false },
          { id: 'prod-102', name: '大根', description: '京都府産', quantity: 25, category: '野菜', isChecked: false },
          { id: 'prod-103', name: 'ほうれん草', description: '奈良県産', quantity: 18, category: '野菜', isChecked: false },
          { id: 'prod-104', name: 'チーズ', description: '北海道産', quantity: 12, category: '乳製品', isChecked: false }
        ],
        'store-003': [
          { id: 'prod-201', name: 'ぶどう', description: '長野県産', quantity: 40, category: '果物', isChecked: false },
          { id: 'prod-202', name: '白菜', description: '愛知県産', quantity: 22, category: '野菜', isChecked: false },
          { id: 'prod-203', name: 'ヨーグルト', description: '400g', quantity: 15, category: '乳製品', isChecked: false }
        ],
        'store-004': [
          { id: 'prod-301', name: 'いちご', description: '福岡県産', quantity: 35, category: '果物', isChecked: false },
          { id: 'prod-302', name: 'ナス', description: '佐賀県産', quantity: 28, category: '野菜', isChecked: false },
          { id: 'prod-303', name: 'クリーム', description: '200ml', quantity: 20, category: '乳製品', isChecked: false }
        ]
      };
      
      // 指定されたIDの店舗の商品が存在しない場合はデフォルト店舗の商品を返す
      resolve(productData[storeId] || productData['store-001']);
    }, 800);
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
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          id: productId,
          name: 'サンプル商品',
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
export const updateProductCheckStatus = async (
  productId: string,
  isChecked: boolean
): Promise<ApiResponse<Product>> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          id: productId,
          name: 'サンプル商品',
          quantity: 0,
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
 */
export const initializeDataService = (): void => {
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

// 店舗一覧を取得する実装例
export const fetchStores = async (): Promise<Store[]> => {
  try {
    // DynamoDBからデータを取得
    const response = await client.models.Store.list();
    return response.data;
  } catch (error) {
    console.error('店舗一覧の取得に失敗しました', error);
    throw error;
  }
};

// 店舗データを取得する実装例
export const fetchStoreData = async (storeId: string): Promise<Store> => {
  try {
    // 認証セッションを取得
    const { tokens } = await fetchAuthSession();
    if (!tokens) throw new Error('認証されていません');

    // DynamoDBからデータを取得
    const response = await client.models.Store.get(storeId);
    return response.data;
  } catch (error) {
    console.error('店舗データの取得に失敗しました', error);
    throw error;
  }
};

// 商品リストを取得する実装例
export const fetchProducts = async (storeId: string): Promise<Product[]> => {
  try {
    // DynamoDBからデータを取得
    const response = await client.models.Product.list({
      filter: { storeId: { eq: storeId } }
    });
    return response.data;
  } catch (error) {
    console.error('商品リストの取得に失敗しました', error);
    throw error;
  }
};
*/