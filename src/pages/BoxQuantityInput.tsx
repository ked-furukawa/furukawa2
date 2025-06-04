// src/pages/BoxQuantityInput.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  CssBaseline,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography
} from '@mui/material';
import { Keypad } from '../components/Keypad';
import StoreList from '../components/StoreList';
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";
import { StoreProductPanel } from '../components/StoreProductPanel';
import { filterByCompleteFlag } from '../components/filterByCompleteFlag';

// 型定義に BoxColor を追加
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

// Amplify クライアントの生成
const dataClient = generateClient<Schema>();

// 定数の抽出
const TEST_DATE = "2025-06-02";
const TEST_DEPARTMENT_ID = "test";
const TEST_DEPARTMENT_NAME = "test部門";

type Order = Schema['Order']['type'];
type BoxData = Schema['Box']['type'];

// 型定義
interface Store {
  storeId: string;
  storeName: string;
  storeTc: string;
}

interface Product {
  id: string;
  itemId: string;
  itemName: string;
  itemFormalName: string;
  orderCount: number;
  quantity: number;
  isChecked: boolean;
}

// 完了済み店舗の型定義
interface CompletedStore {
  storeId: string;
  boxCount: number;
  color: BoxColor;
}

interface BoxQuantityInputProps {
  navigateTo: (key: string) => void;
}

export const BoxQuantityInput: React.FC<BoxQuantityInputProps> = ({ navigateTo }) => {
  // 状態管理
  const [inputValue, setInputValue] = useState<string>('');
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [nextStore, setNextStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [savingData, setSavingData] = useState<boolean>(false);
  const [checkError, setCheckError] = useState<string | null>(null);
  const [completedStores, setCompletedStores] = useState<CompletedStore[]>([]);
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedColor, setSelectedColor] = useState<BoxColor>('green');
  const [refreshKey, setRefreshKey] = useState(0);

  // データキャッシュ
  const [orders, setOrders] = useState<Order[]>([]);
  const [boxDataCache, setBoxDataCache] = useState<BoxData[]>([]);

  // 完了済み店舗IDのリスト（メモ化）
  const completedStoreIds = useMemo(() =>
    completedStores.map(item => item.storeId),
    [completedStores]
  );

  // 初期データの一括取得
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);



    // 並列でデータを取得
    const [ordersResponse, boxResponse] = await Promise.all([
      dataClient.models.Order.list({
        filter: { date: { eq: TEST_DATE } }
      }),
      dataClient.models.Box.list({
        filter: { date: { eq: TEST_DATE } }
      })
    ]);
    // フィルター処理
    const filteredOrders = await filterByCompleteFlag(TEST_DATE, TEST_DEPARTMENT_ID, ordersResponse.data);
    const filteredBoxData = await filterByCompleteFlag(TEST_DATE, TEST_DEPARTMENT_ID, boxResponse.data);
    // データをキャッシュ
    setOrders(filteredOrders as Order[]);
    setBoxDataCache(filteredBoxData as BoxData[]);
    // 完了済み店舗の処理
    const storeBoxMap = new Map<string, CompletedStore>();
    filteredBoxData.forEach(box => {
      if (!storeBoxMap.has(box.storeId)) {
        storeBoxMap.set(box.storeId, {
          storeId: box.storeId,
          boxCount: 0,
          color: box.color || 'green'
        });
      }
      // 箱数を加算
      const storeData = storeBoxMap.get(box.storeId)!;
      storeData.boxCount += box.boxCount;
    });
    // 完了済み店舗リストを設定
    setCompletedStores(Array.from(storeBoxMap.values()));
    // 店舗リストの作成
    const stores = extractStoresFromOrders(filteredOrders as Order[]);
    setAllStores(stores);
    // 最初の店舗を選択
    if (stores.length > 0) {
      const firstStoreId = stores[0].storeId;
      handleStoreSelectInternal(firstStoreId, filteredOrders as Order[], filteredBoxData as BoxData[]);
      setNextStore(getNextStore(firstStoreId, stores));
    }
  } catch (err) {
    console.error('データの読み込みに失敗しました:', err);
    setError('データの読み込みに失敗しました');
  } finally {
    setLoading(false);
  }
};
fetchAllData();
  }, []);

  // 店舗データの抽出（メモ化）
  const extractStoresFromOrders = useCallback((orders: Order[]): Store[] => {
    const storeMap = new Map<string, Store>();



orders.forEach(order => {
  if (!order.storeId) return;
  if (!storeMap.has(order.storeId)) {
    storeMap.set(order.storeId, {
      storeId: order.storeId,
      storeName: order.storeName ?? '',
      storeTc: order.storeTc ?? ''
    });
  }
});
return Array.from(storeMap.values());
  }, []);

  // 次の店舗を取得する関数（メモ化）
  const getNextStore = useCallback((currentStoreId: string, storeList = allStores): Store | null => {
    if (!storeList.length) return null;



const currentIndex = storeList.findIndex(s => s.storeId === currentStoreId);
if (currentIndex === -1) return storeList[0];
if (currentIndex < storeList.length - 1) {
  return storeList[currentIndex + 1];
}
return null;
  }, [allStores]);

  // 内部用の店舗選択処理（キャッシュデータを使用）
  const handleStoreSelectInternal = (
    storeId: string,
    orderData: Order[],
    boxData: BoxData[]
  ) => {
    setSelectedStoreId(storeId);



const filtered = orderData.filter(order => order.storeId === storeId);
if (filtered.length === 0) {
  setError('店舗データが見つかりませんでした');
  return;
}
const matchingOrder = filtered[0];
const newStoreData = {
  storeId: matchingOrder.storeId,
  storeName: matchingOrder.storeName || '',
  storeTc: matchingOrder.storeTc || ''
};
setStoreData(newStoreData);
// 店舗の箱データをフィルタリング（データベースアクセスなし）
const storeBoxData = boxData.filter(box => box.storeId === storeId);
// 選択した店舗が完了済みかどうかをチェック
const isCompletedStore = completedStores.some(store => store.storeId === storeId);  
const productList = filtered.map(order => {
  const box = storeBoxData.find(b => b.boxCreatedBy === TEST_DEPARTMENT_ID);
  const shouldBeChecked = isCompletedStore || !!box;
  return {
    id: order.itemId,
    itemId: order.itemId,
    itemName: order.itemName || '',
    itemFormalName: order.itemFormalName || '',
    orderCount: order.orderCount,
    quantity: box ? box.boxCount : 0,
    isChecked: shouldBeChecked
  };
});
setProducts(productList);
setSelectedProductIds([]);
setInputValue('');
// 完了済み店舗の場合、すべての商品を選択状態にする
if (isCompletedStore) {
  setTimeout(() => {
    const allProductIds = productList.map(p => p.id);
    setSelectedProductIds(allProductIds);
  }, 100);
}
// 次の店舗を設定
if (allStores.length > 0) {
  setNextStore(getNextStore(storeId));
}
  };

  // 店舗選択時の処理（外部向け - キャッシュデータを使用）
  const handleStoreSelect = useCallback(async (storeId: string) => {
    handleStoreSelectInternal(storeId, orders, boxDataCache);
  }, [orders, boxDataCache, completedStores, allStores, getNextStore]);

  // 箱数更新処理（メモ化）
  const handleQuantityUpdate = useCallback(() => {
    if (selectedProductIds.length === 0 || !inputValue) {
      setError('商品を選択して箱数を入力してください');
      return;
    }



const quantity = parseInt(inputValue, 10);
if (isNaN(quantity)) return;
// すべての商品がチェックされているか確認
const uncheckedProducts = products.filter(p => !p.isChecked && !selectedProductIds.includes(p.id));
if (uncheckedProducts.length > 0) {
  setError(`${uncheckedProducts.length}個の商品がチェックされていません。すべての商品をチェックしてください。`);
  return;
}
// 選択されている全ての商品の数量を更新
setProducts(prevProducts => 
  prevProducts.map(product => 
    selectedProductIds.includes(product.id) 
      ? { ...product, quantity, isChecked: true } 
      : product
  )
);
// エラーをクリア
setError(null);
// 確認ダイアログを表示
setShowConfirmDialog(true);
  }, [inputValue, selectedProductIds, products]);

  // 色変更ハンドラー（メモ化）
  const handleColorChange = useCallback((color: BoxColor) => {
    setSelectedColor(color);
  }, []);

  // 商品の選択を処理する関数（メモ化）
  const handleProductSelect = useCallback((productId: string) => {
    const product = products.find(p => p.id === productId);



if (!product) return;
if (product.isChecked) {
  setSelectedProductIds([productId]);
  setInputValue('');
  return;
}
setSelectedProductIds(prev => {
  if (prev.includes(productId)) {
    return prev.filter(id => id !== productId);
  } else {
    return [...prev, productId];
  }
});
  }, [products]);

  // テンキーからの入力を処理する関数（メモ化）
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // 次の店舗へ移動する関数（最適化版）
  const navigateToNextStore = useCallback(async () => {
    if (!selectedStoreId || !storeData) return;



try {
  setSavingData(true);
  // 選択された商品と箱数のデータを作成
  const boxUpdatePromises = selectedProductIds.map(async (productId) => {
    const product = products.find(p => p.id === productId);
    if (product && product.quantity > 0) {
      // 箱データを準備
      const boxData = {
        date: TEST_DATE,
        storeId: selectedStoreId,
        storeName: storeData.storeName,
        storeTc: storeData.storeTc,
        color: selectedColor,
        boxCount: product.quantity,
        boxCreatedBy: TEST_DEPARTMENT_ID
      };
      try {
        // 既存の箱データを検索（キャッシュから）
        const existingBox = boxDataCache.find(box => 
          box.date === TEST_DATE && 
          box.storeId === selectedStoreId && 
          box.boxCreatedBy === TEST_DEPARTMENT_ID
        );
        if (existingBox) {
          // 更新
          await dataClient.models.Box.update(boxData);
          // キャッシュも更新
          setBoxDataCache(prev => prev.map(box => 
            box.date === TEST_DATE && 
            box.storeId === selectedStoreId && 
            box.boxCreatedBy === TEST_DEPARTMENT_ID
              ? { ...box, ...boxData }
              : box
          ));
        } else {
        // 新規作成
        const newBox = await dataClient.models.Box.create(boxData);

        // キャッシュに追加（型アサーションを使用）
        if (newBox.data) {
          setBoxDataCache(prev => [...prev, newBox.data as BoxData]);
        }
        }
        return true;
      } catch (error) {
        console.error(`箱数の保存に失敗しました`, error);
        return false;
      }
    }
    return true;
  });
  // すべての更新を並列で実行
  await Promise.all(boxUpdatePromises);
  // 選択された商品の箱数の合計を計算
  const totalBoxCount = parseInt(inputValue, 10) || 0;
  // 完了済み店舗リストに追加（既に追加されている場合は更新）
  setCompletedStores(prev => {
    const filteredStores = prev.filter(store => store.storeId !== selectedStoreId);
    return [...filteredStores, {
      storeId: selectedStoreId,
      boxCount: totalBoxCount,
      color: selectedColor
    }];
  });
  // リフレッシュキーを更新して StoreList を再レンダリング
  setRefreshKey(prev => prev + 1);
  // 中之島店舗の完了チェック
  const nakanoshimaStores = allStores.filter(s => s.storeTc === '中之島');
  const completedNakanoshima = completedStores
    .filter(cs => nakanoshimaStores.some(ns => ns.storeId === cs.storeId))
    .map(cs => cs.storeId);
  const newlyCompleted = [...new Set([...completedNakanoshima, selectedStoreId])];
  if (newlyCompleted.length === nakanoshimaStores.length) {
    // 全中之島店舗が完了 → 商品数確認画面へ遷移
    await dataClient.models.CompleteFlag.update({
      date: TEST_DATE,
      departmentId: TEST_DEPARTMENT_ID,
      departmentName: TEST_DEPARTMENT_NAME,
      completeState: '中之島完了'
    });
    navigateTo('SortingCheckScreen');
    return;
  }
  if (!nextStore) {
    navigateTo('StoreDoubleCheckList');
    return;
  }
  // 次の店舗に移動（キャッシュデータを使用）
  handleStoreSelectInternal(nextStore.storeId, orders, boxDataCache);
  // 選択をクリア
  setSelectedProductIds([]);
  setInputValue('');
} catch (err) {
  setError('データの保存に失敗しました');
  console.error('データ保存エラー:', err);
} finally {
  setSavingData(false);
  setShowConfirmDialog(false);
}
  }, [
    selectedStoreId,
    storeData,
    selectedProductIds,
    products,
    selectedColor,
    inputValue,
    boxDataCache,
    completedStores,
    allStores,
    nextStore,
    orders,
    navigateTo
  ]);

  // 確認ダイアログをキャンセルする関数（メモ化）
  const handleDialogCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <Box display="flex" height="100vh">
      {/* 左側：店舗リスト */}
      <Box sx={{ pl: 15,py:2.8,pr:1, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
        <StoreList
          key={refreshKey}
          selectedStoreId={selectedStoreId}
          onSelectStore={handleStoreSelect}
          completedStores={completedStores}
        />
      </Box>



  <Box flex="1" display="flex" flexDirection="column" justifyContent="center"　alignItems="center"
sx={{ pl: 1, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
    <CssBaseline />
    <Container maxWidth="lg" disableGutters>
      <Box 
        display="flex"
        flexDirection={{ xs: 'column', md: 'row' }}
        justifyContent="flex-start"
        alignItems="flex-start"
        gap={2} 
        height="100%"
      >
        {/* 中央：統合された店舗情報と商品リスト */}
        <Box 
          width={{ xs: '100%', md: '45%' }} 
          height={{ xs: 'auto', md: '600px' }}
        >
          <StoreProductPanel
            storeNumber={storeData?.storeId || ''}
            storeName={storeData?.storeName || ''}
            products={products}
            selectedProductIds={selectedProductIds}
            onProductSelect={handleProductSelect}
            loading={loading}
            error={error}
            completedStoreIds={completedStoreIds}
          />
        </Box>
        {/* 右側：テンキー */}
        <Box

          width={{ xs: '100%', md: '35%' }}
          height={{ xs: 'auto', md: '600px' }}
        >
          <Keypad 
            value={inputValue}
            onChange={handleInputChange}
            onEnter={handleQuantityUpdate}
            onClear={() => setInputValue('')}
            selectedColor={selectedColor}
            onColorChange={handleColorChange}
          />
        </Box>
      </Box>
    </Container>
  </Box>
  {/* チェックエラーメッセージ */}
  {checkError && (
    <Box 
      sx={{ 
        mt: 2, 
        p: 2, 
        bgcolor: 'warning.light', 
        color: 'warning.contrastText', 
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}
    >
      <Typography variant="body1">{checkError}</Typography>
      <Button 
        size="small" 
        onClick={() => setCheckError(null)}
        sx={{ ml: 2 }}
      >
        閉じる
      </Button>
    </Box>
  )}
  {/* 確認ダイアログ */}
  <Dialog
    open={showConfirmDialog}
    onClose={handleDialogCancel}
  >
    <DialogTitle>次の店舗に進みますか？</DialogTitle>
    <DialogContent>
      <Typography variant="body1">
        {`${storeData?.storeName || '現在の店舗'}の処理を完了します。`}
        {
          !nextStore
            ? '最後の店舗です。'
            : storeData?.storeTc === '中之島' && nextStore.storeTc !== '中之島'
            ? '中之島の作業が完了しました。商品数確認画面に進みます。'
            : `${nextStore.storeName}に進みます。`
        }
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }} color="text.secondary">
        ・選択した商品数: {selectedProductIds.length}
        <br />
        ・設定した箱数: {inputValue || 0}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={handleDialogCancel} disabled={savingData}>
        キャンセル
      </Button>
      <Button 
        onClick={navigateToNextStore} 
        color="primary" 
        variant="contained"
        disabled={savingData}
      >
        {savingData ? '保存中...' : '次へ進む'}
      </Button>
    </DialogActions>
  </Dialog>
</Box>
  );
};

export default BoxQuantityInput;