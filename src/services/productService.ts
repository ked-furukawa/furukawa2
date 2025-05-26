// src/services/productService.ts

// 型定義
export interface SortingProduct {
  id: string;
  name: string;
  expectedCount: number;
  actualCount?: number | null;
  isChecked: boolean;
  storeId: string;
  createdAt: string;
  updatedAt: string;
}

// モックデータ
const mockProducts: SortingProduct[] = [
  { 
    id: '1', 
    name: '唐揚げ', 
    expectedCount: 15, 
    isChecked: false, 
    storeId: 'store-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '2', 
    name: 'コロッケ', 
    expectedCount: 20, 
    isChecked: false, 
    storeId: 'store-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '3', 
    name: 'ポテトサラダ', 
    expectedCount: 8, 
    isChecked: false, 
    storeId: 'store-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  { 
    id: '4', 
    name: '焼き鳥', 
    expectedCount: 12, 
    isChecked: false, 
    storeId: 'store-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// ローカルストレージに保存されたデータを取得
function getLocalProducts(): SortingProduct[] {
  try {
    const storedProducts = localStorage.getItem('sortingProducts');
    if (storedProducts) {
      return JSON.parse(storedProducts);
    }
    // 初回はモックデータを保存
    localStorage.setItem('sortingProducts', JSON.stringify(mockProducts));
    return mockProducts;
  } catch (error) {
    console.error('ローカルストレージからの読み込みに失敗しました:', error);
    return mockProducts;
  }
}

// ローカルストレージにデータを保存
function saveLocalProducts(products: SortingProduct[]): void {
  try {
    localStorage.setItem('sortingProducts', JSON.stringify(products));
  } catch (error) {
    console.error('ローカルストレージへの保存に失敗しました:', error);
  }
}

// 商品リストを取得する関数
export async function fetchProducts(storeId: string): Promise<SortingProduct[]> {
  // 開発中はモックデータを使用
  return new Promise((resolve) => {
    setTimeout(() => {
      const products = getLocalProducts().filter(p => p.storeId === storeId);
      resolve(products);
    }, 300); // リアルなAPIコールをシミュレート
  });
}

// 商品の確認状態を更新する関数
export async function updateProductCheckStatus(productId: string, isChecked: boolean): Promise<SortingProduct> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const products = getLocalProducts();
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
          reject(new Error('商品が見つかりません'));
          return;
        }
        
        const updatedProduct = {
          ...products[productIndex],
          isChecked,
          updatedAt: new Date().toISOString()
        };
        
        products[productIndex] = updatedProduct;
        saveLocalProducts(products);
        
        resolve(updatedProduct);
      } catch (error) {
        reject(error);
      }
    }, 300); // リアルなAPIコールをシミュレート
  });
}

// 商品の実際の数量を更新する関数
export async function updateProductActualCount(productId: string, actualCount: number): Promise<SortingProduct> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const products = getLocalProducts();
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
          reject(new Error('商品が見つかりません'));
          return;
        }
        
        const updatedProduct = {
          ...products[productIndex],
          actualCount,
          isChecked: true, // 数量を入力したら自動的に確認済みにする
          updatedAt: new Date().toISOString()
        };
        
        products[productIndex] = updatedProduct;
        saveLocalProducts(products);
        
        resolve(updatedProduct);
      } catch (error) {
        reject(error);
      }
    }, 300); // リアルなAPIコールをシミュレート
  });
}

// 将来的にAmplify APIを使用する場合のコメント
/*
import { generateClient } from 'aws-amplify/api';

// Amplify APIクライアントの設定
// 注: Amplify Gen2の仕様が安定したら、以下のコードを使用してください
const client = generateClient();

// GraphQLクエリとミューテーションの実装
export async function fetchProductsWithAPI(storeId: string): Promise<SortingProduct[]> {
  try {
    // 実際のGraphQLクエリの実装
    // ...
  } catch (error) {
    console.error('商品リストの取得に失敗しました:', error);
    throw error;
  }
}
*/