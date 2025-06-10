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
import { OrderData, BoxData, StatusTemplate } from '../types';
import { formatDateToJST } from '../components/utils/formatDateToJST';
import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore';
import { resolveImportId } from '../components/utils/resolveImportId';

// 型定義
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

// Amplify クライアントの生成
const dataClient = generateClient<Schema>();

// 定数の抽出
const TEST_DEPARTMENT_ID = "test";
// const TEST_DEPARTMENT_NAME = "test部門";

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
  const [currentDate, setCurrentDate] = useState<string>('');
  const [importId, setImportId] = useState<string | null>(null);

  // データキャッシュ
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [boxDataCache, setBoxDataCache] = useState<BoxData[]>([]);

  // 確定ボタンを有効にするための条件をチェックする関数を追加
  const isConfirmButtonEnabled = useMemo(() => {
    // 条件1: 商品が選択されている
    const hasSelectedProducts = selectedProductIds.length > 0;
    // 条件2: 箱数が入力されている
    const hasQuantityInput = inputValue !== '';
    // 条件3: すべての商品がチェックされている
    const allProductsChecked = products.every(p => p.isChecked || selectedProductIds.includes(p.id));
    
    return hasSelectedProducts && hasQuantityInput && allProductsChecked;
  }, [selectedProductIds, inputValue, products]);

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
        
        // 現在の日付を取得
        const today = formatDateToJST(new Date());
        setCurrentDate(today);
        
        // importId を取得
        const latestImportId = await resolveImportId(today, TEST_DEPARTMENT_ID);
        
        if (!latestImportId) {
          setError('有効な作業データが見つかりませんでした');
          setLoading(false);
          return;
        }
        
        setImportId(latestImportId);
        
        // 作業開始時にステータスを更新
        await dataClient.models.ImportWorkStatus.update({
          date: today,
          departmentId: TEST_DEPARTMENT_ID,
          importId: latestImportId,
          status: StatusTemplate.IN_PROGRESS
        });
        
        // GSIを使用して効率的にデータを取得
        const [ordersResponse, boxResponse] = await Promise.all([
          // GSI_OrderDateDeptImport を使用して Order データを取得
          dataClient.models.Order.listOrdersByDeptAndImport({
            date: today,
            departmentIdImportId: { 
              beginsWith: { 
                departmentId: TEST_DEPARTMENT_ID,
                importId: latestImportId 
              }
            }
          }),
          // GSI_BoxDateDept を使用して Box データを取得
          dataClient.models.Box.listBoxesByDate({
            date: today,
            departmentId: { eq: TEST_DEPARTMENT_ID }
          })
        ]);
        
  // データをキャッシュ
setOrders(ordersResponse.data as OrderData[]);

// BoxData の型と実際のデータ構造の違いを解消するためにマッピング
const mappedBoxData = boxResponse.data.map(box => ({
  date: box.date,
  storeId: box.storeId,
  storeName: box.storeName ?? undefined, // null を undefined に変換
  storeTc: box.storeTc ?? undefined, // null を undefined に変換
  color: box.boxColor || 'green', // null/undefined の場合はデフォルト値
  boxCount: box.boxCount,
  boxCreatedBy: box.departmentId ?? undefined, // null を undefined に変換
  isChecked: box.status === StatusTemplate.CONFIRMED || box.status === StatusTemplate.DOUBLE_CHECKED
}));

setBoxDataCache(mappedBoxData);
        
        // 完了済み店舗の処理
        processCompletedStores(mappedBoxData);
        
        // 店舗リストの作成
        const groupedOrders = groupOrdersByTcAndStore(ordersResponse.data as OrderData[]);
        const stores = extractStoresFromGroupedOrders(groupedOrders);
        setAllStores(stores);
        
        // 最初の店舗を選択
        if (stores.length > 0) {
          const firstStoreId = stores[0].storeId;
          handleStoreSelectInternal(firstStoreId, ordersResponse.data as OrderData[], mappedBoxData);
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

  // 完了済み店舗の処理を分離
  const processCompletedStores = (boxData: BoxData[]) => {
    const storeBoxMap = new Map<string, CompletedStore>();
    
    boxData.forEach(box => {
      if (!storeBoxMap.has(box.storeId)) {
        storeBoxMap.set(box.storeId, {
          storeId: box.storeId,
          boxCount: 0,
          color: box.color as BoxColor || 'green'
        });
      }
      // 箱数を加算
      const storeData = storeBoxMap.get(box.storeId)!;
      storeData.boxCount += box.boxCount;
    });
    
    // 完了済み店舗リストを設定
    setCompletedStores(Array.from(storeBoxMap.values()));
  };

  // グループ化された注文データから店舗リストを抽出
  const extractStoresFromGroupedOrders = (
    groupedOrders: { [storeTc: string]: { [storeId: string]: OrderData[] } }
  ): Store[] => {
    const stores: Store[] = [];
    
    Object.keys(groupedOrders).forEach(storeTc => {
      Object.keys(groupedOrders[storeTc]).forEach(storeId => {
        const orders = groupedOrders[storeTc][storeId];
        if (orders.length > 0) {
          stores.push({
            storeId: storeId,
            storeName: orders[0].storeName || '',
            storeTc: storeTc
          });
        }
      });
    });
    
    return stores;
  };

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
    orderData: OrderData[],
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
    const storeBoxData = boxData.filter(box => 
      box.storeId === storeId && 
      box.boxCreatedBy === TEST_DEPARTMENT_ID
    );
    
    // 選択した店舗が完了済みかどうかをチェック
    const isCompletedStore = completedStores.some(store => store.storeId === storeId);
    
    const productList = filtered.map(order => {
      // 該当する箱データを検索
      const box = storeBoxData.find(b => b.boxCreatedBy === TEST_DEPARTMENT_ID);
      // 完了済みまたは箱データがある場合はチェック済みとする
      const shouldBeChecked = isCompletedStore || !!box || order.status === StatusTemplate.DONE;
      
      return {
        id: order.itemId,
        itemId: order.itemId,
        itemName: order.itemName || '',
        itemFormalName: order.itemFormalName || '',
        orderCount: order.itemCount, // itemCount に変更
        quantity: box ? box.boxCount : 0,
        isChecked: shouldBeChecked
      };
    });
    
    // 商品データを設定
    setProducts(productList);
    
    // 入力値をクリア
    setInputValue('');
    
    // 完了済み店舗または箱データがある場合、すべての商品を選択状態にする
    const shouldSelectAll = isCompletedStore || productList.some(p => p.isChecked);
    if (shouldSelectAll) {
      const allProductIds = productList.map(p => p.id);
      setSelectedProductIds(allProductIds);
    } else {
      // 選択をクリア
      setSelectedProductIds([]);
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

  const handleQuantityUpdate = useCallback(() => {
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) return;
    
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
    if (!selectedStoreId || !storeData || !importId) return;

    try {
      setSavingData(true);
      
      // 選択された商品と箱数のデータを作成
      const boxUpdatePromises = selectedProductIds.map(async (productId) => {
        const product = products.find(p => p.id === productId);
        if (product && parseInt(inputValue, 10) > 0) {
          // 箱データを準備
          const boxData = {
            date: currentDate,
            storeId: selectedStoreId,
            storeName: storeData.storeName,
            storeTc: storeData.storeTc,
            boxColor: selectedColor, // boxColor を使用
            boxCount: parseInt(inputValue, 10),
            departmentId: TEST_DEPARTMENT_ID, // departmentId を使用
            status: StatusTemplate.PENDING
          };
          
          try {
            // 既存の箱データを検索（キャッシュから）
            const existingBox = boxDataCache.find(box => 
              box.date === currentDate && 
              box.storeId === selectedStoreId && 
              box.color === selectedColor &&
              box.boxCreatedBy === TEST_DEPARTMENT_ID
            );
            
            if (existingBox) {
              // 更新
              await dataClient.models.Box.update({
                date: currentDate,
                storeId: selectedStoreId,
                boxColor: selectedColor, // boxColor を使用
                departmentId: TEST_DEPARTMENT_ID, // departmentId を使用
                boxCount: parseInt(inputValue, 10),
                status: StatusTemplate.CONFIRMED
              });
              
              // キャッシュも更新
              setBoxDataCache(prev => prev.map(box => 
                box.date === currentDate && 
                box.storeId === selectedStoreId && 
                box.color === selectedColor &&
                box.boxCreatedBy === TEST_DEPARTMENT_ID
                  ? { ...box, boxCount: parseInt(inputValue, 10), isChecked: true }
                  : box
              ));
            } else {
          // 新規作成
const newBox = await dataClient.models.Box.create(boxData);

// キャッシュに追加
if (newBox.data) {
  const mappedNewBox: BoxData = {
    date: newBox.data.date,
    storeId: newBox.data.storeId,
    storeName: newBox.data.storeName ?? undefined, // null を undefined に変換
    storeTc: newBox.data.storeTc ?? undefined, // null を undefined に変換
    color: newBox.data.boxColor || 'green', // null/undefined の場合はデフォルト値
    boxCount: newBox.data.boxCount,
    boxCreatedBy: newBox.data.departmentId ?? undefined, // null を undefined に変換
    isChecked: newBox.data.status === StatusTemplate.CONFIRMED || newBox.data.status === StatusTemplate.DOUBLE_CHECKED
  };
  setBoxDataCache(prev => [...prev, mappedNewBox]);
}
            }
            
            // 対応する注文のステータスを更新
            await Promise.all(
              orders
                .filter(order => order.storeId === selectedStoreId && order.itemId === productId)
                .map(order => 
                  dataClient.models.Order.update({
                    importId: order.importId,
                    date: order.date,
                    storeId: order.storeId,
                    itemId: order.itemId,
                    status: StatusTemplate.DONE
                  })
                )
            );
            
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
        // ImportWorkStatus を更新
        await dataClient.models.ImportWorkStatus.update({
          date: currentDate,
          departmentId: TEST_DEPARTMENT_ID,
          importId: importId,
          status: StatusTemplate.DONE
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
    navigateTo,
    currentDate,
    importId
  ]);

  // 確認ダイアログをキャンセルする関数（メモ化）
  const handleDialogCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  return (
    <Box display="flex" height="100vh">
      <Box flex="1" display="flex" flexDirection="column" justifyContent="center" alignItems="center"
        sx={{pl: 10, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
        <CssBaseline />
        <Container maxWidth="lg" disableGutters>
             
          <Box 
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            justifyContent="flex-start"
            alignItems="flex-start"
            gap={-1} 
            height="100%"
          >
            {/* 左側：店舗リスト */}
            <Box sx={{pr:0.2, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
              <StoreList
                key={refreshKey}
                selectedStoreId={selectedStoreId}
                onSelectStore={handleStoreSelect}
                completedStores={completedStores}
              />
            </Box>
            {/* 中央：統合された店舗情報と商品リスト */}
            <Box sx={{px:3}}
              width={{ xs: '100%', md: '35%' }} 
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
              width={{ xs: '100%', md: '25%' }}
              height={{ xs: 'auto', md: '600px' }}
            >
              <Keypad 
                value={inputValue}
                onChange={handleInputChange}
                onEnter={handleQuantityUpdate}
                onClear={() => setInputValue('')}
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
                disableEnterButton={!isConfirmButtonEnabled}
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