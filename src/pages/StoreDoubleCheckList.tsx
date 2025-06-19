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
import { formatDateToJST } from '../components/utils/formatDateToJST';
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

const { departmentId } = useParams<{ departmentId?: string }>();
if (!departmentId) {
    setError('部門IDが必要です');
    setLoading(false);
    return <div>部門IDが必要です</div>;
}
const safeDepartmentId = departmentId as string;

// データを取得
// useEffect内のデータ取得部分を修正
useEffect(() => {
    // テストデータの日付を指定 (20250609)
    const targetDate = "20250609";
    // DynamoDBからのデータ取得をサブスクライブ
    const subscription = client.models.Box.observeQuery({
        filter: {
            date: {
                eq: targetDate
            },
            departmentId: { eq: safeDepartmentId }
        }
    }).subscribe({
        next: ({ items, isSynced }) => {
            if (!isSynced) {
                console.log("データ同期中...");
                return;
            }
            console.log('全Boxレコード:', items);
            const storeMap = new Map<string, Store>();
            const boxCountsData: Record<string, Record<string, number>> = {};
            const confirmedStores = new Set<string>();
            // 代表レコードと仕分け時間ごとのBoxレコードを分離
            const representativeBoxes = items.filter(box => !box.storeId.includes('_'));
            const roundBoxes = items.filter(box => box.storeId.includes('_'));
            console.log('代表レコード:', representativeBoxes);
            console.log('仕分け時間ごとのBoxレコード:', roundBoxes);
            // 1. まず全店舗分のstoreMapとboxCountsDataを「仕分け時間ごとのBoxレコード」で構築
            roundBoxes.forEach(box => {
                const actualStoreId = box.storeId.split('_')[0];
                if (!storeMap.has(actualStoreId)) {
                    storeMap.set(actualStoreId, {
                        id: actualStoreId,
                        storeName: box.storeName || '',
                        storeNumber: actualStoreId,
                        storeTc: box.storeTc || '',
                        isChecked: false
                    });
                }
                if (!boxCountsData[actualStoreId]) {
                    boxCountsData[actualStoreId] = {};
                }
                if (!boxCountsData[actualStoreId][box.boxColor]) {
                    boxCountsData[actualStoreId][box.boxColor] = 0;
                }
                boxCountsData[actualStoreId][box.boxColor] += box.boxCount;
                if (box.status === 'DOUBLE_CHECKED') {
                    confirmedStores.add(actualStoreId);
                }
            });
            // 2. 代表レコードがあればboxCountsDataだけ上書き（storeMapは上書きしない）
            representativeBoxes.forEach(box => {
                const actualStoreId = box.storeId;
                if (!boxCountsData[actualStoreId]) {
                    boxCountsData[actualStoreId] = {};
                }
                boxCountsData[actualStoreId]['green'] = box.boxCount;
                if (box.status === 'DOUBLE_CHECKED') {
                    confirmedStores.add(actualStoreId);
                }
            });
            console.log('boxCountsData:', boxCountsData);
            const storesArray = Array.from(storeMap.values());
            console.log('storesArray:', storesArray);
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
        const targetDate = "20250609";
        let updatedStoreCount = 0;
        for (const storeId of selectedStoreIds) {
            const storeInfo = stores.find(store => store.id === storeId);
            if (!storeInfo) continue;
            // 代表レコードが存在するか確認
            const { data: representative } = await client.models.Box.list({
                filter: {
                    date: { eq: targetDate },
                    storeId: { eq: storeId },
                    boxColor: { eq: 'green' },
                    departmentId: { eq: safeDepartmentId }
                }
            });
            if (representative && representative.length > 0) {
                // 代表レコードのみを確定処理
                const rep = representative[0];
                if (rep.status !== 'DOUBLE_CHECKED') {
                    await client.models.Box.update({
                        date: rep.date,
                        storeId: rep.storeId,
                        boxColor: rep.boxColor,
                        departmentId: rep.departmentId,
                        boxCount: rep.boxCount,
                        storeName: rep.storeName,
                        storeTc: rep.storeTc,
                        status: 'DOUBLE_CHECKED'
                    });
                    updatedStoreCount++;
                }
                continue; // 仕分け時間ごとのBoxレコードはスキップ
            }
            // 代表レコードがなければ従来通り仕分け時間ごとのBoxレコードを処理
            const storeBoxCounts = boxCounts[storeId] || {};
            let storeUpdated = false;
            for (const [boxColor, boxCount] of Object.entries(storeBoxCounts)) {
                try {
                    const existingBoxes = await client.models.Box.list({
                        filter: {
                            date: { eq: targetDate },
                            storeId: { eq: storeId },
                            boxColor: { eq: boxColor },
                            departmentId: { eq: safeDepartmentId }
                        }
                    });
                    if (existingBoxes.data && existingBoxes.data.length > 0) {
                        const existingBox = existingBoxes.data[0];
                        if (existingBox.status === 'DOUBLE_CHECKED') {
                            continue;
                        }
                        await client.models.Box.update({
                            date: targetDate,
                            storeId: storeId,
                            boxColor: boxColor,
                            departmentId: safeDepartmentId,
                            boxCount: existingBox.boxCount,
                            storeName: storeInfo.storeName,
                            storeTc: storeInfo.storeTc,
                            status: 'DOUBLE_CHECKED'
                        });
                        storeUpdated = true;
                    } else {
                        await client.models.Box.create({
                            date: targetDate,
                            storeId: storeId,
                            boxColor: boxColor,
                            departmentId: safeDepartmentId,
                            boxCount: boxCount,
                            storeName: storeInfo.storeName,
                            storeTc: storeInfo.storeTc,
                            status: 'DOUBLE_CHECKED'
                        });
                        storeUpdated = true;
                    }
                } catch (err) {
                    throw err;
                }
            }
            if (storeUpdated) {
                updatedStoreCount++;
            }
        }
        setStores(prevStores =>
            prevStores.map(store =>
                selectedStoreIds.includes(store.id)
                    ? { ...store, isChecked: true }
                    : store
            )
        );
        if (updatedStoreCount > 0) {
            setSnackbarMessage(`${updatedStoreCount}件の店舗を確定済みにしました`);
        } else {
            setSnackbarMessage('すべての店舗はすでに確定済みです');
        }
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSelectedStoreIds([]);
    } catch (err) {
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