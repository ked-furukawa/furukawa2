import React, { useState } from 'react';
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
Modal,
Button
} from '@mui/material';
import {  Store } from '../types';
import { Keypad } from './Keypad';

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const boxClient = generateClient<Schema>();

import { fetchUserAttributes } from 'aws-amplify/auth';

interface StoreDoubleCheckListProps {
stores: Store[];
selectedStoreIds: string[];
onStoreSelect: (storeId: string) => void;
loading?: boolean;
error?: string | null;
boxCounts?: Record<string, Record<string, number>>;
}
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

export const StoreDoubleCheckList: React.FC<StoreDoubleCheckListProps> = ({
stores,
selectedStoreIds,
onStoreSelect,
loading = false,
error = null,
boxCounts = {}
}) => {
if (loading) {
    return <Typography>読み込み中...</Typography>;
}

if (error) {
    return <Typography color="error">{error}</Typography>;
}

if (stores.length === 0) {
    return <Typography>店舗がありません</Typography>;
}
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleCloseModal = () => setIsModalOpen(false);
    const [inputValue, setInputValue] = useState<string>('');
    const [selectedColor, setSelectedColor] = useState<BoxColor>('green');
    const [selectedStoreId, setSelectedStoreId] = useState<string>('0');



// 各店舗の合計箱数を計算
const getStoreBoxCount = (storeId: string): number => {
    const storeBoxCounts = boxCounts[storeId] || {};
    return Object.values(storeBoxCounts).reduce((sum, count) => sum + count, 0);
};
  // テンキーからの入力を処理する関数
const handleInputChange = (value: string) => {
    setInputValue(value);
};
  // 箱数更新処理
const handleQuantityUpdate  = async () => {
    try {
        const attrs = await fetchUserAttributes();
        const result = await boxClient.models.Box.update({ //DBの書き換え部分、今回はBoxテーブル
            date: '20250609', //実際は画面内のどこかに保持している変数などを使って必要情報を埋めていく
            storeId: selectedStoreId, //必要情報=定義したテーブルの中身

            boxColor: 'green',
            boxCount: Number(inputValue),

            departmentId: attrs['custom:departmentId'] as string
        });
        console.log('result',result);
        } catch (error) {
        console.error('DB登録エラー:', error);
        }

  handleCloseModal(); // 入力後にモーダルを閉じるなど
};


const handleColorChange = (color: BoxColor) => {
setSelectedColor(color);   
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
        maxHeight: 'calc(100vh - 280px)',
        overflowY: 'auto',
        '& .MuiTableCell-root': {
        padding: '12px 16px', // セルのパディングを大きくして操作しやすく
        fontSize: '1.1rem' // フォントサイズを大きく
        }
        }}
    >
        <Table stickyHeader>
        <TableHead>
        <TableRow>
            {[
            { label: '物流センター', align: 'left' },
            { label: '店舗名', align: 'center' },
            { label: '店舗番号', align: 'center' },
            { label: '箱数', align: 'center' },
            { label: '選択', align: 'center' }
            ].map((column, index) => (
            <TableCell 
                key={index}
                align={column.align as any}
                sx={{ 
                backgroundColor: 'primary.main', 
                color: 'white',
                fontWeight: 'bold'
                }}
            >
                {column.label}
            </TableCell>
            ))}
        </TableRow>
        </TableHead>
        <TableBody>
            {[
                // 1. 中之島のデータ（昇順）
                ...stores
                    .filter((s) => s.storeTc === '中之島')
                    .sort((a, b) => Number(a.id) - Number(b.id)),

                // 2. 上越のデータ（昇順）
                ...stores
                    .filter((s) => s.storeTc !== '中之島')
                    .sort((a, b) => Number(a.id) - Number(b.id))
                
            ].map((store) => (
                <TableRow 
                key={store.id} 
                hover 
                selected={selectedStoreIds.includes(store.id)}
                sx={{ 
                    // bgcolor: !store.isChecked ? 'rgba(255, 244, 229, 0.7)' : 'inherit' ,
                    height: '60px' // 行の高さを大きくしてタップしやすく
                }}
                >
                <TableCell>{store.storeTc}</TableCell>
                <TableCell>{store.storeName}</TableCell>
                <TableCell align="center">{store.storeNumber}</TableCell>
                <TableCell align="center"  onClick={() => {
                    console.log(selectedStoreId)
                    const currentValue = getStoreBoxCount(store.id);
                    setSelectedStoreId(store.id);
                    setInputValue(String(currentValue)); // ← 文字列として Keypad に渡す
                    setIsModalOpen(true);
                }}

                    sx={{ cursor: 'pointer', textDecoration: 'underline' }}>{getStoreBoxCount(store.id)}</TableCell>
                <TableCell align="center">
                    <Checkbox 
                    checked={selectedStoreIds.includes(store.id)} 
                    onChange={() => onStoreSelect(store.id)} 
                     sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }} // チェックボックスを大きく
                    />
                </TableCell>
                </TableRow>
            ))}
        </TableBody>
        </Table>
        {/* モーダル */}
        <Modal open={isModalOpen} onClose={handleCloseModal} disableScrollLock>
            <Box
            component={Paper}
            sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                p: 4,
                boxShadow: 24,
            }}
            >
            <Typography variant="h6" component="h2" gutterBottom>
                修正モーダル
            </Typography>
            <div>
                <Keypad 
                value={inputValue }
                onChange={handleInputChange}
                onEnter={handleQuantityUpdate}
                onClear={() => setInputValue('')}
                selectedColor={selectedColor}
                onColorChange={handleColorChange}
                />
            </div>
            <Box mt={3} display="flex" justifyContent="flex-end">
                <Button onClick={handleCloseModal} variant="outlined">
                閉じる
                </Button>
            </Box>
            </Box>
        </Modal>
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