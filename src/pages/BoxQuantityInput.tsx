
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
import { StoreHeader } from '../components/StoreHeader';
import { ProductList } from '../components/ProductList';
import { Keypad } from '../components/Keypad';
import StoreList from '../components/StoreList';
import { 
  fetchStoreData, 
  fetchProducts, 
  fetchStores, 
  fetchStoresByDestination,
  updateStoreCompletionStatus
} from '../services/dataService';
import { Store, Product } from '../types';

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
  const [completedStoreIds, setCompletedStoreIds] = useState<string[]>([]);
  

  // 店舗選択時の処理
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
      
      // 商品選択をリセット
      setSelectedProductIds([]);
      setInputValue('');
      
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



// 状態管理に追加（既存のerror状態を活用）
// const [error, setError] = useState<string | null>(null); // 既存のコード

// handleQuantityUpdate関数の修正
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
  if (!nextStore) return;
  
  try {
    setSavingData(true);
    
    // 選択された商品と箱数のデータを作成
    const boxCountData: Record<string, number> = {};
    selectedProductIds.forEach(id => {
      const product = products.find(p => p.id === id);
      if (product) {
        boxCountData[id] = product.quantity;
      }
    });
    
    // データを保存（実際の実装はここで）
    // 例: await saveBoxCountData(selectedStoreId || '', boxCountData);
    console.log('保存されるデータ:', {
      storeId: selectedStoreId,
      boxCountData
    });
    
    // 現在の店舗を完了済みとしてマーク
    if (selectedStoreId) {
      // 状態を更新
      setCompletedStoreIds(prev => [...prev, selectedStoreId]);
      
      // APIを呼び出して確定状態を更新
      try {
        await updateStoreCompletionStatus(selectedStoreId, true);
      } catch (err) {
        console.error('店舗の確定状態の更新に失敗しました', err);
      }
    }
    
    // 次の店舗に移動
    await handleStoreSelect(nextStore.id);
    
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
      {/* 左側：店舗リスト */}
      <StoreList 
        selectedStoreId={selectedStoreId} 
        onSelectStore={handleStoreSelect} 
        completedStoreIds={completedStoreIds}
      />
      
      <Box flex="1" display="flex" flexDirection="column" overflow="auto">
        <CssBaseline />
        <Container maxWidth="md"> 
          <Box 
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="flex-start"
            py={1}
            height="100%"
          >
            {/* 中央：店舗情報と商品リスト */}
            <Box 
              width={{ xs: '100%', sm: '55%' }} 
              mb={{ xs: 3, sm: 0 }}
              mr={{ xs: 0, sm: 2 }}
            >
              {/* 店舗情報 */}
              <StoreHeader 
                storeNumber={storeData?.storeNumber || ''}
                storeName={storeData?.storeName || ''}
                loading={loading}
              />
              
              {/* エラーメッセージ表示 */}
              {error && (
                <Box sx={{ mb: 2, p: 1, bgcolor: 'error.light', color: 'error.contrastText', borderRadius: 1 }}>
                  {error}
                </Box>
              )}
              
              {/* 商品リスト */}
              
              <ProductList 
                products={products}
                selectedProductIds={selectedProductIds}
                onProductSelect={handleProductSelect} // この関数が定義されていることを確認
                loading={loading}
                error={null}
              />
            </Box>

            {/* 右側：テンキー */}
            <Box width={{ xs: '100%', sm: '40%' }}>
              <Keypad 
                value={inputValue}
                onChange={handleInputChange}
                onEnter={handleQuantityUpdate}
                onClear={() => setInputValue('')}
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