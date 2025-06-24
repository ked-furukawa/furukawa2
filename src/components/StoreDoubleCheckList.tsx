import React, { useEffect, useRef, useState } from 'react';
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

// import { fetchUserAttributes } from 'aws-amplify/auth';
import { useParams } from 'react-router-dom';
import { formatDateToJST } from './utils/formatDateToJST';

interface StoreDoubleCheckListProps {
stores: Store[];
selectedStoreIds: string[];
onStoreSelect: (storeId: string) => void;
loading?: boolean;
error?: string | null;
boxCounts?: Record<string, Record<string, number>>;
}
type BoxColor = 'green' | 'red' | 'blue' | 'orange';

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
    const { departmentId } = useParams<{ departmentId?: string }>();

     // 店舗要素への参照を保持するためのオブジェクト
    const storeRefs = useRef<Record<string, HTMLTableRowElement | null>>({});
    // テーブルコンテナへの参照
    const tableContainerRef = useRef<HTMLDivElement | null>(null);

    // タッチされた店舗IDを記録するための状態を追加
    const [touchedStoreIds, setTouchedStoreIds] = useState<string[]>([]);

    // 店舗行タッチ時のハンドラー
    const handleRowTouch = (storeId: string) => {
        // すでにタッチされている場合は何もしない
        if (touchedStoreIds.includes(storeId)) {
        return;
        }
        
        // タッチされた店舗IDを記録
        setTouchedStoreIds(prev => [...prev, storeId]);
    };

    
  // 選択された店舗が変更されたときに自動スクロール
    useEffect(() => {
        if (selectedStoreIds.length > 0 && !loading) {
        // 最後に選択された店舗ID
        const lastSelectedStoreId = selectedStoreIds[selectedStoreIds.length - 1];
        
        // 選択された店舗の要素を取得
        const selectedStoreElement = storeRefs.current[lastSelectedStoreId];
        
        if (selectedStoreElement && tableContainerRef.current) {
            // スムーズにスクロール
            selectedStoreElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center', // 要素が中央に来るようにスクロール
            });
        }
        }
    }, [selectedStoreIds, loading]);


    if (!departmentId) {
        return <div>部門IDが必要です</div>;
    }
    const date = formatDateToJST(new Date);

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
    console.log('handleQuantityUpdate呼び出し', inputValue, selectedStoreId);
    try {
        // 代表レコードが存在するか確認
        const { data: existing } = await boxClient.models.Box.listBoxesByDateAndDept({
        date: date,
        departmentId: {
            eq: departmentId
        }
        },
        {
            limit: 1000  // 最大1000件取得
        });

        const filtered = existing.filter(box =>
        box.storeId === selectedStoreId && box.boxColor === 'green'
        );
        // store情報を取得
        const storeInfo = stores.find(store => store.id === selectedStoreId);
        const storeName = storeInfo?.storeName || '';
        const storeTc = storeInfo?.storeTc || '';
        if (filtered && filtered.length > 0) {
            // update
            await boxClient.models.Box.update({
                date: date,
                storeId: selectedStoreId,
                boxColor: 'green',
                departmentId: departmentId,
                boxCount: Number(inputValue),
                storeName,
                storeTc
            });
            console.log('update完了');
        } else {
            // create
            await boxClient.models.Box.create({
                date: date,
                storeId: selectedStoreId,
                boxColor: 'green',
                departmentId: departmentId,
                boxCount: Number(inputValue),
                storeName,
                storeTc
            });
            console.log('create完了');
        }
    } catch (error) {
        console.error('DB登録エラー:', error);
    }
    handleCloseModal();
};


const handleColorChange = (color: BoxColor) => {
setSelectedColor(color);   
};

// 全店舗の合計箱数
const totalBoxCount = stores.reduce((sum, store) => sum + getStoreBoxCount(store.id), 0);

// センター別の合計箱数を計算する関数
const calculateCenterTotals = () => {
  const nakanoshima = stores
    .filter(store => store.storeTc === '中之島')
    .reduce((sum, store) => sum + getStoreBoxCount(store.id), 0);
    
  const joetsu = stores
    .filter(store => store.storeTc !== '中之島')
    .reduce((sum, store) => sum + getStoreBoxCount(store.id), 0);
    
  return { nakanoshima, joetsu };
};

// 関数を呼び出して結果を取得
const { nakanoshima: nakanoshimaTotal, joetsu: joetsuTotal } = calculateCenterTotals();

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
                hover={!touchedStoreIds.includes(store.id)} // タッチ済みの場合はホバー効果を無効化
                selected={selectedStoreIds.includes(store.id)}
                onClick={() => handleRowTouch(store.id)} // 行タッチ時のハンドラーを追加
                sx={{ 
                    height: '60px', // 行の高さを大きくしてタップしやすく
                    cursor: touchedStoreIds.includes(store.id) ? 'default' : 'pointer', // タッチ済みの場合はカーソルスタイルを変更
                    backgroundColor: touchedStoreIds.includes(store.id) ? 'rgba(144, 202, 249, 0.3)' : 'inherit', // タッチ済みの場合は背景色を変更
                    '&:hover': {
                    backgroundColor: touchedStoreIds.includes(store.id) ? 'rgba(144, 202, 249, 0.3)' : undefined, // タッチ済みの場合はホバー時の背景色も固定
                    }
                }}
                >
                <TableCell>{store.storeTc}</TableCell>
                <TableCell>{store.storeName}</TableCell>
                <TableCell align="center">{store.storeNumber}</TableCell>
                <TableCell 
                align="center"  
                onClick={(e) => {
                    e.stopPropagation(); // 行のクリックイベントが発火しないようにする
                    const currentValue = getStoreBoxCount(store.id);
                    console.log('テンキー開く: store.id=', store.id, 'currentValue=', currentValue, 'boxCounts[store.id]=', boxCounts[store.id]);
                    setSelectedStoreId(store.id);
                    setInputValue(String(currentValue)); // ← 文字列として Keypad に渡す
                    setIsModalOpen(true);
                }}
                sx={{ cursor: 'pointer', textDecoration: 'underline' }}
                >
                {getStoreBoxCount(store.id)}
                </TableCell>
                <TableCell 
                align="center"
                  onClick={(e) => e.stopPropagation()} // 行のクリックイベントが発火しないようにする
                  sx={{ padding: '8px' }} // パディングを調整
                > 
                <Checkbox 
                checked={selectedStoreIds.includes(store.id)} 
                onChange={() => onStoreSelect(store.id)} 
                sx={{ 
                    '& .MuiSvgIcon-root': { fontSize: 36 },  // サイズを36pxに増加（現在の28pxから）
                    padding: 1,  // パディングを増やして、タップ領域を広げる
                    transform: 'scale(1.2)',  // 全体的に1.2倍に拡大
                }} 
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
<Typography variant="body2" sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
    <span>合計店舗数: {stores.length} / 合計箱数: {totalBoxCount}</span>
    <span>
    中之島センター: {nakanoshimaTotal}箱 / 
    上越センター: {joetsuTotal}箱
    </span>
</Typography>
</Box>
    </Paper>
);
};

export default StoreDoubleCheckList;
