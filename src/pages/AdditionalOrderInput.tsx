import React, { useState, useEffect } from 'react';
import {
Box,
Typography,
Paper,
FormControl,
InputLabel,
Select,
MenuItem,
TextField,
Button,
IconButton,
Table,
TableBody,  
TableCell,
TableContainer,
TableHead,
TableRow,
Dialog,
DialogActions,
DialogContent,
DialogContentText,
DialogTitle,
Snackbar,
Alert,
SelectChangeEvent,
CircularProgress
} from '@mui/material';
import {
Add as AddIcon,
Delete as DeleteIcon,
Save as SaveIcon,
Refresh as RefreshIcon
} from '@mui/icons-material';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from "../../amplify/data/resource";

// Amplify クライアントの初期化
const client = generateClient<Schema>();

/**
 * 店舗情報の型定義
 */
interface Store {
id: string;
storeId: string;
storeName: string;
storeTc: string; // 送り先情報（中之島/上越）
}

/**
 * 注文アイテムの型定義
 */
interface OrderItem {
id: string;
storeTc: string;
itemId: string;
itemName: string;
itemFormalName?: string;
orderCount: number;
}

/**
 * 新しい空の注文アイテムを作成する関数
 * @param storeTc 送り先（デフォルトは中之島）
 * @returns 空の注文アイテム
 */
const createEmptyOrderItem = (storeTc: string = '中之島'): OrderItem => ({
id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
storeTc,
itemId: '',
itemName: '',
itemFormalName: '',
orderCount: 0
});

/**
 * 追加注文入力ページコンポーネント
 * 送り先選択 → 店舗選択 → 商品情報入力の流れで注文を作成
 */
const AdditionalOrderInput: React.FC = () => {
// =========== 状態管理 ===========
// 店舗関連
const [stores, setStores] = useState<Store[]>([]);
const [selectedDestination, setSelectedDestination] = useState<string>('');
const [filteredStores, setFilteredStores] = useState<Store[]>([]);
const [selectedStore, setSelectedStore] = useState<string>('');

// 注文アイテム
const [orderItems, setOrderItems] = useState<OrderItem[]>([createEmptyOrderItem()]);

// UI状態
const [loading, setLoading] = useState<boolean>(false);
const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
const [snackbar, setSnackbar] = useState<{ 
open: boolean; 
message: string; 
severity: 'success' | 'error' 
}>({
open: false,
message: '',
severity: 'success'
});

// =========== 副作用 ===========

/**
 * 初期ロード時に店舗データを取得
 */
useEffect(() => {
const fetchStores = async () => {
    try {
    setLoading(true);
    
    // APIから店舗データを取得
    const { data } = await client.models.Order.list();
    
    // 店舗データを抽出して重複を排除
    const storeMap = new Map<string, Store>();
    
    data.forEach(order => {
        if (order.storeId && order.storeName && order.storeTc && !storeMap.has(order.storeId)) {
        storeMap.set(order.storeId, {
            id: order.storeId,
            storeId: order.storeId,
            storeName: order.storeName,
            storeTc: order.storeTc
        });
        }
    });
    
    setStores(Array.from(storeMap.values()));
    } catch (error) {
    console.error('店舗データの取得に失敗しました:', error);
    setSnackbar({
        open: true,
        message: '店舗データの取得に失敗しました',
        severity: 'error'
    });
    } finally {
    setLoading(false);
    }
};

fetchStores();
}, []);

/**
 * 送り先選択時に店舗をフィルタリング
 */
useEffect(() => {
if (selectedDestination) {
    const filtered = stores.filter(store => store.storeTc === selectedDestination);
    setFilteredStores(filtered);
    
    // 選択中の店舗が新しいフィルタに含まれていない場合はリセット
    const currentStoreExists = filtered.some(store => store.storeId === selectedStore);
    if (!currentStoreExists) {
    setSelectedStore('');
    }
} else {
    setFilteredStores([]);
    setSelectedStore('');
}
}, [selectedDestination, stores, selectedStore]);

// =========== イベントハンドラ ===========

/**
 * 送り先選択の変更ハンドラ
 */
const handleDestinationChange = (event: SelectChangeEvent<string>) => {
const newDestination = event.target.value;
setSelectedDestination(newDestination);

// 送り先が変更されたら、注文アイテムの送り先も一括更新
setOrderItems(items => 
    items.map(item => ({
    ...item,
    storeTc: newDestination
    }))
);
};

/**
 * 店舗選択の変更ハンドラ
 */
const handleStoreChange = (event: SelectChangeEvent<string>) => {
setSelectedStore(event.target.value);
};

/**
 * 注文アイテムの変更ハンドラ
 */
const handleOrderItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
const updatedItems = [...orderItems];
updatedItems[index] = {
    ...updatedItems[index],
    [field]: value
};
setOrderItems(updatedItems);
};

/**
 * 新しい行の追加
 */
const handleAddRow = () => {
setOrderItems([...orderItems, createEmptyOrderItem(selectedDestination)]);
};

/**
 * 行の削除
 */
const handleDeleteRow = (index: number) => {
if (orderItems.length > 1) {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    setOrderItems(updatedItems);
} else {
    setSnackbar({
    open: true,
    message: '少なくとも1つの商品が必要です',
    severity: 'error'
    });
}
};

/**
 * フォームのリセット
 */
const handleReset = () => {
setSelectedStore('');
setOrderItems([createEmptyOrderItem(selectedDestination)]);
};

/**
 * 保存ダイアログを開く
 */
const handleOpenSaveDialog = () => {
// 入力検証
const isValid = validateForm();
if (isValid) {
    setSaveDialogOpen(true);
}
};

/**
 * フォームの検証
 */
const validateForm = (): boolean => {
if (!selectedDestination) {
    setSnackbar({
    open: true,
    message: '送り先を選択してください',
    severity: 'error'
    });
    return false;
}

if (!selectedStore) {
    setSnackbar({
    open: true,
    message: '店舗を選択してください',
    severity: 'error'
    });
    return false;
}

for (let i = 0; i < orderItems.length; i++) {
    const item = orderItems[i];
    if (!item.itemId || !item.itemName || item.orderCount <= 0) {
    setSnackbar({
        open: true,
        message: `行 ${i + 1} に未入力または無効な値があります`,
        severity: 'error'
    });
    return false;
    }
}

return true;
};

/**
 * 注文の保存
 */
const handleSaveOrder = async () => {
try {
    setLoading(true);
    setSaveDialogOpen(false);

    const selectedStoreObj = stores.find(store => store.storeId === selectedStore);
    if (!selectedStoreObj) {
    throw new Error('選択された店舗が見つかりません');
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // APIを使用して保存
    for (const item of orderItems) {
    await client.models.Order.create({
        date: today,
        storeId: selectedStoreObj.storeId,
        storeName: selectedStoreObj.storeName,
        storeTc: selectedDestination,
        itemId: item.itemId,
        itemName: item.itemName,
        itemFormalName: item.itemFormalName || undefined,
        orderCount: item.orderCount
    });
    }

    // 保存成功後の処理
    setSnackbar({
    open: true,
    message: '注文が正常に保存されました',
    severity: 'success'
    });

    // フォームをリセット
    handleReset();
} catch (error) {
    console.error('注文の保存に失敗しました:', error);
    setSnackbar({
    open: true,
    message: '注文の保存に失敗しました',
    severity: 'error'
    });
} finally {
    setLoading(false);
}
};

/**
 * スナックバーを閉じる
 */
const handleCloseSnackbar = () => {
setSnackbar({ ...snackbar, open: false });
};

// =========== レンダリング ===========
return (
<Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
    <Typography variant="h4" component="h1" gutterBottom>
    追加注文入力
    </Typography>

    {/* 送り先と店舗選択セクション */}
    <Paper sx={{ p: 3, mb: 3 }}>
    {/* 送り先選択 */}
    <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id="destination-select-label">送り先</InputLabel>
        <Select
        labelId="destination-select-label"
        id="destination-select"
        value={selectedDestination}
        label="送り先"
        onChange={handleDestinationChange}
        disabled={loading}
        >
        <MenuItem value="中之島">中之島</MenuItem>
        <MenuItem value="上越">上越</MenuItem>
        </Select>
    </FormControl>

    {/* 店舗選択 */}
    <FormControl fullWidth sx={{ mb: 2 }} disabled={!selectedDestination}>
        <InputLabel id="store-select-label">店舗選択</InputLabel>
        <Select
        labelId="store-select-label"
        id="store-select"
        value={selectedStore}
        label="店舗選択"
        onChange={handleStoreChange}
        disabled={loading || !selectedDestination}
        >
        {filteredStores.map((store) => (
            <MenuItem key={store.id} value={store.storeId}>
            {store.storeId} - {store.storeName}
            </MenuItem>
        ))}
        </Select>
    </FormControl>

    {/* 商品入力テーブル */}
    <TableContainer component={Paper} sx={{ mb: 2 }}>
        <Table>
        <TableHead>
            <TableRow>
            <TableCell>商品ID</TableCell>
            <TableCell>商品名</TableCell>
            <TableCell>商品呼称（任意）</TableCell>
            <TableCell>商品数</TableCell>
            <TableCell>操作</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {orderItems.map((item, index) => (
            <TableRow key={item.id}>
                {/* 商品ID入力 - 数字入力に最適化 */}
                <TableCell>
                <TextField
                    size="small"
                    value={item.itemId}
                    onChange={(e) => handleOrderItemChange(index, 'itemId', e.target.value)}
                    fullWidth
                    inputProps={{ 
                    inputMode: 'numeric', 
                    pattern: '[0-9]*',
                    style: { fontFamily: 'monospace' } // 半角入力を視覚的に強調
                    }}
                    placeholder="半角数字"
                />
                </TableCell>
                
                {/* 商品名入力 - 日本語入力に最適化 */}
                <TableCell>
                <TextField
                    size="small"
                    value={item.itemName}
                    onChange={(e) => handleOrderItemChange(index, 'itemName', e.target.value)}
                    fullWidth
                    inputProps={{ 
                    lang: 'ja',
                    style: { fontFamily: 'sans-serif' } // 日本語入力に適したフォント
                    }}
                    placeholder="商品名"
                />
                </TableCell>
                
                {/* 商品呼称入力（任意） - 日本語入力に最適化 */}
                <TableCell>
                <TextField
                    size="small"
                    value={item.itemFormalName || ''}
                    onChange={(e) => handleOrderItemChange(index, 'itemFormalName', e.target.value)}
                    fullWidth
                    inputProps={{ 
                    lang: 'ja',
                    style: { fontFamily: 'sans-serif' } // 日本語入力に適したフォント
                    }}
                    placeholder="任意"
                />
                </TableCell>
                
                {/* 商品数入力 - 数値入力に最適化 */}
                <TableCell>
                <TextField
                    size="small"
                    type="number"
                    value={item.orderCount === 0 ? '' : item.orderCount}
                    onChange={(e) => handleOrderItemChange(index, 'orderCount', parseInt(e.target.value) || 0)}
                    fullWidth
                    inputProps={{ 
                    min: 0,
                    inputMode: 'numeric',
                    style: { fontFamily: 'monospace' } // 数値入力に適したフォント
                    }}
                />
                </TableCell>
                
                {/* 行の削除ボタン */}
                <TableCell>
                <IconButton
                    color="error"
                    onClick={() => handleDeleteRow(index)}
                    disabled={orderItems.length === 1}
                >
                    <DeleteIcon />
                </IconButton>
                </TableCell>
            </TableRow>
            ))}
        </TableBody>
        </Table>
    </TableContainer>

    {/* アクションボタン */}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Button
        variant="outlined"
        startIcon={<AddIcon />}
        onClick={handleAddRow}
        disabled={loading}
        >
        行を追加
        </Button>
        <Box>
        <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleReset}
            disabled={loading}
            sx={{ mr: 1 }}
        >
            リセット
        </Button>
        <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleOpenSaveDialog}
            disabled={loading}
        >
            保存
        </Button>
        </Box>
    </Box>
    </Paper>

    {/* 入力履歴セクション（将来実装予定） */}
    <Paper sx={{ p: 3 }}>
    <Typography variant="h5" component="h2" gutterBottom>
        入力履歴
    </Typography>
    <Box sx={{ textAlign: 'center', py: 3 }}>
        <Typography variant="body1" color="text.secondary">
        履歴機能は現在開発中です。今後のアップデートをお待ちください。
        </Typography>
    </Box>
    </Paper>

    {/* 保存確認ダイアログ */}
    <Dialog
    open={saveDialogOpen}
    onClose={() => setSaveDialogOpen(false)}
    >
    <DialogTitle>確認</DialogTitle>
    <DialogContent>
        <DialogContentText>
        入力内容を保存しますか？
        </DialogContentText>
    </DialogContent>
    <DialogActions>
        <Button onClick={() => setSaveDialogOpen(false)}>キャンセル</Button>
        <Button onClick={handleSaveOrder} variant="contained">
        保存
        </Button>
    </DialogActions>
    </Dialog>

    {/* ローディングインジケーター */}
    {loading && (
    <Box
        sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        zIndex: 9999,
        }}
    >
        <CircularProgress />
    </Box>
    )}

    {/* スナックバー通知 */}
    <Snackbar
    open={snackbar.open}
    autoHideDuration={6000}
    onClose={handleCloseSnackbar}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
    <Alert
        onClose={handleCloseSnackbar}
        severity={snackbar.severity}
        sx={{ width: '100%' }}
    >
        {snackbar.message}
    </Alert>
    </Snackbar>
</Box>
);
};

export default AdditionalOrderInput;