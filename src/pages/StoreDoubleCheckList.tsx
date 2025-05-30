import React, { useState, useEffect } from 'react';
import {
Typography,
Box,
Container,
Button,
Snackbar,
Alert,
Divider,
Paper
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { StoreDoubleCheckList as StoreDoubleCheckListComponent } from '../components/StoreDoubleCheckList';
import { Store } from '../types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

// Amplify クライアントの生成
const client = generateClient<Schema>();

const StoreDoubleCheckListPage: React.FC = () => {
// 状態管理
const [stores, setStores] = useState<Store[]>([]);
const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [boxCounts, setBoxCounts] = useState<Record<string, Record<string, number>>>({});
const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
const [snackbarMessage, setSnackbarMessage] = useState<string>('');
const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

// データを取得
useEffect(() => {
    // テストデータの日付を指定 (2025-06-02)
    const targetDate = "2025-06-02";
    
    // DynamoDBからのデータ取得をサブスクライブ
    const subscription = client.models.Box.observeQuery({
    filter: {
        date: {
        eq: targetDate
        }
    }
    }).subscribe({
    next: ({ items }) => {
        if (items.length === 0) {
        setError(`${targetDate}の箱データが見つかりませんでした`);
        setLoading(false);
        return;
        }
        
        console.log(`${targetDate}のデータを${items.length}件取得しました`);
        
        const storeMap = new Map<string, Store>();
        const boxCountsData: Record<string, Record<string, number>> = {};
        
        items.forEach(box => {
        // 店舗情報を抽出
        if (!storeMap.has(box.storeId)) {
            storeMap.set(box.storeId, {
            id: box.storeId,
            storeName: box.storeName || '',
            storeNumber: box.storeId,
            storeTc: box.storeTc || '',
            isChecked: false // デフォルト値を設定
            });
        }
        
        // 箱数情報を抽出
        if (!boxCountsData[box.storeId]) {
            boxCountsData[box.storeId] = {};
        }
        boxCountsData[box.storeId][box.color] = box.boxCount;
        });
        
        // 店舗情報を配列に変換
        const storesArray = Array.from(storeMap.values());
        console.log(`${storesArray.length}件の店舗データを処理しました`);
        
        setStores(storesArray);
        setBoxCounts(boxCountsData);
        setError(null);
        setLoading(false);
    },
    error: (err) => {
        console.error('データの取得に失敗しました', err);
        setError('データの取得に失敗しました');
        setSnackbarMessage('データの取得に失敗しました');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
    }
    });

    return () => subscription.unsubscribe();
}, []);

// 店舗選択ハンドラー
const handleStoreSelect = (storeId: string) => {
    setSelectedStoreIds(prev => 
    prev.includes(storeId) 
        ? prev.filter(id => id !== storeId)
        : [...prev, storeId]
    );
};

// 選択した店舗を確定済みにする
const handleConfirmSelected = async () => {
    if (selectedStoreIds.length === 0) {
    setSnackbarMessage('店舗が選択されていません');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    return;
    }

    try {
    setLoading(true);
    
    // テストデータの日付を指定 (2025-06-02)
    const targetDate = "2025-06-02";
    
    // 選択された店舗の箱データを取得して更新
    for (const storeId of selectedStoreIds) {
        // 店舗の全ての箱データを取得
        const boxesResponse = await client.models.Box.list({
        filter: {
            date: { eq: targetDate },
            storeId: { eq: storeId }
        }
        });

        // 各箱データに対して更新
        for (const box of boxesResponse.data) {
        await client.models.Box.update({
            date: box.date,
            storeId: box.storeId,
            color: box.color,
            boxCount: box.boxCount,
            storeName: box.storeName,
            storeTc: box.storeTc,
            boxCreatedBy: box.boxCreatedBy
        });
        }
    }
    
    // 店舗リストを更新（UI上でのみisCheckedを管理）
    setStores(prevStores => 
        prevStores.map(store => 
        selectedStoreIds.includes(store.id) 
            ? { ...store, isChecked: true } 
            : store
        )
    );
    
    setSnackbarMessage(`${selectedStoreIds.length}件の店舗を確定済みにしました`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
    setSelectedStoreIds([]);
    } catch (err) {
    console.error('店舗の確定に失敗しました', err);
    setSnackbarMessage('店舗の確定に失敗しました');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
    } finally {
    setLoading(false);
    }
};

// スナックバーを閉じる
const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
};

return (
    <Container maxWidth={false} disableGutters sx={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        px: 2, 
        py: 2,
        }}>
    <Paper elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
    <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: '1.8rem' }}>
        店舗ダブルチェック (2025年6月2日)
    </Typography>
    <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.1rem' }}>
        各店舗の箱数を確認し、問題がなければ確定してください。
    </Typography>
    </Paper>
        
    <Divider sx={{ mb: 3 }} />
    
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <StoreDoubleCheckListComponent
        stores={stores}
        selectedStoreIds={selectedStoreIds}
        onStoreSelect={handleStoreSelect}
        loading={loading}
        error={error}
        boxCounts={boxCounts}
    />
    </Box>
    
    <Box display="flex" justifyContent="center" mt={1} mb={2}>
    <Button
    variant="contained"
    color="primary"
    size="large"
    startIcon={<CheckCircleOutlineIcon />}
    onClick={handleConfirmSelected}
    disabled={selectedStoreIds.length !== stores.length || loading} // ここを変更
    sx={{ 
        py: 1.5, 
        px: 4, 
        fontSize: '1.2rem',
        borderRadius: 2,
        width: '80%',
        maxWidth: '500px'
    }}
    >
    {selectedStoreIds.length === stores.length 
        ? '全店舗を確定する' 
        : `全店舗を選択してください (${selectedStoreIds.length}/${stores.length})`}
    </Button>
    </Box>
    
    <Snackbar
    open={snackbarOpen}
    autoHideDuration={6000}
    onClose={handleCloseSnackbar}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
    <Alert 
        onClose={handleCloseSnackbar} 
        severity={snackbarSeverity} 
        sx={{ width: '100%', fontSize: '1.1rem' }}
    >
        {snackbarMessage}
    </Alert>
    </Snackbar>
    </Container>
);
};

export default StoreDoubleCheckListPage;