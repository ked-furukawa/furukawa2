// src/pages/StoreProductPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Box, 
  Container, 
  Typography, 
  Button, 
  Paper,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

import { StoreHeader } from '../components/sakurai/StoreHeader';
import { ProductList } from '../components/sakurai/ProductList';
import { Keypad } from '../components/sakurai/Keypad';
import { 
  fetchStoreData, 
  fetchProducts, 
  fetchStores, 
  updateProductCheckStatus 
} from '../services/dataService';
import { Store, Product, ApiResponse } from '../types';

/**
 * 店舗商品ページのプロップス
 */
interface StoreProductPageProps {
  // 必要に応じてプロップスを追加
}

/**
 * 店舗商品ページコンポーネント
 * 特定の店舗の商品リストを表示し、箱数入力と次店舗への遷移を管理
 */
const StoreProductPage: React.FC<StoreProductPageProps> = () => {
  // React Router Hooks
  const navigate = useNavigate();
  const { storeId } = useParams<{ storeId: string }>();
  
  // 状態管理
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [nextStore, setNextStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [boxCount, setBoxCount] = useState<string>('');
  const [processedProducts, setProcessedProducts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [savingData, setSavingData] = useState<boolean>(false);

  // 店舗データとその商品データを取得
  useEffect(() => {
    const loadStoreData = async () => {
      if (!storeId) {
        setError('店舗IDが指定されていません');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // 現在の店舗データを取得
        const store = await fetchStoreData(storeId);
        setCurrentStore(store);
        
        // 商品データの取得
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
        setError('データの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [storeId]);

  // 商品選択時の処理
  const handleProductSelect = (productId: string) => {
    // すでに選択されている商品をもう一度選択した場合は選択解除
    if (selectedProductId === productId) {
      setSelectedProductId(null);
      return;
    }
    
    setSelectedProductId(productId);
    
    // すでに処理済みの商品の場合、その箱数を表示
    if (productId in processedProducts) {
      setBoxCount(processedProducts[productId].toString());
    } else {
      setBoxCount('');
    }
  };

  // 箱数入力の処理
  const handleBoxCountChange = (value: string) => {
    // 数字のみ許可（先頭の0も許可）
    if (/^\d*$/.test(value)) {
      setBoxCount(value);
    }
  };

  // 箱数確定の処理
  const handleBoxCountConfirm = () => {
    if (!selectedProductId || boxCount === '') return;
    
    const count = parseInt(boxCount, 10);
    if (isNaN(count)) return;
    
    // 箱数を記録
    setProcessedProducts(prev => ({
      ...prev,
      [selectedProductId]: count
    }));
    
    // 商品のチェック状態を更新
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === selectedProductId 
          ? { ...product, isChecked: true } 
          : product
      )
    );
    
    // APIを呼び出して商品のチェック状態を更新（エラーハンドリングを簡略化）
    updateProductCheckStatus(selectedProductId, true)
      .catch(err => console.error('チェック状態の更新に失敗しました', err));
    
    // 入力をリセット
    setSelectedProductId(null);
    setBoxCount('');
  };

  // 箱数クリアの処理
  const handleBoxCountClear = () => {
    setBoxCount('');
  };

  // 次の店舗への遷移を確認
  const handleNextStoreConfirm = () => {
    // 少なくとも1つの商品が処理されているか確認
    if (Object.keys(processedProducts).length === 0) {
      setError('少なくとも1つの商品の箱数を入力してください');
      return;
    }
    
    setShowConfirmDialog(true);
  };

// src/pages/StoreProductPage.tsx の navigateToNextStore 関数内
/**
 * 店舗の箱数データを保存する
 * @param storeId 店舗ID
 * @param boxCounts 商品IDと箱数のマッピング
 * @returns Promise<ApiResponse<any>> 保存結果
 */
const saveBoxCountData = async (
  storeId: string,
  boxCounts: Record<string, number>
): Promise<ApiResponse<any>> => {
  // モックデータを返します
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`店舗 ${storeId} の箱数データを保存しました:`, boxCounts);
      resolve({
        success: true,
        data: {
          storeId,
          boxCounts,
          updatedAt: new Date()
        },
        message: '箱数データを保存しました'
      });
    }, 800);
  });
};
// 次の店舗へ遷移
const navigateToNextStore = async () => {
  if (!nextStore) return;
  
  try {
    setSavingData(true);
    
    // 箱数データを保存
    await saveBoxCountData(storeId || '', processedProducts);
    
    // 遷移先のパスを構築
    navigate(`/store/${nextStore.id}`);
  } catch (err) {
    setError('データの保存に失敗しました');
    console.error(err);
  } finally {
    setSavingData(false);
    setShowConfirmDialog(false);
  }
};
  // 確認ダイアログをキャンセル
  const handleDialogCancel = () => {
    setShowConfirmDialog(false);
  };

  // 処理済み商品の数を計算
  const processedCount = Object.keys(processedProducts).length;
  const totalCount = products.length;
  const progress = totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  return (
    <Container maxWidth="lg">
      <Box py={3}>
        {/* ローディング表示 */}
        {loading && (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        )}
        
        {/* エラー表示 */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {/* 店舗情報ヘッダー */}
        {currentStore && (
          <StoreHeader 
            storeNumber={currentStore.storeNumber}
            storeName={currentStore.storeName}
            loading={loading}
          />
        )}
        
        {/* メインコンテンツ */}
        {!loading && currentStore && (
          <Box 
            display="flex"
            flexDirection={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems="flex-start"
            gap={3}
          >
            {/* 左側：商品リスト */}
            <Box width={{ xs: '100%', md: '60%' }}>
              <ProductList 
                products={products}
                selectedProductIds={selectedProductId ? [selectedProductId] : []}
                onProductSelect={handleProductSelect}
                loading={false}
                error={null}
              />
              
              {/* 進捗表示 */}
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  処理済み: {processedCount} / {totalCount} 商品 ({progress}%)
                </Typography>
                
                {/* 次の店舗への遷移ボタン */}
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    endIcon={<ArrowForwardIcon />}
                    onClick={handleNextStoreConfirm}
                    disabled={processedCount === 0}
                  >
                    {nextStore ? `次の店舗 (${nextStore.storeName})` : '完了'}
                  </Button>
                </Box>
              </Paper>
            </Box>
            
            {/* 右側：テンキー */}
            <Box width={{ xs: '100%', md: '35%' }}>
              <Keypad 
                value={boxCount}
                onChange={handleBoxCountChange}
                onEnter={handleBoxCountConfirm}
                onClear={handleBoxCountClear}
              />
              
              {/* 選択中の商品情報 */}
              {selectedProductId && (
                <Paper sx={{ mt: 2, p: 2 }}>
                  <Typography variant="subtitle1">
                    選択中: {products.find(p => p.id === selectedProductId)?.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    箱数を入力して「確定」を押してください
                  </Typography>
                </Paper>
              )}
            </Box>
          </Box>
        )}
      </Box>
      
      {/* 確認ダイアログ */}
      <Dialog
        open={showConfirmDialog}
        onClose={handleDialogCancel}
      >
        <DialogTitle>次の店舗に進みますか？</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {`${currentStore?.storeName}の箱数入力を完了し、`}
            {nextStore ? `${nextStore.storeName}に進みます。` : '最後の店舗です。'}
            <br />
            未入力の商品がある場合、箱数は0として処理されます。
          </DialogContentText>
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
            {savingData ? <CircularProgress size={24} /> : '次へ進む'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StoreProductPage;