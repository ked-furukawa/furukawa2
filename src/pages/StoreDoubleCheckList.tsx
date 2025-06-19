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
// useEffect内のデータ取得部分を修正
useEffect(() => {
    // テストデータの日付を指定 (20250609)
    const targetDate = "20250609";
    
    // DynamoDBからのデータ取得をサブスクライブ
    const subscription = client.models.Box.observeQuery({
        filter: {
            date: {
                eq: targetDate
            }
        }
    }).subscribe({
        next: ({ items, isSynced }) => {
            // 重要: 完全に同期が完了したときだけ処理する
            if (!isSynced) {
                console.log("データ同期中...");
                return; // 同期が完了していない場合は処理をスキップ
            }
            
            if (items.length === 0) {
                setError(`${targetDate}の箱データが見つかりませんでした`);
                setLoading(false);
                return;
            }
            
            console.log(`${targetDate}のデータを${items.length}件取得しました`);
            
            const storeMap = new Map<string, Store>();
            const boxCountsData: Record<string, Record<string, number>> = {};
            
            // 処理済みの箱データを追跡（重複防止用）
            const processedBoxIds = new Set<string>();
            
            // 確定済み店舗を追跡
            const confirmedStores = new Set<string>();
            
            // 全ての箱データを処理
            items.forEach(box => {
                // 重複処理防止のためのユニークID
                const boxUniqueId = `${box.date}_${box.storeId}_${box.boxColor}_${box.departmentId}`;
                
                // この箱が既に処理済みなら、スキップ
                if (processedBoxIds.has(boxUniqueId)) {
                    return;
                }
                
                // 処理済みとしてマーク
                processedBoxIds.add(boxUniqueId);
                
                // storeIdから実際の店舗IDを抽出（importIdを除去）
                const actualStoreId = box.storeId.split('_')[0];
                
                // 店舗情報を抽出
                if (!storeMap.has(actualStoreId)) {
                    storeMap.set(actualStoreId, {
                        id: actualStoreId,
                        storeName: box.storeName || '',
                        storeNumber: actualStoreId,  // 実際の店舗番号のみを表示
                        storeTc: box.storeTc || '',
                        isChecked: false
                    });
                }
                
                // 箱数情報を抽出（累積加算）
                if (!boxCountsData[actualStoreId]) {
                    boxCountsData[actualStoreId] = {};
                }
                if (!boxCountsData[actualStoreId][box.boxColor]) {
                    boxCountsData[actualStoreId][box.boxColor] = 0;
                }
                
                // 箱数を加算
                boxCountsData[actualStoreId][box.boxColor] += box.boxCount;
                
                console.log(`店舗 ${actualStoreId} の ${box.boxColor} 箱: ${box.boxCount} を加算 (合計: ${boxCountsData[actualStoreId][box.boxColor]})`);
                
                // 確定済みの店舗を記録
                if (box.status === 'DOUBLE_CHECKED') {
                    confirmedStores.add(actualStoreId);
                }
            });
            
            // 確定済み店舗のisCheckedをtrueに設定
            confirmedStores.forEach(storeId => {
                if (storeMap.has(storeId)) {
                    const store = storeMap.get(storeId)!;
                    store.isChecked = true;
                    storeMap.set(storeId, store);
                }
            });
            
            console.log('集計結果:', boxCountsData);
            
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
        
        // テストデータの日付を指定 (20250609)
        const targetDate = "20250609";
        let updatedStoreCount = 0;
        
        // 選択された店舗の箱データを処理
        for (const storeId of selectedStoreIds) {
            // 店舗情報を取得
            const storeInfo = stores.find(store => store.id === storeId);
            if (!storeInfo) continue;
            
            // この店舗の集計済み箱データを取得
            const storeBoxCounts = boxCounts[storeId] || {};
            let storeUpdated = false;
            
            // 各箱色について処理
            for (const [boxColor, boxCount] of Object.entries(storeBoxCounts)) {
                try {
                    // 既存の集計レコードを確認
                    const existingBoxes = await client.models.Box.list({
                        filter: {
                            date: { eq: targetDate },
                            storeId: { eq: storeId },
                            boxColor: { eq: boxColor },
                            departmentId: { eq: 'souzai' } // 仮の部門ID
                        }
                    });
                    
                    if (existingBoxes.data && existingBoxes.data.length > 0) {
                        const existingBox = existingBoxes.data[0];
                        
                        // 重要: すでにDOUBLE_CHECKEDのレコードは更新しない
                        if (existingBox.status === 'DOUBLE_CHECKED') {
                            console.log(`${storeId}の${boxColor}箱は既に確定済みです。スキップします。`);
                            continue;
                        }
                        
                        // 重要: 既存の箱数に新しい箱数を加算する（再作業分は累積にしたい仕様）
                        const newBoxCount = existingBox.boxCount + boxCount;
                        console.log(`${storeId}の${boxColor}箱を更新: ${existingBox.boxCount} + ${boxCount} = ${newBoxCount}箱`);
                        
                        await client.models.Box.update({
                            date: targetDate,
                            storeId: storeId,
                            boxColor: boxColor,
                            departmentId: 'souzai', // 仮の部門ID
                            boxCount: newBoxCount, // 既存の値に加算
                            storeName: storeInfo.storeName,
                            storeTc: storeInfo.storeTc,
                            status: 'DOUBLE_CHECKED'
                        });
                        storeUpdated = true;
                    } else {
                        // 新規レコードを作成
                        await client.models.Box.create({
                            date: targetDate,
                            storeId: storeId,
                            boxColor: boxColor,
                            departmentId: 'souzai', // 仮の部門ID
                            boxCount: boxCount,
                            storeName: storeInfo.storeName,
                            storeTc: storeInfo.storeTc,
                            status: 'DOUBLE_CHECKED'
                        });
                        storeUpdated = true;
                        console.log(`${storeId}の${boxColor}箱を新規作成: ${boxCount}箱`);
                    }
                } catch (err) {
                    console.error(`${storeId}の${boxColor}箱の更新に失敗:`, err);
                    throw err;
                }
            }
            
            // この店舗で何かしらの更新があった場合のみカウント
            if (storeUpdated) {
                updatedStoreCount++;
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
        
        // 更新された店舗数に基づいてメッセージを表示
        if (updatedStoreCount > 0) {
            setSnackbarMessage(`${updatedStoreCount}件の店舗を確定済みにしました`);
        } else {
            setSnackbarMessage('すべての店舗はすでに確定済みです');
        }
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