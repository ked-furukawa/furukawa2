// src/services/dataService.ts
import { Store, Product, ApiResponse, Destination, StoresByDestination } from '../types';

/**
 * 送り先一覧を取得する
 * @returns Promise<Destination[]> 送り先一覧
 */
export const fetchDestinations = async (): Promise<Destination[]> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: 'dest-001',
          name: '中之島',
          updatedAt: new Date()
        },
        {
          id: 'dest-002',
          name: '上越',
          updatedAt: new Date()
        }
      ]);
    }, 500);
  });
};

/**
 * 店舗の確定状態を更新する
 * @param storeId 店舗ID
 * @param isCompleted 確定状態
 * @returns Promise<ApiResponse<Store>> 更新結果
 */
export const updateStoreCompletionStatus = async (
  storeId: string,
  isCompleted: boolean
): Promise<ApiResponse<Store>> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`店舗 ${storeId} の確定状態を ${isCompleted ? '完了' : '未完了'} に更新しました`);
      resolve({
        success: true,
        data: {
          id: storeId,
          storeNumber: '',
          storeName: '',
          destinationId: '',
          isCompleted: isCompleted,
          updatedAt: new Date()
        },
        message: '店舗の確定状態を更新しました'
      });
    }, 300);
  });
};

/**
 * 送り先ごとにグループ化された店舗一覧を取得する
 * @returns Promise<StoresByDestination[]> 送り先ごとの店舗一覧
 */
export const fetchStoresByDestination = async (): Promise<StoresByDestination[]> => {
  try {
    // 送り先と店舗データを並行して取得
    const [destinations, stores] = await Promise.all([
      fetchDestinations(),
      fetchStores()
    ]);
    
    // 送り先ごとに店舗をグループ化
    const storesByDestination: StoresByDestination[] = destinations.map(destination => {
      const destinationStores = stores.filter(store => 
        store.destinationId && store.destinationId === destination.id
      );
      return {
        destination,
        stores: destinationStores
      };
    });
    
    return storesByDestination;
  } catch (error) {
    console.error('送り先ごとの店舗データ取得に失敗しました', error);
    throw error;
  }
};

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
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        {
          id: 'store-002',
          storeNumber: '456',
          storeName: '大阪中之島店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        {
          id: 'store-003',
          storeNumber: '789',
          storeName: '名古屋栄店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        {
          id: 'store-004',
          storeNumber: '321',
          storeName: '福岡天神店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        {
          id: 'store-005',
          storeNumber: '555',
          storeName: '札幌大通店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        {
          id: 'store-006',
          storeNumber: '666',
          storeName: '仙台一番町店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        {
          id: 'store-007',
          storeNumber: '777',
          storeName: '広島本通店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        {
          id: 'store-008',
          storeNumber: '888',
          storeName: '京都四条店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        {
          id: 'store-009',
          storeNumber: '999',
          storeName: '神戸三宮店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        {
          id: 'store-010',
          storeNumber: '101',
          storeName: '横浜みなとみらい店',
          destinationId: 'dest-001',
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
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        'store-002': {
          id: 'store-002',
          storeNumber: '456',
          storeName: '大阪中之島店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        'store-003': {
          id: 'store-003',
          storeNumber: '789',
          storeName: '名古屋栄店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        'store-004': {
          id: 'store-004',
          storeNumber: '321',
          storeName: '福岡天神店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        'store-005': {
          id: 'store-005',
          storeNumber: '555',
          storeName: '札幌大通店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        'store-006': {
          id: 'store-006',
          storeNumber: '666',
          storeName: '仙台一番町店',
          destinationId: 'dest-001',
          updatedAt: new Date()
        },
        'store-007': {
          id: 'store-007',
          storeNumber: '777',
          storeName: '広島本通店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        'store-008': {
          id: 'store-008',
          storeNumber: '888',
          storeName: '京都四条店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        'store-009': {
          id: 'store-009',
          storeNumber: '999',
          storeName: '神戸三宮店',
          destinationId: 'dest-002',
          updatedAt: new Date()
        },
        'store-010': {
          id: 'store-010',
          storeNumber: '101',
          storeName: '横浜みなとみらい店',
          destinationId: 'dest-001',
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
          { id: 'prod-001', name: 'りんご', quantity: 50, category: '果物', isChecked: false },
          { id: 'prod-002', name: 'バナナ', quantity: 30, category: '果物', isChecked: false },
          { id: 'prod-003', name: 'キャベツ', quantity: 20, category: '野菜', isChecked: false },
          { id: 'prod-004', name: 'トマト', quantity: 15, category: '野菜', isChecked: false },
          { id: 'prod-005', name: '牛乳', quantity: 10, category: '乳製品', isChecked: false }
        ],
        'store-002': [
          { id: 'prod-101', name: 'みかん', quantity: 45, category: '果物', isChecked: false },
          { id: 'prod-102', name: '大根', quantity: 25, category: '野菜', isChecked: false },
          { id: 'prod-103', name: 'ほうれん草', quantity: 18, category: '野菜', isChecked: false },
          { id: 'prod-104', name: 'チーズ', quantity: 12, category: '乳製品', isChecked: false }
        ],
        'store-003': [
          { id: 'prod-201', name: 'ぶどう', quantity: 40, category: '果物', isChecked: false },
          { id: 'prod-202', name: '白菜', quantity: 22, category: '野菜', isChecked: false },
          { id: 'prod-203', name: 'ヨーグルト', quantity: 15, category: '乳製品', isChecked: false }
        ],
        'store-004': [
          { id: 'prod-301', name: 'いちご', quantity: 35, category: '果物', isChecked: false },
          { id: 'prod-302', name: 'ナス', quantity: 28, category: '野菜', isChecked: false },
          { id: 'prod-303', name: 'クリーム', quantity: 20, category: '乳製品', isChecked: false }
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
 * 箱数データを保存する
 * @param storeId 店舗ID
 * @param productBoxCounts 商品IDと箱数のマッピング
 * @returns Promise<ApiResponse<Record<string, number>>> 保存結果
 */
export const saveBoxCounts = async (
  storeId: string,
  productBoxCounts: Record<string, number>
): Promise<ApiResponse<Record<string, number>>> => {
  // モックの保存処理
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`Store ${storeId} box counts saved:`, productBoxCounts);
      resolve({
        success: true,
        data: productBoxCounts,
        message: '箱数データを保存しました'
      });
    }, 500);
  });
};

/**
 * 次の店舗IDを取得する
 * @param currentStoreId 現在の店舗ID
 * @returns Promise<string | null> 次の店舗ID（存在しない場合はnull）
 */
export const getNextStoreId = async (currentStoreId: string): Promise<string | null> => {
  try {
    const stores = await fetchStores();
    const currentIndex = stores.findIndex(store => store.id === currentStoreId);
    
    if (currentIndex === -1 || currentIndex === stores.length - 1) {
      return null; // 現在の店舗が見つからないか、最後の店舗の場合
    }
    
    return stores[currentIndex + 1].id;
  } catch (error) {
    console.error('次の店舗IDの取得に失敗しました', error);
    return null;
  }
};

/**
 * 店舗の箱数データを保存する
 * @param storeId 店舗ID
 * @param boxCounts 商品IDと箱数のマッピング
 * @returns Promise<ApiResponse<any>> 保存結果
 */
export const saveBoxCountData = async (
  storeId: string,
  boxCounts: Record<string, number>
): Promise<ApiResponse<any>> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`店舗 ${storeId} の箱数データを保存しました:`, boxCounts);
      resolve({
        success: true,
        data: {
          storeId,
          boxCounts,
          updatedAt: new Date()
        },
        message: '箱数データを保存しました'
      });
    }, 800);
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