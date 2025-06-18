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
import { useParams } from 'react-router-dom';

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

const { departmentId, importId } = useParams<{ departmentId?: string, importId?: string }>();

if (!departmentId) {
    return <div>部門IDが必要です</div>;
}

// データを取得
useEffect(() => {
    // 現在の日付を取得（YYYYMMDD形式）
    const today = new Date();
    const targetDate = today.getFullYear().toString() +
      ('0' + (today.getMonth() + 1)).slice(-2) +
      ('0' + today.getDate()).slice(-2);
    
    console.log('Fetching box data for date:', targetDate);
    
    const fetchBoxData = async () => {
      try {
        setLoading(true);
        
        // 箱データを取得
        const boxResponse = await client.models.Box.list({
          filter: {
            date: {
              eq: targetDate
            },
            departmentId: {
              eq: departmentId
            },
            importId: {
              eq: importId
            }
          }
        });

        console.log('Box data response:', boxResponse);
        
        if (!boxResponse.data || boxResponse.data.length === 0) {
          console.log('No box data found for:', { targetDate, departmentId });
          setError(`${targetDate}の箱データが見つかりませんでした`);
          setLoading(false);
          return;
        }
        
        console.log(`${targetDate}のデータを${boxResponse.data.length}件取得しました`);
        console.log('First box data:', boxResponse.data[0]);
        
        const storeMap = new Map<string, Store>();
        const boxCountsData: Record<string, Record<string, number>> = {};
        
        // 全ての箱データを処理
        boxResponse.data.forEach(box => {
          console.log('Processing box:', box);
          
          // 店舗情報を抽出
          if (!storeMap.has(box.storeId)) {
            storeMap.set(box.storeId, {
              id: box.storeId,
              storeName: box.storeName || '',
              storeNumber: box.storeId,
              storeTc: box.storeTc || '',
              isChecked: false
            });
          }
          
          // 箱数情報を抽出（累積加算）
          if (!boxCountsData[box.storeId]) {
            boxCountsData[box.storeId] = {};
          }
          if (!boxCountsData[box.storeId][box.boxColor]) {
            boxCountsData[box.storeId][box.boxColor] = 0;
          }
          // 全てのimportIdの箱数を合計
          boxCountsData[box.storeId][box.boxColor] += box.boxCount;
        });
        
        // 店舗情報を配列に変換
        const storesArray = Array.from(storeMap.values());
        console.log(`${storesArray.length}件の店舗データを処理しました`);
        console.log('Box counts data:', boxCountsData);
        
        setStores(storesArray);
        setBoxCounts(boxCountsData);
        setError(null);
      } catch (err) {
        console.error('データの取得に失敗しました', err);
        setError('データの取得に失敗しました');
        setSnackbarMessage('データの取得に失敗しました');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };

    fetchBoxData();
}, [departmentId, importId]);

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
    
    // テストデータの日付を指定 (20250609)
    const targetDate = "20250609";
    
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
            boxColor: box.boxColor,
            boxCount: box.boxCount,
            storeName: box.storeName,
            storeTc: box.storeTc,
            departmentId: box.departmentId
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
        // px: 2, 
        py: 2,
        }}>
    <Paper elevation={1} sx={{ p: 3, mb: 2, borderRadius: 2 }}>
    <Typography variant="h4" component="h1" gutterBottom sx={{ fontSize: '1.8rem' }}>
        店舗ダブルチェック
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