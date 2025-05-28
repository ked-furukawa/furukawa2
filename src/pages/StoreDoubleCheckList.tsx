    // src/pages/StoreDoubleCheckList.tsx
    import React, { useState, useEffect, useCallback } from 'react';
    import {
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Checkbox,
    Box,
    Container,
    Button,
    Snackbar,
    Alert,
    Divider
    } from '@mui/material';
    import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
    import { Store } from '../types';
    import { fetchStores, updateStoreCompletionStatus } from '../services/dataService';

    const StoreDoubleCheckList: React.FC = () => {
    // 状態管理
    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStoreIds, setSelectedStoreIds] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [boxCounts, setBoxCounts] = useState<Record<string, Record<string, number>>>({});
    const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
    const [snackbarMessage, setSnackbarMessage] = useState<string>('');
    // 全店舗が選択されているかチェックする関数を追加
    const areAllStoresSelected = stores.length > 0 && selectedStoreIds.length === stores.length;

    // 店舗データを取得
    const loadStores = useCallback(async () => {
        try {
        setLoading(true);
        const storeData = await fetchStores();
        setStores(storeData);
        setError(null);
        } catch (err) {
        console.error('店舗データの取得に失敗しました', err);
        setError('店舗データの取得に失敗しました');
        } finally {
        setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadStores();
        
        // 箱数データのモック（実際の実装では、APIから取得する）
        const mockBoxCounts: Record<string, Record<string, number>> = {
        'store-001': { 'prod-001': 2, 'prod-002': 3, 'prod-003': 1 },
        'store-002': { 'prod-101': 1, 'prod-102': 2 },
        'store-003': { 'prod-201': 4, 'prod-202': 1, 'prod-203': 2 },
        'store-004': { 'prod-301': 3, 'prod-302': 2, 'prod-303': 1 }
        };
        setBoxCounts(mockBoxCounts);
    }, [loadStores]);

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
        setSnackbarOpen(true);
        return;
        }

        try {
        // 選択された各店舗を確定済みに更新
        const updatePromises = selectedStoreIds.map(storeId => 
            updateStoreCompletionStatus(storeId, true)
        );
        
        await Promise.all(updatePromises);
        
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

    // 各店舗の合計箱数を計算
    const getStoreBoxCount = (storeId: string): number => {
        const storeBoxCounts = boxCounts[storeId] || {};
        return Object.values(storeBoxCounts).reduce((sum, count) => sum + count, 0);
    };

    // 全店舗の合計箱数
    const totalBoxCount = stores.reduce((sum, store) => sum + getStoreBoxCount(store.id), 0);

    // ローディング中の表示
    if (loading) {
        return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography align="center" py={3}>読み込み中...</Typography>
        </Container>
        );
    }

    // エラー時の表示
    if (error) {
        return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography color="error" align="center" py={3}>{error}</Typography>
        </Container>
        );
    }

    // 店舗がない場合の表示
    if (stores.length === 0) {
        return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Typography align="center" py={3}>店舗がありません</Typography>
        </Container>
        );
    }

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
        
        <Paper
            elevation={2}
            sx={{
            borderRadius: 2,
            overflow: 'hidden'
            }}
        >
            <TableContainer 
            sx={{
                maxHeight: 'calc(100vh - 300px)',
                overflowY: 'auto',
                '& .MuiTableCell-root': {
                padding: '8px 16px'
                }
            }}
            >
            <Table stickyHeader>
                <TableHead>
                <TableRow>
                    <TableCell>店舗名</TableCell>
                    <TableCell align="center">店舗番号</TableCell>
                    <TableCell align="center">箱数</TableCell>
                    <TableCell align="center">選択</TableCell>
                </TableRow>
                </TableHead>
                <TableBody>
                {stores.map((store) => {
                    const storeBoxCount = getStoreBoxCount(store.id);
                    return (
                    <TableRow 
                        key={store.id} 
                        hover 
                        selected={selectedStoreIds.includes(store.id)}
                        sx={{ 
                        bgcolor: !store.isCompleted ? 'rgba(255, 244, 229, 0.7)' : 'inherit' 
                        }}
                    >
                        <TableCell>{store.storeName}</TableCell>
                        <TableCell align="center">{store.storeNumber}</TableCell>
                        <TableCell align="center">{storeBoxCount}</TableCell>
                        <TableCell align="center">
                        <Checkbox 
                            checked={selectedStoreIds.includes(store.id)} 
                            onChange={() => handleStoreSelect(store.id)} 
                        />
                        </TableCell>
                    </TableRow>
                    );
                })}
                </TableBody>
            </Table>
            </TableContainer>
            <Box sx={{ p: 2, borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
            <Typography variant="body2">
                合計店舗数: {stores.length} / 合計箱数: {totalBoxCount}
            </Typography>
            </Box>
        </Paper>
        
            <Box display="flex" justifyContent="flex-end" mt={3}>
            <Button
                variant="contained"
                color="primary"
                startIcon={<CheckCircleOutlineIcon />}
                onClick={handleConfirmSelected}
                // 全店舗が選択されている場合のみボタンを有効化
                disabled={!areAllStoresSelected}
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

    export default StoreDoubleCheckList;