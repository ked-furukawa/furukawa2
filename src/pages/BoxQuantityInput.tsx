// src/pages/BoxQuantityInput.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { fetchUserAttributes } from 'aws-amplify/auth';
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
import { OrderData, BoxData, StatusTemplate, OrderStatus } from '../types';
// import { formatDateToJST } from '../components/utils/formatDateToJST';
import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore';
import { useParams } from 'react-router-dom';
import { resolveImportId } from '../components/utils/resolveImportId';

// 型定義
type BoxColor = 'green' | 'red' | 'blue' | 'orange';

// Amplify クライアントの生成
const dataClient = generateClient<Schema>();

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

// StoreProductPanelをメモ化
const MemoizedStoreProductPanel = React.memo(StoreProductPanel);

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
  const [importId, setImportId] = useState<string>(''); // null から '' に変更
  const [currentRegion, setCurrentRegion] = useState<string>('中之島');
  const [sortingPhase, setSortingPhase] = useState<string>('PENDING');

  // データキャッシュ
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [boxDataCache, setBoxDataCache] = useState<BoxData[]>([]);
  const [productDataCache, setProductDataCache] = useState<{ [storeId: string]: Product[] }>({});
  const [storeDataCache, setStoreDataCache] = useState<{ [storeId: string]: Store }>({});

  // 商品リストと選択IDリストをメモ化
  const memoizedProducts = useMemo(() => products, [products]);
  const memoizedSelectedProductIds = useMemo(() => selectedProductIds, [selectedProductIds]);
  const memoizedCompletedStoreIds = useMemo(() => completedStores.map(store => store.storeId), [completedStores]);

  const {departmentId} = useParams(); //部門ID

  // 確定ボタンを有効にするための条件をチェックする関数
  const isConfirmButtonEnabled = useMemo(() => {
    // 条件1: 全ての商品が選択されている
    const allProductsSelected = products.length > 0 && 
      products.every(p => selectedProductIds.includes(p.id));
    
    // 条件2: 箱数が入力されている
    const hasQuantityInput = inputValue !== '';
    
    return allProductsSelected && hasQuantityInput;
  }, [selectedProductIds, inputValue, products]);

  // 商品データの処理を行う関数
  function processProductData(
    storeId: string,
    orderData: OrderData[],
    boxData: BoxData[]
  ): Product[] {
    // キャッシュにデータがある場合はそれを使用
    if (productDataCache[storeId]) {
      return productDataCache[storeId];
    }

    const filtered = orderData.filter(order => order.storeId === storeId);
    if (filtered.length === 0) {
      setError(`店舗ID: ${storeId} のデータが見つかりませんでした`);
      return [];
    }
    
    const matchingOrder = filtered[0];
    const newStoreData = {
      storeId: matchingOrder.storeId,
      storeName: matchingOrder.storeName || '',
      storeTc: matchingOrder.storeTc || ''
    };

    // 店舗データをキャッシュに保存
    setStoreDataCache(prev => ({
      ...prev,
      [storeId]: newStoreData
    }));
    setStoreData(newStoreData);
    
    // 店舗の箱データをフィルタリング
    const storeBoxData = boxData.filter(box => 
      box.storeId === storeId && 
      box.boxCreatedBy === departmentId
    );
    
    // 選択した店舗が完了済みかどうかをチェック
    const isCompletedStore = completedStores.some(store => store.storeId === storeId);
    
    const productList = filtered.map(order => {
      // 該当する箱データを検索
      const box = storeBoxData.find(b => b.boxCreatedBy === departmentId);
      
      return {
        id: order.itemId,
        itemId: order.itemId,
        itemName: order.itemName || '',
        itemFormalName: order.itemFormalName || '',
        orderCount: order.itemCount,
        quantity: box ? box.boxCount : 0,
        isChecked: false
      };
    });

    // 商品データをキャッシュに保存
    setProductDataCache(prev => ({
      ...prev,
      [storeId]: productList
    }));
    
    // 完了済み店舗または箱データがある場合、すべての商品を選択状態にする
    if (isCompletedStore || storeBoxData.length > 0) {
      const allProductIds = productList.map(p => p.id);
      setSelectedProductIds(allProductIds);
    } else {
      setSelectedProductIds([]);
    }
    
    return productList;
  }

  // 店舗選択の処理を行う関数
  function handleStoreSelection(
    storeId: string,
    orderData: OrderData[],
    boxData: BoxData[]
  ) {
    setSelectedStoreId(storeId);
    setInputValue('');
    
    // 店舗データがキャッシュにある場合はそれを使用
    if (storeDataCache[storeId]) {
      setStoreData(storeDataCache[storeId]);
    }
    
    const productList = processProductData(storeId, orderData, boxData);
    setProducts(productList);
    
    // 次の店舗を設定
    if (allStores.length > 0) {
      const nextStoreObj = getNextStore(storeId);
      setNextStore(nextStoreObj);
      
      // リージョンの切り替え
      if (nextStoreObj && nextStoreObj.storeTc !== currentRegion) {
        setCurrentRegion(nextStoreObj.storeTc);
      }
    }
  }

  // 内部用の店舗選択処理（キャッシュデータを使用）
  function handleStoreSelectInternal(
    storeId: string,
    orderData: OrderData[],
    boxData: BoxData[]
  ) {
    handleStoreSelection(storeId, orderData, boxData);
  }

  // 店舗選択時の処理（外部向け - キャッシュデータを使用）
  function handleStoreSelect(storeId: string) {
    handleStoreSelection(storeId, orders, boxDataCache);
  }

  // 初期データの一括取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!departmentId) {
          setError('ユーザーに部門IDが設定されていません');
          return;
        }
        
        // 現在の日付を取得（実際の運用では当日の日付を使用）
        // テスト用に固定日付を使用
        const today = '20250609';
        setCurrentDate(today);
        
        // resolveImportId を使用して最新の importId とワークフロー状態を取得
        const importResult = await resolveImportId(today, departmentId);
        if (!importResult || !importResult.importId) {
          setError('有効な importId が見つかりませんでした');
          return;
        }
        
        // importId とワークフロー状態を状態として保存
        if (importResult.importId) {
          setImportId(importResult.importId);
        }
        if (importResult.sortingPhase) {
          setSortingPhase(importResult.sortingPhase);
        }
        
        // 作業フェーズに応じた画面遷移
        if (importResult.sortingPhase === 'COMPLETED_NAKANOSHIMA') {
          navigateTo('SortingCheckScreen');
          return;
        } else if (importResult.sortingPhase === 'COMPLETED_JYOETSU') {
          navigateTo('StoreDoubleCheckList');
          return;
        }
        
        // 最新の importId に基づく注文データを取得
        const ordersResponse = await dataClient.models.Order.listOrdersByDeptAndImport({
          date: today,
          departmentIdImportId: {
            eq: {
              departmentId: departmentId,
              importId: importResult.importId
            }
          }
        });
        
        // JavaScript側でPENDINGステータスの注文をフィルタリング
        const pendingOrders = ordersResponse.data.filter(order => 
          order.status === StatusTemplate.PENDING
        );
        
        // 型変換を行ってからステートに保存
        const typedOrders: OrderData[] = pendingOrders.map(order => ({
          importId: order.importId,
          date: order.date,
          storeId: order.storeId,
          storeName: order.storeName || '',
          storeTc: order.storeTc || '',
          itemId: order.itemId,
          itemName: order.itemName || '',
          itemFormalName: order.itemFormalName || undefined,
          itemCount: order.itemCount,
          departmentId: order.departmentId,
          departmentName: order.departmentName || undefined,
          status: order.status as OrderStatus || 'PENDING'
        }));
        
        // 注文データを状態として保存
        setOrders(typedOrders);
        
        // 箱データを取得
        const boxResponse = await dataClient.models.Box.listBoxesByDate({
          date: today,
          departmentId: { eq: departmentId }
        });
        
        // BoxData の型と実際のデータ構造の違いを解消するためにマッピング
        const mappedBoxData = boxResponse.data.map(box => ({
          date: box.date,
          storeId: box.storeId,
          storeName: box.storeName ?? undefined,
          storeTc: box.storeTc ?? undefined,
          color: box.boxColor || 'green',
          boxCount: box.boxCount,
          boxCreatedBy: box.departmentId ?? undefined,
          isChecked: box.status === StatusTemplate.CONFIRMED || box.status === StatusTemplate.DOUBLE_CHECKED
        }));
        setBoxDataCache(mappedBoxData);
        
        // 完了済み店舗の処理
        processCompletedStores(mappedBoxData);
        
        // 店舗リストの作成
        const groupedOrders = groupOrdersByTcAndStore(typedOrders);
        const stores = extractStoresFromGroupedOrders(groupedOrders);
        
        setAllStores(stores);
        
        // 最初の店舗を選択
        if (stores.length > 0) {
          const firstStoreId = stores[0].storeId;
          handleStoreSelection(firstStoreId, typedOrders, mappedBoxData);
          setNextStore(getNextStore(firstStoreId, stores));
        } else {
          setError('この部門に割り当てられた店舗がありません');
        }
      } catch (err) {
        console.error('データの読み込みに失敗しました:', err);
        setError('データの読み込みに失敗しました: ' + (err instanceof Error ? err.message : String(err)));
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [navigateTo]);

  // 完了済み店舗の処理を分離
  function processCompletedStores(boxData: BoxData[]) {
    const storeBoxMap = new Map<string, CompletedStore>();
    
    // 箱データがある店舗のみを完了済みとして扱う
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
    const completed = Array.from(storeBoxMap.values());
    console.log('完了済み店舗リスト:', completed);
    setCompletedStores(completed);
  }

  // グループ化された注文データから店舗リストを抽出
  function extractStoresFromGroupedOrders(
    groupedOrders: { [storeTc: string]: { [storeId: string]: OrderData[] } }
  ): Store[] {
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
  }

  // 次の店舗を取得する関数
  function getNextStore(currentStoreId: string, storeList = allStores): Store | null {
    // 現在のリージョンの店舗のみをフィルタリング
    const regionStores = storeList.filter(store => store.storeTc === currentRegion);
    
    if (!regionStores.length) return null;

    const currentIndex = regionStores.findIndex(s => s.storeId === currentStoreId);
    if (currentIndex === -1) return regionStores[0];
    if (currentIndex < regionStores.length - 1) {
      return regionStores[currentIndex + 1];
    }
    
    // 現在のリージョンの最後の店舗の場合
    if (currentRegion === '中之島') {
      // 次のリージョンの最初の店舗を返す
      const joetsuStores = storeList.filter(store => store.storeTc === '上越');
      return joetsuStores.length > 0 ? joetsuStores[0] : null;
    }
    
    return null;
  }

  // 商品選択ハンドラーをメモ化
  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }, []);

  // 色変更ハンドラーを最適化
  const handleColorChange = useCallback((color: BoxColor) => {
    setSelectedColor(color);
  }, []);

  // テンキーからの入力を処理する関数を最適化
  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  // 確認ダイアログをキャンセルする関数を最適化
  const handleDialogCancel = useCallback(() => {
    setShowConfirmDialog(false);
  }, []);

  // 数量更新ハンドラーを最適化
  const handleQuantityUpdate = useCallback(() => {
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) {
      setError('有効な数値を入力してください');
      return;
    }
    
    setProducts(prevProducts => 
      prevProducts.map(product => 
        selectedProductIds.includes(product.id) 
          ? { ...product, quantity } 
          : product
      )
    );
    
    setError(null);
    setShowConfirmDialog(true);
  }, [inputValue, selectedProductIds]);

  // エリア完了状態を更新する関数
  async function updateSortingPhase(newPhase: string) {
    if (!importId || !currentDate || !departmentId) return;
    
    try {
      // ImportWorkStatus テーブルを更新
      await dataClient.models.ImportWorkStatus.update({
        date: currentDate,
        departmentId: departmentId,
        importId: importId,
        sortingPhase: newPhase
      });
      
      // ローカル状態も更新
      setSortingPhase(newPhase);
      
      console.log(`作業フェーズを ${newPhase} に更新しました`);
    } catch (err) {
      console.error('作業フェーズの更新に失敗しました:', err);
    }
  }

  // 次の店舗へ移動する関数
  async function navigateToNextStore() {
    if (!selectedStoreId || !storeData || !importId || !currentDate) {
      setError('店舗情報が不足しています');
      return;
    }

    try {
      setSavingData(true);
      
      // 箱データを準備
      const boxData = {
        date: currentDate,
        storeId: selectedStoreId,
        storeName: storeData.storeName,
        storeTc: storeData.storeTc,
        boxColor: selectedColor,
        boxCount: parseInt(inputValue, 10),
        departmentId: departmentId as string,
        status: StatusTemplate.CONFIRMED // 直接 CONFIRMED に設定
      };
      
      // 既存の箱データを検索（DynamoDBから直接）
      const existingBoxResponse = await dataClient.models.Box.get({
        date: currentDate,
        storeId: selectedStoreId,
        boxColor: selectedColor,
        departmentId: departmentId as string
      });
      
      if (existingBoxResponse.data) {
        // 更新
        await dataClient.models.Box.update({
          date: currentDate,
          storeId: selectedStoreId,
          boxColor: selectedColor,
          departmentId: departmentId as string,
          boxCount: parseInt(inputValue, 10),
          status: StatusTemplate.CONFIRMED
        });
        
        console.log('既存の箱データを更新しました');
      } else {
        // 新規作成
        await dataClient.models.Box.create(boxData);
        console.log('新しい箱データを作成しました');
      }
      
      // 完了済み店舗リストに追加（既に追加されている場合は更新）
      setCompletedStores(prev => {
        const filteredStores = prev.filter(store => store.storeId !== selectedStoreId);
        return [...filteredStores, {
          storeId: selectedStoreId,
          boxCount: parseInt(inputValue, 10) || 0,
          color: selectedColor
        }];
      });
      
      // 箱データキャッシュを更新
      const newBoxData: BoxData = {
        date: currentDate,
        storeId: selectedStoreId,
        storeName: storeData.storeName,
        storeTc: storeData.storeTc,
        color: selectedColor,
        boxCount: parseInt(inputValue, 10),
        boxCreatedBy: departmentId,
        isChecked: true
      };
      
      setBoxDataCache(prev => {
        // 既存のデータを削除
        const filtered = prev.filter(box => 
          !(box.storeId === selectedStoreId && 
            box.color === selectedColor && 
            box.boxCreatedBy === departmentId)
        );
        // 新しいデータを追加
        return [...filtered, newBoxData];
      });
      
      // リフレッシュキーを更新して StoreList を再レンダリング
      setRefreshKey(prev => prev + 1);
      
      // 現在のリージョンの店舗リスト
      const regionStores = allStores.filter(s => s.storeTc === currentRegion);
      
      // 完了済み店舗のリスト（現在のリージョンのみ）
      const completedRegionStores = completedStores
        .filter(cs => regionStores.some(rs => rs.storeId === cs.storeId))
        .map(cs => cs.storeId);
      
      // 現在の店舗を追加
      const newlyCompleted = [...new Set([...completedRegionStores, selectedStoreId])];
      
      // リージョン完了チェック
      const isRegionCompleted = newlyCompleted.length === regionStores.length;
      
      // 中之島エリア完了チェック
      if (currentRegion === '中之島' && isRegionCompleted) {
        console.log('中之島エリアの作業が完了しました');
        
        // 中之島エリアの全注文ステータスを更新
        const nakanoshimaStoreIds = regionStores.map(s => s.storeId);
        
        // 注文ステータスを一括更新（バッチ処理）
        const updatePromises = orders
          .filter(order => nakanoshimaStoreIds.includes(order.storeId))
          .map(order => 
            dataClient.models.Order.update({
              importId: order.importId,
              date: order.date,
              storeId: order.storeId,
              itemId: order.itemId,
              status: StatusTemplate.DONE
            })
          );
        
        await Promise.all(updatePromises);
        
        // 作業フェーズを更新
        await updateSortingPhase('COMPLETED_NAKANOSHIMA');
        
        // 画面遷移
        navigateTo('SortingCheckScreen');
        return;
      }
      
      // 上越エリア完了チェック
      if (currentRegion === '上越' && isRegionCompleted) {
        console.log('上越エリアの作業が完了しました');
        
        // 上越エリアの全注文ステータスを更新
        const joetsuStoreIds = regionStores.map(s => s.storeId);
        
        // 注文ステータスを一括更新（バッチ処理）
        const updatePromises = orders
          .filter(order => joetsuStoreIds.includes(order.storeId))
          .map(order => 
            dataClient.models.Order.update({
              importId: order.importId,
              date: order.date,
              storeId: order.storeId,
              itemId: order.itemId,
              status: StatusTemplate.DONE
            })
          );
        
        await Promise.all(updatePromises);
        
        // 作業フェーズを更新
        await updateSortingPhase('COMPLETED_JYOETSU');
        
        // 画面遷移
        navigateTo('StoreDoubleCheckList');
        return;
      }
      
      // 次の店舗がない場合
      if (!nextStore) {
        // 現在のリージョンが中之島の場合、上越に切り替え
        if (currentRegion === '中之島') {
          const joetsuStores = allStores.filter(s => s.storeTc === '上越');
          if (joetsuStores.length > 0) {
            setCurrentRegion('上越');
            handleStoreSelectInternal(joetsuStores[0].storeId, orders, [...boxDataCache, newBoxData]);
          } else {
            // 上越店舗がない場合は完了
            navigateTo('StoreDoubleCheckList');
          }
        } else {
          // 上越の最後の店舗の場合は完了
          navigateTo('StoreDoubleCheckList');
        }
        return;
      }
      
      // 次の店舗に移動
      handleStoreSelectInternal(nextStore.storeId, orders, [...boxDataCache, newBoxData]);
      
      // 選択をクリア
      setInputValue('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`データの保存に失敗しました: ${errorMessage}`);
      console.error('データ保存エラー:', err);
    } finally {
      setSavingData(false);
      setShowConfirmDialog(false);
    }
  }

  // sortingPhase を使用する箇所を追加（未使用変数エラー対策）
  useEffect(() => {
    if (sortingPhase === 'DONE') {
      console.log('全ての作業が完了しています');
    }
  }, [sortingPhase]);

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
                stores={allStores.map(store => ({
                  id: store.storeId,
                  storeNumber: store.storeId,
                  storeName: store.storeName,
                  storeTc: store.storeTc
                }))}
              />
            </Box>
            {/* 中央：統合された店舗情報と商品リスト */}
            <Box sx={{px:3}}
              width={{ xs: '100%', md: '35%' }} 
              height={{ xs: 'auto', md: '600px' }}
            >
              {storeData && (
                <MemoizedStoreProductPanel
                  key={storeData.storeId}
                  storeNumber={storeData.storeId}
                  storeName={storeData.storeName}
                  products={memoizedProducts}
                  selectedProductIds={memoizedSelectedProductIds}
                  onProductSelect={handleProductSelect}
                  loading={loading}
                  error={error}
                  completedStoreIds={memoizedCompletedStoreIds}
                />
              )}
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