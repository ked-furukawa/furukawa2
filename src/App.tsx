// src/App.tsx
import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import { StoreHeader } from './components/StoreHeader';
import { ProductList } from './components/ProductList';
import { Keypad } from './components/Keypad';
import { fetchStoreData, fetchProducts } from './services/dataService';
import { Store, Product } from './types';

const App: React.FC = () => {
  // 状態管理
  const [inputValue, setInputValue] = useState<string>('');
  const [storeData, setStoreData] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // データの取得
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // 店舗データの取得
        const store = await fetchStoreData();
        setStoreData(store);
        
        // 商品データの取得
        const productList = await fetchProducts();
        setProducts(productList);
      } catch (err) {
        setError('データの読み込みに失敗しました');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // テンキーからの入力を処理
  const handleInputChange = (value: string) => {
    setInputValue(value);
  };

  // 商品の選択
  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    
    // 選択された商品の現在の数量を表示
    const product = products.find(p => p.id === productId);
    if (product) {
      setInputValue(product.quantity.toString());
    }
  };

  // 商品数量の更新
  const handleQuantityUpdate = () => {
    if (!selectedProductId || !inputValue) return;
    
    const quantity = parseInt(inputValue, 10);
    if (isNaN(quantity)) return;

    // 商品リストを更新
    setProducts(prevProducts => 
      prevProducts.map(product => 
        product.id === selectedProductId 
          ? { ...product, quantity } 
          : product
      )
    );

    // 実際のアプリケーションでは、ここでデータベース更新の処理を行う
    console.log(`商品ID: ${selectedProductId}, 数量: ${quantity}`);
    
    // 入力値をリセット
    setInputValue('');
    setSelectedProductId(null);
  };

  return (
    <Container maxWidth="lg">
      <CssBaseline />
      <Box 
        display="flex"
        flexDirection={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems="flex-start"
        py={3}
        minHeight="100vh"
      >
        {/* 左側：店舗情報と商品リスト */}
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
            selectedProductId={selectedProductId}
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
  );
};

export default App;