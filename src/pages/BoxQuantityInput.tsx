import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { 
  StoreHeader, 
  ProductList, 
  Keypad, 
  ErrorMessage, 
  ConfirmationDialog 
} from '../components'; // インデックスファイルから一括インポート
import StoreList from '../components/StoreList'; // StoreListがインデックスに含まれていない場合
import { useStoreManagement } from '../hooks/useStoreManagement';
import { useProductSelection } from '../hooks/useProductSelection';

export const BoxQuantityInput: React.FC = () => {
  // カスタムフックを使用
  const { 
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
  } = useStoreManagement();

  const {
    selectedProductIds,
    inputValue,
    showConfirmDialog,
    setShowConfirmDialog,
    savingData,
    setSavingData,
    checkError,
    handleProductSelect,
    handleInputChange,
    resetSelection,
    updateSelectedProductsQuantity
  } = useProductSelection();

  // 数量更新処理
  const handleQuantityUpdate = () => {
    const success = updateSelectedProductsQuantity(products, setProducts, setError);
    if (success) {
      setError(null);
      setShowConfirmDialog(true);
    }
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
      console.log('保存されるデータ:', {
        storeId: selectedStoreId,
        boxCountData
      });
      
      // 現在の店舗を完了済みとしてマーク
      if (selectedStoreId) {
        await markStoreAsCompleted(selectedStoreId);
      }
      
      // 次の店舗に移動
      await handleStoreSelect(nextStore.id);
      
      // 選択をクリア
      resetSelection();
      
    } catch (err) {
      setError('データの保存に失敗しました');
      console.error(err);
    } finally {
      setSavingData(false);
      setShowConfirmDialog(false);
    }
  };

  return (
    <Box display="flex" height="100vh">
      {/* コンポーネントの内容 */}
      <StoreList 
        selectedStoreId={selectedStoreId} 
        onSelectStore={handleStoreSelect} 
        completedStoreIds={completedStoreIds}
      />
      
      {/* メインコンテンツ */}
      <Box flex="1" display="flex" flexDirection="column" overflow="auto">
        <CssBaseline />
        <Container maxWidth="md">
          {/* 店舗情報 */}
          <StoreHeader 
            storeNumber={storeData?.storeNumber || ''}
            storeName={storeData?.storeName || ''}
            loading={loading}
          />
          
          {/* エラーメッセージ */}
          {error && <ErrorMessage message={error} severity="error" />}
          
          {/* 商品リストとテンキー */}
          <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }}>
            <Box width={{ xs: '100%', md: '60%' }} pr={{ xs: 0, md: 2 }}>
              <ProductList 
                products={products}
                selectedProductIds={selectedProductIds}
                onProductSelect={handleProductSelect}
                loading={loading}
                error={null}
              />
            </Box>
            
            <Box width={{ xs: '100%', md: '40%' }} mt={{ xs: 2, md: 0 }}>
              <Keypad 
                value={inputValue}
                onChange={handleInputChange}
                onEnter={handleQuantityUpdate}
                onClear={() => handleInputChange('')}
              />
            </Box>
          </Box>
        </Container>
      </Box>
      
      {/* 確認ダイアログ */}
      <ConfirmationDialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={navigateToNextStore}
        currentStore={storeData}
        nextStore={nextStore}
        selectedProductCount={selectedProductIds.length}
        boxCount={inputValue}
        isSaving={savingData}
      />
      
      {/* チェックエラー */}
      {checkError && <ErrorMessage message={checkError} severity="warning" />}
    </Box>
  );
};

export default BoxQuantityInput;