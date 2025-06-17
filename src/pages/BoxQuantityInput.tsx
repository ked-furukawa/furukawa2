// src/pages/BoxQuantityInput.tsx

import React, { useState, useEffect, useMemo } from 'react';
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
import { formatDateToJST } from '../components/utils/formatDateToJST';
import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore';
import { resolveImportId } from '../components/utils/resolveImportId';

// 型定義
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

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
  const [allImportIds, setAllImportIds] = useState<string[]>([]);
  const [departmentId, setDepartmentId] = useState<string>(''); // 初期値を空文字列に変更
  const [currentRegion, setCurrentRegion] = useState<string>('中之島'); // 初期値は中之島

  // データキャッシュ
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [boxDataCache, setBoxDataCache] = useState<BoxData[]>([]);

  // 認証情報から部門IDを取得する部分
useEffect(() => {
  const fetchUserInfo = async () => {
    try {    
      // ユーザー属性を取得
      const attributes = await fetchUserAttributes();
      console.log('ユーザー属性:', attributes);
     
      // カスタム属性から部門IDを取得
      const userDepartmentId = attributes['custom:departmentId'];
     
      if (userDepartmentId) {
        console.log('部門ID:', userDepartmentId);
        setDepartmentId(userDepartmentId);
      } else {
        // 取得できない場合はエラーを設定
        setError('ユーザーに部門IDが設定されていません');
      }
    } catch (error) {
      console.error('ユーザー情報の取得に失敗しました:', error);
      setError('ユーザー情報の取得に失敗しました');
    }
  };
 
  fetchUserInfo();
}, []);

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
    const today = '20250609';
    setCurrentDate(today);
   
    // resolveImportId を使用して最新の importId を取得
      const importResult = await resolveImportId(today, departmentId);
      if (!importResult) {
        setError('有効な importId が見つかりませんでした');
        return;
      }
      // importId を状態として保存
      setImportId(importResult.importId);
   
    // 同じ日付の全てのImportWorkStatusを取得して複数回注文の有無を確認
    const importStatusResponse = await dataClient.models.ImportWorkStatus.list({
      filter: {
        date: { eq: today },
        departmentId: { eq: departmentId }
      }
    });
   
    const importIds = importStatusResponse.data.map(status => status.importId);
    setAllImportIds(importIds);
   
    // 最新の importId に基づく注文データを取得 (GSI_OrderDateDeptImport を使用)
    const ordersResponse = await dataClient.models.Order.listOrdersByDeptAndImport({
      date: today,
      departmentIdImportId: {
        eq: {
          departmentId: departmentId,
          importId: importResult.importId
        }
      }
    });

    console.log(`最新の注文データ (${ordersResponse.data.length}件) を取得しました`);
   
    // 同じ date×storeId×itemId で status=DONE の注文を検索
    // 修正: 正しいGSIクエリを使用
    const doneOrdersResponse = await dataClient.models.Order.listOrdersByStoreAndItem({
      date: today,
      // すべての店舗・商品の組み合わせを取得してからフィルタリング
    });
   
    console.log(`全注文データ (${doneOrdersResponse.data.length}件) を取得しました`);
   
    // JavaScript側でDONEステータスの注文をフィルタリング
    const doneOrders = doneOrdersResponse.data.filter(order =>
      order.status === StatusTemplate.DONE
    );
   
    console.log(`処理済み注文 (${doneOrders.length}件) を抽出しました`);
   
    // 処理済み注文のマップを作成（高速検索用）
    const doneOrdersMap = new Map();
    doneOrders.forEach(order => {
      const key = `${order.date}_${order.storeId}_${order.itemId}`;
      doneOrdersMap.set(key, order);
    });
   
    // 最新の注文から処理済みのものを除外
    const filteredOrders = ordersResponse.data.filter(order => {
      const key = `${order.date}_${order.storeId}_${order.itemId}`;
      return !doneOrdersMap.has(key);
    });
   
    console.log(`フィルタリング後の注文データ: ${filteredOrders.length}件`);
   
    // 型変換を行ってからステートに保存
    const typedOrders: OrderData[] = filteredOrders.map(order => ({
      importId: order.importId,
      date: order.date,
      storeId: order.storeId,
      storeName: order.storeName || '',  // null の場合は空文字列に変換
      storeTc: order.storeTc || '',      // null の場合は空文字列に変換
      itemId: order.itemId,
      itemName: order.itemName || '',    // null の場合は空文字列に変換
      itemFormalName: order.itemFormalName || undefined,
      itemCount: order.itemCount,
      departmentId: order.departmentId,
      departmentName: order.departmentName || undefined,
      status: order.status as OrderStatus || 'PENDING'
    }));
   
    // フィルタリングされた注文データを状態として保存
    setOrders(typedOrders);
   
    // 箱データを取得 (修正: 正しいGSIクエリを使用)
    const boxResponse = await dataClient.models.Box.listBoxesByDate({
      date: today,
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

  // 複数importIdの注文データを処理する関数
  function processMultipleImportOrders(allOrders: OrderData[]): OrderData[] {
    // 店舗ID + 商品IDごとに最新の注文データを保持するマップ
    const orderMap = new Map<string, OrderData>();
   
    // 全ての注文データを処理
    allOrders.forEach(order => {
      const key = `${order.storeId}_${order.itemId}`;
     
      // マップに存在しない、またはより新しいimportIdの場合は更新
      if (!orderMap.has(key) || order.importId > orderMap.get(key)!.importId) {
        orderMap.set(key, order);
      }
    });
   
    // マップから注文データの配列を作成
    const processedOrders = Array.from(orderMap.values());
   
    // itemCount が 0 の注文を除外
    return processedOrders.filter(order => order.itemCount > 0);
  }

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

// グループ化された注文データから店舗リストを抽出（物流センターごとにグループ化して店舗IDで昇順ソート）
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
   
    // 店舗の箱データをフィルタリング（データベースアクセスなし）
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
        isChecked: false // デフォルト値を設定
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
    handleStoreSelectInternal(storeId, orders, boxDataCache);
  }

  function handleQuantityUpdate() {
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
     
      // 箱データを準備
      const boxData = {
        date: currentDate,
        storeId: selectedStoreId,
        storeName: storeData.storeName,
        storeTc: storeData.storeTc,
        boxColor: selectedColor,
        boxCount: parseInt(inputValue, 10),
        departmentId: departmentId,
        status: StatusTemplate.PENDING
      };
     
      // 既存の箱データを検索（キャッシュから）
      const existingBox = boxDataCache.find(box =>
        box.date === currentDate &&
        box.storeId === selectedStoreId &&
        box.color === selectedColor &&
        box.boxCreatedBy === departmentId
      );
     
      if (existingBox) {
        // 更新（次の段階で修正）
        await dataClient.models.Box.update({
          date: currentDate,
          storeId: selectedStoreId,
          boxColor: selectedColor,
          departmentId: departmentId,
          boxCount: parseInt(inputValue, 10),
          status: StatusTemplate.CONFIRMED
        });
       
        // キャッシュも更新
        setBoxDataCache(prev => prev.map(box =>
          box.date === currentDate &&
          box.storeId === selectedStoreId &&
          box.color === selectedColor &&
          box.boxCreatedBy === departmentId
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
            storeName: newBox.data.storeName ?? undefined,
            storeTc: newBox.data.storeTc ?? undefined,
            color: newBox.data.boxColor || 'green',
            boxCount: newBox.data.boxCount,
            boxCreatedBy: newBox.data.departmentId ?? undefined,
            isChecked: newBox.data.status === StatusTemplate.CONFIRMED || newBox.data.status === StatusTemplate.DOUBLE_CHECKED
          };
          setBoxDataCache(prev => [...prev, mappedNewBox]);
        }
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
      
      // 中之島エリア完了チェック部分（Order更新は次の段階で修正）
if (newlyCompleted.length === nakanoshimaStores.length) {
  // 全中之島店舗が完了
  console.log('中之島エリアの作業が完了しました');
 
  // 中之島エリアの全注文ステータスを更新（次の段階で修正）
  const nakanoshimaStoreIds = nakanoshimaStores.map(s => s.storeId);
  const nakanoshimaOrders = orders.filter(order =>
    nakanoshimaStoreIds.includes(order.storeId)
  );
 
  // 注文ステータスを一括更新（次の段階で修正）
  const updatePromises = nakanoshimaOrders.map(order =>
    dataClient.models.Order.update({
      importId: order.importId,
      date: order.date,
      storeId: order.storeId,
      itemId: order.itemId,
      status: StatusTemplate.DONE
    })
  );
 
  await Promise.all(updatePromises);
 
  // 画面遷移
  navigateTo('SortingCheckScreen');
  return;
}

// 最後の店舗チェック部分（Order更新は次の段階で修正）
if (!nextStore) {
  // 上越エリアの全注文ステータスを更新
  const joetsuStores = allStores.filter(s => s.storeTc === '上越');
  const joetsuStoreIds = joetsuStores.map(s => s.storeId);
  const joetsuOrders = orders.filter(order =>
    joetsuStoreIds.includes(order.storeId)
  );
 
  // 注文ステータスを一括更新（次の段階で修正）
  const updatePromises = joetsuOrders.map(order =>
    dataClient.models.Order.update({
      importId: order.importId,
      date: order.date,
      storeId: order.storeId,
      itemId: order.itemId,
      status: StatusTemplate.DONE
    })
  );
 
  await Promise.all(updatePromises);
 
  // 画面遷移
  navigateTo('StoreDoubleCheckList');
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