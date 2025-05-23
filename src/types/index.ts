// src/types/index.ts

/**
 * 店舗情報の型定義
 */
export interface Store {
  id: string;           // 店舗の一意のID
  storeNumber: string;  // 店舗番号（例: "001"）
  storeName: string;    // 店舗名（例: "東京本店"）
  updatedAt?: Date;     // 最終更新日時（オプション）
}

/**
 * 商品情報の型定義
 */
export interface Product {
  id: string;           // 商品の一意のID
  name: string;         // 商品名
  quantity: number;     // 数量
  category?: string;    // カテゴリ（オプション）
  isChecked?: boolean;  // チェック状態（オプション）
  updatedAt?: Date;     // 最終更新日時（オプション）
}

/**
 * API応答の型定義
 */
export interface ApiResponse<T> {
  data: T;              // レスポンスデータ
  success: boolean;     // 成功したかどうか
  message?: string;     // メッセージ（エラーメッセージなど）
}

/**
 * エラー情報の型定義
 */
export interface AppError {
  code: string;         // エラーコード
  message: string;      // エラーメッセージ
  details?: unknown;    // 詳細情報（オプション）
}

/**
 * フィルタリングオプションの型定義
 */
export interface FilterOptions {
  category?: string;    // カテゴリでフィルタリング
  searchTerm?: string;  // 検索語でフィルタリング
  showCheckedOnly?: boolean; // チェック済みのみ表示
}

/**
 * 箱数データの型定義
 */
export interface BoxCount {
  productId: string;    // 商品ID
  storeId: string;      // 店舗ID
  count: number;        // 箱数
  updatedAt: Date;      // 更新日時
}

/**
 * 店舗処理状態の型定義
 */
export interface StoreProcessStatus {
  storeId: string;      // 店舗ID
  isCompleted: boolean; // 処理完了フラグ
  boxCounts: Record<string, number>; // 商品IDと箱数のマッピング
}