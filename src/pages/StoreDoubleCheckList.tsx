// src/pages/StoreDoubleCheckList.tsx
import React, { useState, useEffect } from 'react';
import {
Typography,
Box,
Container,
Button,
Snackbar,
Alert,
Divider
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { StoreDoubleCheckList as StoreDoubleCheckListComponent } from '../components/StoreDoubleCheckList';
import { Store } from '../types';

// テストデータを直接インポート
import testDataBox from '../services/testDataBox.json';

const StoreDoubleCheckListPage: React.FC = () => {
// 状態管理
const [stores, setStores] = useState<Store[]>([]);
const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [boxCounts, setBoxCounts] = useState<Record<string, Record<string, number>>>({});
const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
const [snackbarMessage, setSnackbarMessage] = useState<string>('');

// データを取得
useEffect(() => {
    try {
    setLoading(true);
    
    // テストデータから店舗情報を抽出
    const storeMap = new Map<string, Store>();
    const boxCountsData: Record<string, Record<string, number>> = {};
    
    // テストデータを型安全に扱うための型アサーション
    const boxData = testDataBox as Array<{
        date: string;
        storeId: string;
        storeName: string;
        storeTc: string;
        color: string;
        boxCount: number;
    }>;
    
    boxData.forEach(box => {
        // 店舗情報を抽出
        if (!storeMap.has(box.storeId)) {
        storeMap.set(box.storeId, {
            id: box.storeId,
            storeName: box.storeName || '',
            storeNumber: box.storeId,
            storeTc: box.storeTc || '',
            isCompleted: false // 初期値はfalse
        });
        }
        
        // 箱数情報を抽出
        if (!boxCountsData[box.storeId]) {
        boxCountsData[box.storeId] = {};
        }
        boxCountsData[box.storeId][box.color] = box.boxCount;
    });
    
    // 確定済み店舗の情報を取得（ローカルストレージから）
    const completedStores = JSON.parse(localStorage.getItem('completedStores') || '[]');
    
    // 確定済み店舗の情報を反映
    const storesArray = Array.from(storeMap.values()).map(store => ({
        ...store,
        isCompleted: completedStores.includes(store.id)
    }));
    
    setStores(storesArray);
    setBoxCounts(boxCountsData);
    setError(null);
    } catch (err) {
    console.error('データの取得に失敗しました', err);
    setError('データの取得に失敗しました');
    } finally {
    setLoading(false);
    }
}, []);

// 店舗選択ハンドラー
const handleStoreSelect = (storeId: string) => {
    setSelectedStoreIds(prev => 
    prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
};

// 全店舗選択/解除ハンドラー
const handleSelectAllStores = () => {
    if (selectedStoreIds.length === stores.length) {
    setSelectedStoreIds([]);
    } else {
    // 確定済みでない店舗のみを選択
    const selectableStores = stores
        .filter(store => !store.isCompleted)
        .map(store => store.id);
    setSelectedStoreIds(selectableStores);
    }
};

// 選択した店舗を確定済みにする
const handleConfirmSelected = async () => {
    if (selectedStoreIds.length === 0) {
    setSnackbarMessage('店舗が選択されていません');
    setSnackbarOpen(true);
    return;
    }

    try {
    // ローカルストレージから確定済み店舗を取得
    const completedStores = JSON.parse(localStorage.getItem('completedStores') || '[]');
    
    // 選択された店舗を確定済みに追加
    selectedStoreIds.forEach(storeId => {
        if (!completedStores.includes(storeId)) {
        completedStores.push(storeId);
        }
    });
    
    // ローカルストレージに保存
    localStorage.setItem('completedStores', JSON.stringify(completedStores));
    
    // 店舗リストを更新
    setStores(prevStores => 
        prevStores.map(store => 
        selectedStoreIds.includes(store.id) 
            ? { ...store, isCompleted: true } 
            : store
        )
    );
    
    setSnackbarMessage(`${selectedStoreIds.length}件の店舗を確定済みにしました`);
    setSnackbarOpen(true);
    setSelectedStoreIds([]);
    } catch (err) {
    console.error('店舗の確定に失敗しました', err);
    setSnackbarMessage('店舗の確定に失敗しました');
    setSnackbarOpen(true);
    }
};

// スナックバーを閉じる
const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
};

return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
        店舗ダブルチェック
        </Typography>
        <Typography variant="body1" color="text.secondary">
        各店舗の箱数を確認し、問題がなければ確定してください。
        </Typography>
    </Box>
    
    <Divider sx={{ mb: 3 }} />
    
    <StoreDoubleCheckListComponent
        stores={stores}
        selectedStoreIds={selectedStoreIds}
        onStoreSelect={handleStoreSelect}
        onSelectAll={handleSelectAllStores}
        loading={loading}
        error={error}
        boxCounts={boxCounts}
    />
    
    <Box display="flex" justifyContent="flex-end" mt={3}>
        <Button
        variant="contained"
        color="primary"
        startIcon={<CheckCircleOutlineIcon />}
        onClick={handleConfirmSelected}
        disabled={selectedStoreIds.length === 0}
        >
        選択した店舗を確定する
        </Button>
    </Box>
    
    <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
        {snackbarMessage}
        </Alert>
    </Snackbar>
    </Container>
);
};

export default StoreDoubleCheckListPage;