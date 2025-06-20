// src/pages/BoxQuantityInput.tsx

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatDateToJST } from '../components/utils/formatDateToJST';
import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore';
import { resolveImportId } from '../components/utils/resolveImportId';
import { useParams } from 'react-router-dom';
import { checkPendingImportId } from '../components/utils/checkPendingImportId';

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
  const [currentRegion, setCurrentRegion] = useState<string>('中之島'); // 初期値は中之島

    const date = formatDateToJST(new Date);
  // データキャッシュ
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [boxDataCache, setBoxDataCache] = useState<BoxData[]>([]);

  const {departmentId} = useParams();

  // 状態を追加
  const [hasPendingImportId, setHasPendingImportId] = useState<boolean>(false);

  // 確定ボタンを有効にするための条件をチェックする関数
  const isConfirmButtonEnabled = useMemo(() => {
    // 条件1: 全ての商品が選択されている
    const allProductsSelected = products.length > 0 &&
      products.every(p => selectedProductIds.includes(p.id));
   
    // 条件2: 箱数が入力されている
    const hasQuantityInput = inputValue !== '';
   
    return allProductsSelected && hasQuantityInput;
  }, [selectedProductIds, inputValue, products]);

  // 完了済み店舗IDのリスト（メモ化）
  const completedStoreIds = useMemo(() =>
    completedStores.map(item => item.storeId),
    [completedStores]
  );
 
// フィルタリングされた店舗リスト（メモ化）
const filteredStores = useMemo(() => {
  const filtered = allStores.filter(store => store.storeTc === currentRegion);
  
  // 店舗IDで昇順にソート
  filtered.sort((a, b) => {
    // 数値として比較（店舗IDが数値の場合）
    const storeIdA = parseInt(a.storeId, 10);
    const storeIdB = parseInt(b.storeId, 10);
    
    return storeIdA - storeIdB;
  });
  
  return filtered;
}, [allStores, currentRegion]);

// 初期データの一括取得
useEffect(() => {
  // 部門IDが設定されるまで待機
  if (!departmentId) return;
 
  const fetchAllData = async () => {
    try {
      setLoading(true);
     
      // 固定の日付を使用（6月9日のテストデータ）
      // const today = '20250609';
      setCurrentDate(date);
     
      // resolveImportId を使用して作業用の importId を取得
      const importResult = await resolveImportId(date, departmentId);
      console.log('resolveImportId result:', importResult);
      
      if (!importResult) {
        setError('仕分け作業は完了しています');
        setLoading(false);
        return;
      }
      
      // 既存の状態をクリア
      setOrders([]);
      setBoxDataCache([]);
      setCompletedStores([]);
      setStoreData(null);
      setNextStore(null);
      setSelectedStoreId(null);
      setSelectedProductIds([]);
      setInputValue('');
      
      // importId を状態として保存
      setImportId(importResult.importId);
      
      // sortingPhase に基づいて currentRegion を設定
      if (importResult.sortingPhase === 'COMPLETED_NAKANOSHIMA') {
        // 中之島エリアが完了している場合は上越に切り替え
        setCurrentRegion('上越');
      } else {
        // それ以外の場合は中之島をデフォルトに
        setCurrentRegion('中之島');
      }
   
      // 取得した importId に基づく注文データを取得
      const ordersResponse = await dataClient.models.Order.listOrdersByDeptAndImport({
      date: currentDate,
      departmentIdImportId: {
        eq: {
          departmentId: departmentId as string,
          importId: importId as string
        }
      }
    });

      console.log('注文データ取得結果:', {
        importId: importResult.importId,
        departmentId: departmentId,
        date: date,
        totalOrders: ordersResponse.data.length,
        firstOrder: ordersResponse.data[0]
      });
   
      // 同じ date×storeId×itemId で status=DONE の注文を検索
      const doneOrdersResponse = await dataClient.models.Order.listOrdersByStoreAndItem({
        date: date,
      });
   
      console.log('処理済み注文データ取得結果:', {
        totalDoneOrders: doneOrdersResponse.data.length,
        firstDoneOrder: doneOrdersResponse.data[0]
      });
   
      // JavaScript側でDONEステータスの注文をフィルタリング
      const doneOrders = doneOrdersResponse.data.filter(order =>
        order.status === StatusTemplate.DONE && order.importId === importResult.importId
      );
   
      console.log('フィルタリング後の処理済み注文:', {
        count: doneOrders.length,
        firstDoneOrder: doneOrders[0]
      });
   
      // 処理済み注文のマップを作成（高速検索用）
      const doneOrdersMap = new Map();
      doneOrders.forEach(order => {
        const key = `${order.date}_${order.storeId}_${order.itemId}`;
        doneOrdersMap.set(key, order);
      });
   
      // 最新の注文から処理済みのものを除外
      const filteredOrders = ordersResponse.data.filter(order => {
        const key = `${order.date}_${order.storeId}_${order.itemId}`;
        const isDone = doneOrdersMap.has(key);
        if (isDone) {
          console.log('除外された注文:', {
            key,
            order,
            doneOrder: doneOrdersMap.get(key)
          });
        }
        return !isDone;
      });
   
      console.log('最終的なフィルタリング結果:', {
        totalOrders: ordersResponse.data.length,
        doneOrdersCount: doneOrders.length,
        filteredOrdersCount: filteredOrders.length,
        firstFilteredOrder: filteredOrders[0]
      });
      
      if (filteredOrders.length === 0) {
        setError('このImportIdには処理可能なデータがありません');
        setLoading(false);
        return;
      }
   
      // 型変換を行ってからステートに保存
      const typedOrders: OrderData[] = filteredOrders.map(order => ({
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
   
      // フィルタリングされた注文データを状態として保存
      setOrders(typedOrders);
   
      // 箱データを取得
      const boxResponse = await dataClient.models.Box.listBoxesByDateAndDept({
        date: date,
        departmentId: {
          eq: departmentId
        }
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
      console.log('グループ化された注文データ:', groupedOrders);
   
      const stores = extractStoresFromGroupedOrders(groupedOrders);
      console.log('抽出された店舗リスト:', stores);
   
      setAllStores(stores);
   
      // 最初の店舗を選択
      if (stores.length > 0) {
        const firstStoreId = stores[0].storeId;
        handleStoreSelectInternal(firstStoreId, typedOrders, mappedBoxData);
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
   
  fetchAllData();
}, [departmentId]);

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
  
  // 物流センターの順序を定義（中之島を先に処理）
  const tcOrder = ['中之島', '上越'];
  
  // 物流センターの順序に従って処理
  tcOrder.forEach(storeTc => {
    if (groupedOrders[storeTc]) {
      // 各物流センター内の店舗をIDで昇順ソート
      const storeIds = Object.keys(groupedOrders[storeTc]).sort((a, b) => {
        // 数値として比較（店舗IDが数値の場合）
        const storeIdA = parseInt(a, 10);
        const storeIdB = parseInt(b, 10);
        
        // 数値変換できない場合は文字列として比較
        if (isNaN(storeIdA) || isNaN(storeIdB)) {
          return a.localeCompare(b);
        }
        
        return storeIdA - storeIdB;
      });
      
      // ソートされた店舗IDに基づいて店舗リストを作成
      storeIds.forEach(storeId => {
        const orders = groupedOrders[storeTc][storeId];
        if (orders.length > 0) {
          stores.push({
            storeId: storeId,
            storeName: orders[0].storeName || '',
            storeTc: storeTc
          });
        }
      });
    }
  });
  
  return stores;
}

  // 次の店舗を取得する関数
  function getNextStore(currentStoreId: string, storeList = allStores): Store | null {
    if (!storeList.length) return null;
    const currentIndex = storeList.findIndex(s => s.storeId === currentStoreId);
    if (currentIndex === -1) return storeList[0];
    if (currentIndex < storeList.length - 1) {
      return storeList[currentIndex + 1];
    }
    return null;
  }

  // 内部用の店舗選択処理（キャッシュデータを使用）
  function handleStoreSelectInternal(
    storeId: string,
    orderData: OrderData[],
    boxData: BoxData[]
  ) {
    setSelectedStoreId(storeId);
    const filtered = orderData.filter(order => order.storeId === storeId);
    if (filtered.length === 0) {
      setError(`店舗ID: ${storeId} のデータが見つかりませんでした`);
      return;
    }
   
    const matchingOrder = filtered[0];
    const newStoreData = {
      storeId: matchingOrder.storeId,
      storeName: matchingOrder.storeName || '',
      storeTc: matchingOrder.storeTc || ''
    };
    setStoreData(newStoreData);
   
    // 店舗の箱データをフィルタリング（現在のimportIdのデータのみ）
    const storeBoxData = boxData.filter(box =>
      box.storeId === storeId &&
      box.boxCreatedBy === departmentId &&
      box.importId === importId  // importIdでフィルタリング
    );

    // 選択した店舗が完了済みかどうかをチェック
    const isCompletedStore = completedStores.some(store => store.storeId === storeId);
   
    const productList = filtered.map(order => {
      return {
        id: order.itemId,
        itemId: order.itemId,
        itemName: order.itemName || '',
        itemFormalName: order.itemFormalName || '',
        orderCount: order.itemCount,
        quantity: 0,  // 常に0から開始
        isChecked: false  // 常に未チェックから開始
      };
    });
   
    // 商品データを設定
    setProducts(productList);
   
    // 入力値をクリア
    setInputValue('');
   
        // 完了済み店舗または箱データがある場合、すべての商品を選択状態にする
    const shouldSelectAll = isCompletedStore || storeBoxData.length > 0;
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
  }

  // 店舗選択時の処理（外部向け - キャッシュデータを使用）
  function handleStoreSelect(storeId: string) {
    console.log("filteredStores",filteredStores)
    handleStoreSelectInternal(storeId, orders, boxDataCache);
  }

  async function handleQuantityUpdate() {
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) {
      setError('有効な数値を入力してください');
      return;
    }
   
    // 選択されている全ての商品の数量を更新
    setProducts(prevProducts =>
      prevProducts.map(product =>
        selectedProductIds.includes(product.id)
          ? { ...product, quantity }
          : product
      )
    );
   
    // エラーをクリア
    setError(null);

    // 最後の店舗の場合、PENDING状態のImportIdをチェック
    if (!nextStore) {
      try {
        const pendingCheck = await checkPendingImportId(currentDate, departmentId as string);
        setHasPendingImportId(pendingCheck);
      } catch (error) {
        console.error('PENDING状態のチェック中にエラーが発生しました:', error);
        setError('状態の確認中にエラーが発生しました');
        return;
      }
    }
   
    // 確認ダイアログを表示
    setShowConfirmDialog(true);
  }

  // 色変更ハンドラー
  function handleColorChange(color: BoxColor) {
    setSelectedColor(color);
  }

  // 商品の選択を処理する関数
  function handleProductSelect(productId: string) {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  }

  // テンキーからの入力を処理する関数
  function handleInputChange(value: string) {
    setInputValue(value);
  }

  // 次の店舗へ移動する関数（修正版は次の段階で実装）
  async function navigateToNextStore() {
    if (!selectedStoreId || !storeData || !importId) {
      setError('店舗情報が不足しています');
      return;
    }

    try {
      setSavingData(true);
     
      // 箱データを準備（importIdをstoreIdに組み込む）
      const boxData = {
        date: currentDate,
        storeId: `${selectedStoreId}_${importId}`, // importIdをstoreIdに組み込む
        storeName: storeData.storeName,
        storeTc: storeData.storeTc,
        boxColor: selectedColor,
        boxCount: parseInt(inputValue, 10),
        departmentId: departmentId as string
      };

      console.log('保存する箱データ:', boxData);
     
      // 新規作成のみ
      const newBox = await dataClient.models.Box.create(boxData);
      
      console.log('保存された箱データ:', newBox.data);
      
      // キャッシュに追加
      if (newBox.data) {
        const mappedNewBox: BoxData = {
          date: newBox.data.date,
          storeId: selectedStoreId, // 元のstoreIdに戻す
          storeName: newBox.data.storeName ?? undefined,
          storeTc: newBox.data.storeTc ?? undefined,
          color: newBox.data.boxColor || 'green',
          boxCount: newBox.data.boxCount,
          boxCreatedBy: newBox.data.departmentId ?? undefined,
          isChecked: true,
          importId: importId // importIdを保持
        };
        console.log('キャッシュに追加する箱データ:', mappedNewBox);
        setBoxDataCache(prev => [...prev, mappedNewBox]);
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
     
      // リフレッシュキーを更新して StoreList を再レンダリング
      setRefreshKey(prev => prev + 1);
     
      // 中之島店舗の完了チェック
      const nakanoshimaStores = allStores.filter(s => s.storeTc === '中之島');
      const completedNakanoshima = completedStores
        .filter(cs => nakanoshimaStores.some(ns => ns.storeId === cs.storeId))
        .map(cs => cs.storeId);
      const newlyCompleted = [...new Set([...completedNakanoshima, selectedStoreId])];
      
// 中之島エリア完了チェック部分
if (newlyCompleted.length === nakanoshimaStores.length) {
  try {
    // ImportWorkStatus の sortingPhase を COMPLETED_NAKANOSHIMA に更新
    await dataClient.models.ImportWorkStatus.update({
      date: currentDate,
      departmentId: departmentId as string,
      importId: importId,
      sortingPhase: 'COMPLETED_NAKANOSHIMA'
    });
    
    // 中之島エリアの全注文ステータスを更新
    const nakanoshimaStoreIds = nakanoshimaStores.map(s => s.storeId);
    
    // 最新の注文データを再取得
    const latestOrdersResponse = await dataClient.models.Order.listOrdersByDeptAndImport({
      date: currentDate,
      departmentIdImportId: {
        eq: {
          departmentId: departmentId as string,
          importId: importId
        }
      }
    });
    
    const latestOrders = latestOrdersResponse.data;
    
    // 中之島の店舗の注文をフィルタリング
    const nakanoshimaOrders = latestOrders.filter(order =>
      nakanoshimaStoreIds.includes(order.storeId)
    );
    
    // 更新対象の識別子と更新内容を明確に分ける
    const updatePromises = nakanoshimaOrders.map(async order => {
      try {
        const result = await dataClient.models.Order.update({
          importId: order.importId,
          date: order.date,
          storeId: order.storeId,
          itemId: order.itemId,
          departmentId: order.departmentId,
          status: 'DONE'
        });
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(`更新エラー: ${result.errors[0].message}`);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    });
    
    await Promise.all(updatePromises);

    // 画面遷移
    navigateTo('SortingCheckScreen');
  } catch (error) {
    console.error('中之島エリア完了処理中にエラーが発生しました:', error);
    setError('中之島エリア完了処理中にエラーが発生しました');
  }
  return;
}

// 上越エリア完了時（最後の店舗チェック部分）
if (!nextStore) {
  try {
    // ImportWorkStatus の sortingPhase を COMPLETED_JYOETSU に更新し、importProgress も DONE に更新
    await dataClient.models.ImportWorkStatus.update({
      date: currentDate,
      departmentId: departmentId as string,
      importId: importId,
      sortingPhase: 'COMPLETED_JYOETSU',
      importProgress: 'DONE'
    });
    
    // 上越エリアの全注文ステータスを更新
    const joetsuStores = allStores.filter(s => s.storeTc === '上越');
    const joetsuStoreIds = joetsuStores.map(s => s.storeId);
    
    // 最新の注文データを再取得
    const latestOrdersResponse = await dataClient.models.Order.listOrdersByDeptAndImport({
      date: currentDate,
      departmentIdImportId: {
        eq: {
          departmentId: departmentId as string,
          importId: importId
        }
      }
    });
    
    const latestOrders = latestOrdersResponse.data;
    
    // 上越の店舗の注文をフィルタリング
    const joetsuOrders = latestOrders.filter(order =>
      joetsuStoreIds.includes(order.storeId)
    );
    
    // 更新対象の識別子と更新内容を明確に分ける
    const updatePromises = joetsuOrders.map(async order => {
      try {
        const result = await dataClient.models.Order.update({
          importId: order.importId,
          date: order.date,
          storeId: order.storeId,
          itemId: order.itemId,
          departmentId: order.departmentId,
          status: 'DONE'
        });
        
        if (result.errors && result.errors.length > 0) {
          throw new Error(`更新エラー: ${result.errors[0].message}`);
        }
        
        return result;
      } catch (error) {
        throw error;
      }
    });
    
    await Promise.all(updatePromises);
    
    // PENDING状態のImportIdの有無をチェック
    const pendingCheck = await checkPendingImportId(currentDate, departmentId as string);
    setHasPendingImportId(pendingCheck);
    
    // 画面遷移
    if (pendingCheck) {
      navigateTo('SortingCheckScreen');
    } else {
      navigateTo('StoreDoubleCheckList');
    }
  } catch (error) {
    console.error('上越エリア完了処理中にエラーが発生しました:', error);
    setError('上越エリア完了処理中にエラーが発生しました');
  }
  return;
}
     
      // 次の店舗に移動（キャッシュデータを使用）
      handleStoreSelectInternal(nextStore.storeId, orders, boxDataCache);
     
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

  // 確認ダイアログをキャンセルする関数
  function handleDialogCancel() {
    setShowConfirmDialog(false);
  }

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
              stores={filteredStores.map(store => ({
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
                ? hasPendingImportId
                  ? '追加の商品があります。商品数確認画面に進みます。'
                  : '全ての商品の処理が完了しました。ダブルチェック画面に進みます。'
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