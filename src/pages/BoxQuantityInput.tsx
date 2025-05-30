// src/pages/BoxQuantityInput.tsx
import React, { useState, useEffect } from 'react';
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

// 型定義に BoxColor を追加
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
  color: BoxColor; // 色情報を追加
}

export const BoxQuantityInput: React.FC = () => {
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
  
  // 完了済み店舗IDのリスト（互換性のため）
 // const completedStoreIds = completedStores.map(item => item.storeId);

  // 全店舗データを取得する関数
  const fetchAllStores = async (): Promise<Store[]> => {
    try {
      // テスト用固定日付
      const testDate = "2025-06-02";
      
      // Order テーブルから店舗データを取得
      const { data: orderData } = await dataClient.models.Order.list({
        filter: { date: { eq: testDate } }
      });
      
      // 店舗ごとにグループ化
      const storeMap = new Map<string, Store>();
      
      orderData.forEach(order => {
        if (!storeMap.has(order.storeId)) {
          storeMap.set(order.storeId, {
            storeId: order.storeId,
            storeName: order.storeName || '不明な店舗',
            storeTc: order.storeTc || '未分類'
          });
        }
      });
      
      // 配列に変換
      const stores = Array.from(storeMap.values());
      
      // 物流センター別にグループ化
      const nakanoshimaStores = stores
        .filter(store => store.storeTc === '中之島')
        .sort((a, b) => a.storeId.localeCompare(b.storeId));
        
      const joetsuStores = stores
        .filter(store => store.storeTc === '上越')
        .sort((a, b) => a.storeId.localeCompare(b.storeId));
        
      // その他の物流センター（もしあれば）
      const otherStores = stores
        .filter(store => store.storeTc !== '中之島' && store.storeTc !== '上越')
        .sort((a, b) => a.storeId.localeCompare(b.storeId));
      
      // 中之島 → 上越 → その他 の順に結合
      return [...nakanoshimaStores, ...joetsuStores, ...otherStores];
    } catch (err) {
      console.error('店舗データの取得に失敗しました:', err);
      throw err;
    }
  };

  // 次の店舗を取得する関数
  const getNextStore = (currentStoreId: string, storeList = allStores): Store | null => {
  if (!storeList.length) return null;
  
  const currentIndex = storeList.findIndex(s => s.storeId === currentStoreId);
  if (currentIndex === -1) return storeList[0];
  
  // 次の店舗を返す
  if (currentIndex < storeList.length - 1) {
    return storeList[currentIndex + 1];
  }
  
  // 最後の店舗の場合は null を返す（または最初に戻る場合は storeList[0]）
  return null; // または循環させたい場合は storeList[0]
};

  // 店舗選択時の処理
  const handleStoreSelect = async (storeId: string) => {
    setSelectedStoreId(storeId);
    setLoading(true);
    try {
      // テスト用固定日付
      const testDate = "2025-06-02";
      
      // 選択した店舗の注文データを取得
      const { data: orderData } = await dataClient.models.Order.list({
        filter: { 
          date: { eq: testDate },
          storeId: { eq: storeId }
        }
      });
      
      if (orderData.length === 0) {
        setError('店舗データが見つかりませんでした');
        setLoading(false);
        return;
      }
      
      // 店舗データを設定
      setStoreData({
        storeId: storeId,
        storeName: orderData[0].storeName || '',
        storeTc: orderData[0].storeTc || ''
      });
      
      // 選択した店舗の箱データを取得
      const { data: boxData } = await dataClient.models.Box.list({
        filter: { 
          date: { eq: testDate },
          storeId: { eq: storeId }
        }
      });
      
      // 商品データを変換
      const productList = orderData.map(order => {
        // 対応する箱データがあるかチェック
        const box = boxData.find(b => b.boxCreatedBy === order.itemName);
        
        return {
          id: order.itemId,
          itemId: order.itemId,
          itemName: order.itemName || '',
          itemFormalName: order.itemFormalName || '',
          orderCount: order.orderCount,
          quantity: box ? box.boxCount : 0,
          isChecked: !!box // 箱データがあればチェック済み
        };
      });
      
      setProducts(productList);
      
      // 商品選択をリセット
      setSelectedProductIds([]);
      setInputValue('');
      
      // 次の店舗を取得
      if (allStores.length === 0) {
        const stores = await fetchAllStores();
        setAllStores(stores);
        setNextStore(getNextStore(storeId, stores));
      } else {
        setNextStore(getNextStore(storeId));
      }
    } catch (err) {
      console.error('店舗データの取得に失敗しました:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };
  
  // 初期データの取得
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        // 全店舗データを取得
        const stores = await fetchAllStores();
        setAllStores(stores);
        
        if (stores.length > 0) {
          // 最初の店舗を選択
          await handleStoreSelect(stores[0].storeId);
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

  // 箱数更新処理
  const handleQuantityUpdate = () => {
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
  };
  
  // 色変更ハンドラー
  const handleColorChange = (color: BoxColor) => {
    setSelectedColor(color);
  };
    
  // 商品の選択を処理する関数
  const handleProductSelect = (productId: string) => {
    setSelectedProductIds(prev => {
      // すでに選択されている場合は削除、そうでなければ追加
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // テンキーからの入力を処理する関数
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // 次の店舗へ移動する関数
    const navigateToNextStore = async () => {
      if (!nextStore || !selectedStoreId || !storeData) return;
      
      try {
        setSavingData(true);
        
        // テスト用固定日付
        const testDate = "2025-06-02";
        
        // 選択された商品と箱数のデータを作成
        for (const productId of selectedProductIds) {
          const product = products.find(p => p.id === productId);
          if (product && product.quantity > 0) {
            try {
              // 箱数を更新
              await dataClient.models.Box.update({
                date: testDate,
                storeId: selectedStoreId,
                storeName: storeData.storeName,
                storeTc: storeData.storeTc,
                color: selectedColor,
                boxCount: product.quantity,
                boxCreatedBy: product.itemName
              });
              
              console.log(`箱数を更新しました: ${product.itemName}, 数量: ${product.quantity}`);
            } catch (updateError) {
              // 更新に失敗した場合（レコードが存在しない場合）は新規作成
              console.log(`更新に失敗したため新規作成します: ${product.itemName}`);
              
              await dataClient.models.Box.create({
                date: testDate,
                storeId: selectedStoreId,
                storeName: storeData.storeName,
                storeTc: storeData.storeTc,
                color: selectedColor,
                boxCount: product.quantity,
                boxCreatedBy: product.itemName
              });
            }
          }
        }
        
        // 選択された商品の箱数の合計を計算
        const totalBoxCount = parseInt(inputValue, 10) || 0;
        
        // 完了済み店舗リストに追加（既に追加されている場合は更新）
        setCompletedStores(prev => {
          setRefreshKey(prev => prev + 1);
          const filteredStores = prev.filter(store => store.storeId !== selectedStoreId);
          return [...filteredStores, {
            storeId: selectedStoreId,
            boxCount: totalBoxCount,
            color: selectedColor
          }];
        });
        
        // 次の店舗に移動
        await handleStoreSelect(nextStore.storeId);
        
        // 選択をクリア
        setSelectedProductIds([]);
        setInputValue('');
        
      } catch (err) {
        setError('データの保存に失敗しました');
        console.error(err);
      } finally {
        setSavingData(false);
        setShowConfirmDialog(false);
      }
    };
            
          // 確認ダイアログをキャンセルする関数
          const handleDialogCancel = () => {
            setShowConfirmDialog(false);
          };

  return (
    <Box display="flex" height="100vh">
      {/* 左側：店舗リスト - 余白を小さく調整 */}
      <Box sx={{ p: 1, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
        <StoreList 
          key={refreshKey}
          selectedStoreId={selectedStoreId} 
          onSelectStore={handleStoreSelect} 
          completedStores={completedStores}
        />
      </Box>
      
      <Box flex="1" display="flex" flexDirection="column" overflow="auto" p={1}>
        <CssBaseline />
        <Container maxWidth="lg" disableGutters> {/* guttersを無効化して余白を減らす */}
          <Box 
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="flex-start"
            gap={1} 
            height="100%"
          >
            {/* 中央：統合された店舗情報と商品リスト */}
            <Box 
              width={{ xs: '100%', md: '55%' }} 
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
              />
            </Box>

            {/* 右側：テンキー */}
            <Box 
              width={{ xs: '100%', md: '43%' }}
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
            {`${storeData?.storeName || '現在の店舗'}の処理を完了し、`}
            {nextStore ? `${nextStore.storeName}に進みます。` : '最後の店舗です。'}
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