import { useState, useEffect } from 'react';
import { 
fetchStoreData, 
fetchProducts, 
fetchStores, 
fetchStoresByDestination,
updateStoreCompletionStatus
} from '../services/dataService';
import { Store, Product } from '../types';

/**
 * 店舗データの管理と操作を行うカスタムフック
 * 
 * 店舗の選択、データ取得、完了状態の管理などの機能を提供します
 */
export function useStoreManagement() {
// 店舗関連の状態
const [storeData, setStoreData] = useState<Store | null>(null);
const [nextStore, setNextStore] = useState<Store | null>(null);
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
const [completedStoreIds, setCompletedStoreIds] = useState<string[]>([]);

/**
 * 店舗を選択し、関連データを取得する
 * @param storeId 選択する店舗ID
 */
const handleStoreSelect = async (storeId: string) => {
    setSelectedStoreId(storeId);
    setLoading(true);
    try {
    // 選択した店舗のデータを取得
    const store = await fetchStoreData(storeId);
    setStoreData(store);
    
    // 選択した店舗の商品データを取得
    const productList = await fetchProducts(storeId);
    setProducts(productList);
    
    // 次の店舗を取得
    const allStores = await fetchStores();
    const currentIndex = allStores.findIndex(s => s.id === storeId);
    if (currentIndex >= 0 && currentIndex < allStores.length - 1) {
        setNextStore(allStores[currentIndex + 1]);
    } else {
        // 最後の店舗の場合は最初の店舗を次の店舗とする
        setNextStore(currentIndex >= 0 ? allStores[0] : null);
    }
    } catch (err) {
    setError('店舗データの読み込みに失敗しました');
    console.error(err);
    } finally {
    setLoading(false);
    }
};

// 初期データの取得
useEffect(() => {
    const loadInitialData = async () => {
    try {
        setLoading(true);
        // 送り先ごとの店舗データを取得
        const storesByDestination = await fetchStoresByDestination();
        
        if (storesByDestination.length > 0 && storesByDestination[0].stores.length > 0) {
        // 最初の送り先の最初の店舗を選択
        const firstStore = storesByDestination[0].stores[0];
        await handleStoreSelect(firstStore.id);
        }
    } catch (err) {
        setError('データの読み込みに失敗しました');
        console.error(err);
    } finally {
        setLoading(false);
    }
    };

    loadInitialData();
}, []);

/**
 * 店舗を完了済みとしてマークする
 * @param storeId 完了済みとしてマークする店舗ID
 */
const markStoreAsCompleted = async (storeId: string) => {
    if (!storeId) return;
    
    try {
    // 状態を更新
    setCompletedStoreIds(prev => [...prev, storeId]);
    
    // APIを呼び出して確定状態を更新
    await updateStoreCompletionStatus(storeId, true);
    } catch (err) {
    console.error('店舗の確定状態の更新に失敗しました', err);
    throw err;
    }
};

return {
    storeData,
    nextStore,
    products,
    setProducts,
    loading,
    error,
    setError,
    selectedStoreId,
    completedStoreIds,
    handleStoreSelect,
    markStoreAsCompleted
};
}