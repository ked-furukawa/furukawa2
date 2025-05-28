// src/components/StoreDoubleCheckList.tsx の修正
import React from 'react';
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
} from '@mui/material';
import { Store } from '../types';

interface StoreDoubleCheckListProps {
stores: Store[];
selectedStoreIds: string[];
onStoreSelect: (storeId: string) => void;
onSelectAll?: () => void;  // オプショナルプロパティとして追加
loading?: boolean;
error?: string | null;
boxCounts?: Record<string, Record<string, number>>;
}

export const StoreDoubleCheckList: React.FC<StoreDoubleCheckListProps> = ({
stores,
selectedStoreIds,
onStoreSelect,
onSelectAll,  // 追加
loading = false,
error = null,
boxCounts = {}
}) => {
// 全店舗が選択されているかチェック
const areAllStoresSelected = stores.length > 0 && selectedStoreIds.length === stores.length;
const someStoresSelected = selectedStoreIds.length > 0 && selectedStoreIds.length < stores.length;

if (loading) {
    return <Typography align="center" py={3}>読み込み中...</Typography>;
}

if (error) {
    return <Typography color="error" align="center" py={3}>{error}</Typography>;
}

if (stores.length === 0) {
    return <Typography align="center" py={3}>店舗がありません</Typography>;
}

// 各店舗の合計箱数を計算
const getStoreBoxCount = (storeId: string): number => {
    const storeBoxCounts = boxCounts[storeId] || {};
    return Object.values(storeBoxCounts).reduce((sum, count) => sum + count, 0);
};

// 全店舗の合計箱数
const totalBoxCount = stores.reduce((sum, store) => sum + getStoreBoxCount(store.id), 0);

return (
    <Paper
    elevation={2}
    sx={{
        borderRadius: 2,
        overflow: 'hidden'
    }}
    >
    <TableContainer 
        sx={{
        maxHeight: 'calc(100vh - 200px)',
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
            <TableCell align="center">状態</TableCell>
            <TableCell align="center">
                {onSelectAll && (
                <Checkbox 
                    checked={areAllStoresSelected}
                    indeterminate={someStoresSelected}
                    onChange={onSelectAll}
                />
                )}
            </TableCell>
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
                >
                <TableCell>{store.storeName}</TableCell>
                <TableCell align="center">{store.storeNumber}</TableCell>
                <TableCell align="center">{storeBoxCount}</TableCell>
                <TableCell align="center">
                </TableCell>
                <TableCell align="center">
                    <Checkbox 
                    checked={selectedStoreIds.includes(store.id)} 
                    onChange={() => onStoreSelect(store.id)} 
                    disabled={store.isCompleted}
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
);
};

export default StoreDoubleCheckList;