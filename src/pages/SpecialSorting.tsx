// src/pages/AutoBoxCalculationScreen.tsx

import React, { useState, useEffect } from 'react';
import { 
Box, 
Typography, 
Table, 
TableBody, 
TableCell, 
TableContainer, 
TableHead, 
TableRow, 
Paper, 
Checkbox, 
Button, 
Container,
CircularProgress,
Alert
} from '@mui/material';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useParams } from 'react-router-dom';
import { formatDateToJST } from '../components/utils/formatDateToJST';
import { resolveImportId } from '../components/utils/resolveImportId';

const client = generateClient<Schema>();

// 型定義
interface OrderData {
importId: string;
date: string;
storeId: string;
storeName: string|null;
storeTc: string|null;
itemId: string;
itemName: string|null;
itemFormalName: string|null;
itemCount: number;
departmentId: string;
departmentName: string|null;
status: string|null;
}

interface BoxData {
date: string;
storeId: string;
storeName: string;
storeTc: string;
boxColor: string;
boxCount: number;
departmentId: string;
status: string;
}

interface StoreCalculation {
storeId: string;
storeName: string|null;
itemCount: number;
boxCount: number;
checked: boolean;
isOdd: boolean;
}


const SpecialSorting: React.FC = () => {
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [orders, setOrders] = useState<OrderData[]>([]);
const [calculations, setCalculations] = useState<StoreCalculation[]>([]);
const [totalBoxes, setTotalBoxes] = useState<number>(0);
const [checkedCount, setCheckedCount] = useState<number>(0);
const [importId, setImportId] = useState<string>('');

const [currentRegion, setCurrentRegion] = useState<string>('中之島'); // 初期値は中之島

const departmentId = useParams().departmentId!;

// 日付は現在の日付をYYYYMMDD形式で取得
// const today = new Date();
// const date = formatDateToJST(today);
const date="20250609"

const itemName = departmentId === 'kakou2' ? '柔らかロースとんかつ' : '棒ヒレカツ';

// 箱数の計算ロジック（修正版）
const calculateBoxes = (itemCount: number): { boxCount: number, isOdd: boolean } => {
    // 注文数が奇数かどうか
    const isOdd = itemCount % 2 !== 0;
    
    // 箱数: 注文数÷2（端数切り上げ）
    const boxCount = Math.ceil(itemCount / 2);
    
    return { boxCount, isOdd };
};

// 注文データの取得
useEffect(() => {
    const fetchOrders = async () => {
        console.log(departmentId)
    try {
        setLoading(true);
        const importResult= await resolveImportId(date,departmentId)
        if (!importResult) {
        setError('有効な importId が見つかりませんでした');
        return;
        }
        setImportId(importResult.importId)
        // sortingPhase に基づいて currentRegion を設定
        if (importResult.sortingPhase === 'COMPLETED_NAKANOSHIMA') {
        // 中之島エリアが完了している場合は上越に切り替え
        setCurrentRegion('上越');
        } else {
        // それ以外の場合は中之島をデフォルトに
        setCurrentRegion('中之島');
        }

        const { data } = await client.models.Order.listOrdersByDeptAndImport({
            date: date,
            departmentIdImportId: {
                eq: {
                departmentId: departmentId,
                importId: importResult.importId
                }
            }
        });
        
        // storeTc === currentRegion の注文だけ残す
        const filteredOrders = (data || []).filter(order => order.storeTc === currentRegion);

        if (filteredOrders.length > 0) {
        setOrders(filteredOrders);
        
        // 計算を実行
        const calcs = filteredOrders.map(order => {
            const { boxCount, isOdd } = calculateBoxes(order.itemCount);
            return {
            storeId: order.storeId,
            storeName: order.storeName,
            itemCount: order.itemCount,
            boxCount,
            checked: false,
            isOdd
            };
        }).sort((a, b) => {
            // isOddがtrueのものを先に
            if (a.isOdd && !b.isOdd) return -1;
            if (!a.isOdd && b.isOdd) return 1;
            return 0;
        });
        
        setCalculations(calcs);
        
        // 合計箱数を計算
        const total = calcs.reduce((sum, item) => sum + item.boxCount, 0);
        setTotalBoxes(total);
        } else {
        setError("該当する注文データが見つかりませんでした");
        }
    } catch (err) {
        console.error("注文データの取得に失敗しました:", err);
        setError("注文データの取得に失敗しました");
    } finally {
        setLoading(false);
    }
    };
    
    fetchOrders();
}, []);

// チェックボックスの状態変更
const handleCheckboxChange = (storeId: string) => {
    setCalculations(prev => {
    const updated = prev.map(calc => {
        if (calc.storeId === storeId) {
        return { ...calc, checked: !calc.checked };
        }
        return calc;
    });
    
    // チェック済み数を更新
    const checkedItems = updated.filter(item => item.checked).length;
    setCheckedCount(checkedItems);
    
    return updated;
    });
};

// 箱数確定処理
const confirmBoxes = async () => {
    try {
    setLoading(true);
    
    // 各店舗の箱数をBoxテーブルに保存
    const savePromises = calculations.map(calc => {
        const boxData: BoxData = {
        date: date,
        storeId: calc.storeId,
        storeName: calc.storeName || "",
        storeTc: orders.find(o => o.storeId === calc.storeId)?.storeTc || "",
        boxColor: "green",
        boxCount: calc.boxCount,
        departmentId: departmentId as string,
        status: "CONFIRMED"
        };
        return client.models.Box.create(boxData);
    });
    
    await Promise.all(savePromises);
    
    // 注文のステータスを更新
    const updatePromises = orders.map(order => {
        return client.models.Order.update({
            importId: order.importId,
            date: order.date,
            storeId: order.storeId,
            itemId: order.itemId,
            status: "DONE"
        });
    });
    
    await Promise.all(updatePromises);

    if(currentRegion==="中之島"){
    // ImportWorkStatus の sortingPhase を COMPLETED_NAKANOSHIMA に更新
    await client.models.ImportWorkStatus.update({
        date: date,
        departmentId: departmentId as string,
        importId: importId,
        sortingPhase: 'COMPLETED_NAKANOSHIMA'
    });
    }
    
    
    alert("箱数を確定しました");
    
    // 全てのチェックをリセット
    setCalculations(prev => prev.map(calc => ({ ...calc, checked: false })));
    setCheckedCount(0);
    
    } catch (err) {
    console.error("箱数の確定に失敗しました:", err);
    setError("箱数の確定に失敗しました");
    } finally {
    setLoading(false);
    }
};

if (loading && orders.length === 0) {
    return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
    );
}


return (
    <Container maxWidth="md" sx={{ py: 4 }}>
    {/* ヘッダー */}
    <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
        {itemName}
        </Typography>
    </Box>
    <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 'bold', fontSize: '1.3rem', color: 'text.primary' }}>
        <strong>{currentRegion}</strong>
        </Typography>

    {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        </Alert>
    )}

    {/* メインコンテンツ - テーブル */}
    <TableContainer component={Paper} sx={{ mb: 4 }}>
    <Table>
        <TableHead>
        <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>店舗番号</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>店舗名</TableCell>
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>注文数</TableCell>
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>箱数</TableCell>
            <TableCell align="center" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>確認</TableCell>
        </TableRow>
        </TableHead>
        <TableBody>
        {calculations.map((calc) => (
            <TableRow 
            key={calc.storeId}
            sx={{ 
                bgcolor: calc.isOdd ? 'rgba(255, 235, 205, 0.5)' : 'inherit',
                '&:hover': { bgcolor: calc.isOdd ? 'rgba(255, 235, 205, 0.7)' : 'rgba(0, 0, 0, 0.04)' }
            }}
            >
            <TableCell sx={{ fontSize: '1rem' }}>{calc.storeId}</TableCell>
            <TableCell sx={{ fontSize: '1rem' }}>{calc.storeName}</TableCell>
            <TableCell align="right" sx={{ fontSize: '1rem' }}>{calc.itemCount}</TableCell>
            <TableCell align="right" sx={{ fontSize: '1rem' }}>{calc.boxCount}</TableCell>
            <TableCell align="center">
                <Checkbox 
                checked={calc.checked} 
                onChange={() => handleCheckboxChange(calc.storeId)}
                sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                />
            </TableCell>
            </TableRow>
        ))}
        </TableBody>
    </Table>
    </TableContainer>

    {/* フッター */}
    <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
    }}>
        <Box>
        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
            合計箱数: <strong>{totalBoxes}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '1rem' }}>
            確認済み: {checkedCount} / {calculations.length}
        </Typography>
        </Box>
        <Button 
        variant="contained" 
        color="primary" 
        disabled={checkedCount < calculations.length || loading}
        onClick={confirmBoxes}
        sx={{ fontSize: '1.1rem', py: 1, px: 3 }}
        >
        {loading ? <CircularProgress size={24} /> : "箱数確定"}
        </Button>
    </Box>
    </Container>
);
};

export default SpecialSorting;