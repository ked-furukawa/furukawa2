import React, { useState, useEffect } from 'react';
import {
Typography,
Box,
Container,
Button,
Snackbar,
Alert,
Divider,
Paper,
Fade,
Modal
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { StoreDoubleCheckList as StoreDoubleCheckListComponent } from '../components/StoreDoubleCheckList';
import { Store } from '../types';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useParams } from 'react-router-dom';
import { formatDateToJST } from '../components/utils/formatDateToJST';
import TaskAltIcon from '@mui/icons-material/TaskAlt';

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
  const date = formatDateToJST(new Date);

const [completionModalOpen, setCompletionModalOpen] = useState<boolean>(false);
const [completionMessage, setCompletionMessage] = useState<string>('');
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
    // DynamoDBからのデータ取得をサブスクライブ
    const subscription = client.models.Box.observeQuery({
        filter: {
            date: {
                eq: date
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
            setSnackbarMessage('データ取得中に問題が発生しました。ネットワークを確認するか、再読み込みしてください。');
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
        let updatedStoreCount = 0;
        for (const storeId of selectedStoreIds) {
            const storeInfo = stores.find(store => store.id === storeId);
            if (!storeInfo) continue;
            // 代表レコードが存在するか確認
            const { data: representative } = await client.models.Box.listBoxesByDateAndDept({
                date: date,
                departmentId: {
                    eq: departmentId
                }
                },
                {
                    limit: 1000  // 最大1000件取得
                });
                const filtered = representative.filter(box =>
                box.storeId === storeId && box.boxColor === 'green'
                );
            if (filtered && filtered.length > 0) {
                // 代表レコードのみを確定処理
                const rep = filtered[0];
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
                    const existingBoxes = await client.models.Box.listBoxesByDateAndDept({
                        date: date,
                        departmentId: {
                            eq: departmentId
                        }
                        },
                        {
                            limit: 1000  // 最大1000件取得
                        });

                        const filtered = existingBoxes.data.filter(box =>
                        box.storeId === storeId && box.boxColor === boxColor
                        );
                    if (filtered && filtered.length > 0) {
                        const existingBox = filtered[0];
                        if (existingBox.status === 'DOUBLE_CHECKED') {
                            continue;
                        }
                        await client.models.Box.update({
                            date: date,
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
                            date: date,
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
  setCompletionMessage(`${updatedStoreCount}件の店舗を確定済みにしました`);
} else {
  setCompletionMessage('すべての店舗はすでに確定済みです');
}
setCompletionModalOpen(true);
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

// 完了モーダルを閉じる
const handleCloseCompletionModal = () => {
  setCompletionModalOpen(false);
};


 return (
    <Container maxWidth={false} disableGutters sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
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
          disabled={selectedStoreIds.length !== stores.length || loading}
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
      
      {/* エラー通知用のスナックバー */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }} 
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity} 
          sx={{ width: '100%', fontSize: '1.1rem' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
      
      {/* 完了通知用のモーダル */}
{/* 完了通知用のモーダル */}
<Modal
  open={completionModalOpen}
  onClose={handleCloseCompletionModal}
  aria-labelledby="completion-modal-title"
  closeAfterTransition
>
  <Fade in={completionModalOpen}>
    <Paper
      elevation={6}
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '85%', sm: '450px' },
        p: 4,
        borderRadius: 3,
        textAlign: 'center',
        boxShadow: 24,
        bgcolor: 'background.paper',
      }}
    >
      <TaskAltIcon 
        color="success" 
        sx={{ 
          fontSize: 80, 
          mb: 2,
          animation: 'pulse 1.5s ease-in-out',
          '@keyframes pulse': {
            '0%': { transform: 'scale(0.8)', opacity: 0 },
            '50%': { transform: 'scale(1.1)' },
            '100%': { transform: 'scale(1)', opacity: 1 }
          }
        }} 
      />
      
      <Typography 
        id="completion-modal-title" 
        variant="h4" 
        component="h2" 
        gutterBottom
        sx={{ fontWeight: 'bold', color: 'success.main' }}
      >
        作業完了
      </Typography>
      <Typography 
        variant="h6" 
        sx={{ 
          mb: 3,
          color: 'text.primary'
        }}
      >
        {completionMessage}
      </Typography>
      <Button 
        variant="contained" 
        color="primary"
        size="large"
        onClick={handleCloseCompletionModal}
        sx={{ 
          minWidth: 150,
          py: 1.2,
          px: 4,
          fontSize: '1.1rem',
          borderRadius: 2
        }}
      >
        閉じる
      </Button>
    </Paper>
  </Fade>
</Modal>
    </Container>
  );
};

export default StoreDoubleCheckListPage;