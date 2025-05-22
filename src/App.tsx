// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { StoreHeader } from './components/StoreHeader';
import { ProductList } from './components/ProductList';
import { Keypad } from './components/Keypad';
import StoreList from './components/StoreList';  // 正しくインポート
import { fetchStoreData, fetchProducts, fetchStores } from './services/dataService';
import { Store, Product } from './types';

const App: React.FC = () => {
  // 状態管理
  const [inputValue, setInputValue] = useState<string>('');
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  
  // 選択中の商品IDを配列に変更（複数選択可能に）
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);

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
        // 店舗一覧を取得
        const stores = await fetchStores();
        if (stores && stores.length > 0) {
          // 最初の店舗を選択
          const firstStoreId = stores[0].id;
          setSelectedStoreId(firstStoreId);
          
          // 選択した店舗のデータを取得
          const store = await fetchStoreData(firstStoreId);
          setStoreData(store);
          
          // 商品データの取得
          const productList = await fetchProducts(firstStoreId);
          setProducts(productList);
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

  // テンキーからの入力を処理
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // 商品の選択を切り替える（複数選択可能に）
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

  // 商品数量の更新（選択されている全ての商品に適用）
  const handleQuantityUpdate = () => {
    if (selectedProductIds.length === 0 || !inputValue) return;
    
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) return;

    // 選択されている全ての商品の数量を更新
    setProducts(prevProducts => 
      prevProducts.map(product => 
        selectedProductIds.includes(product.id) 
          ? { ...product, quantity } 
          : product
      )
    );

    console.log(`選択商品ID: ${selectedProductIds.join(', ')}, 数量: ${quantity}`);
  };

  return (
    <Box display="flex" height="100vh">
      {/* 左側：店舗リスト */}
      <StoreList 
        selectedStoreId={selectedStoreId} 
        onSelectStore={handleStoreSelect} 
      />
      
      <Box flex="1" display="flex" flexDirection="column" overflow="auto">
        <Container maxWidth="lg">
          <CssBaseline />
          <Box 
            display="flex"
            flexDirection={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems="flex-start"
            py={3}
            height="100%"
          >
            {/* 中央：店舗情報と商品リスト */}
            <Box 
              width={{ xs: '100%', sm: '65%' }} 
              mb={{ xs: 3, sm: 0 }}
              mr={{ xs: 0, sm: 2 }}
            >
              {/* 店舗情報 */}
              <StoreHeader 
                storeNumber={storeData?.storeNumber || ''}
                storeName={storeData?.storeName || ''}
                loading={loading}
              />
              
              {/* 商品リスト */}
              <ProductList 
                products={products}
                selectedProductIds={selectedProductIds}
                onProductSelect={handleProductSelect}
                loading={loading}
                error={error}
              />
            </Box>

            {/* 右側：テンキー */}
            <Box width={{ xs: '100%', sm: '30%' }}>
              <Keypad 
                value={inputValue}
                onChange={handleInputChange}
                onEnter={handleQuantityUpdate}
                onClear={() => setInputValue('')}
                onBackspace={() => setInputValue(prev => prev.slice(0, -1))}
              />
            </Box>
          </Box>
        </Container>
      </Box>
    </Box>
  );
};

export default App;