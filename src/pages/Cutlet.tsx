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

const client = generateClient<Schema>();

// 型定義
interface OrderData {
importId: string;
date: string;
storeId: string;
storeName: string;
storeTc: string;
itemId: string;
itemName: string;
itemFormalName: string;
itemCount: number;
departmentId: string;
departmentName: string;
status: string;
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
storeName: string;
itemCount: number;
boxCount: number;
checked: boolean;
isOdd: boolean;
}

// テストデータ（注文数を1/10に修正）
const testOrderData: OrderData[] = [
{
    "importId": "20250606_103000",
    "date": "20250606",
    "storeId": "001",
    "storeName": "中央店",
    "storeTc": "中之島",
    "itemId": "210001",
    "itemName": "ロースカツ",
    "itemFormalName": "ロースカツキット",
    "itemCount": 5,  // 50個を表す
    "departmentId": "sakurai",
    "departmentName": "櫻井",
    "status": "PENDING"
},
{
    "importId": "20250606_103000",
    "date": "20250606",
    "storeId": "002",
    "storeName": "東店",
    "storeTc": "中之島",
    "itemId": "210001",
    "itemName": "ロースカツ",
    "itemFormalName": "ロースカツキット",
    "itemCount": 7,  // 70個を表す
    "departmentId": "sakurai",
    "departmentName": "櫻井",
    "status": "PENDING"
},
{
    "importId": "20250606_103000",
    "date": "20250606",
    "storeId": "003",
    "storeName": "西店",
    "storeTc": "上越",
    "itemId": "210001",
    "itemName": "ロースカツ",
    "itemFormalName": "ロースカツキット",
    "itemCount": 4,  // 40個を表す
    "departmentId": "sakurai",
    "departmentName": "櫻井",
    "status": "PENDING"
},
{
    "importId": "20250606_103000",
    "date": "20250606",
    "storeId": "004",
    "storeName": "南店",
    "storeTc": "上越",
    "itemId": "210002",
    "itemName": "棒ヒレカツ",
    "itemFormalName": "棒ヒレカツキット",
    "itemCount": 3,  // 30個を表す
    "departmentId": "sakurai",
    "departmentName": "櫻井",
    "status": "PENDING"
},
{
    "importId": "20250606_103000",
    "date": "20250606",
    "storeId": "005",
    "storeName": "北店",
    "storeTc": "中之島",
    "itemId": "210002",
    "itemName": "棒ヒレカツ",
    "itemFormalName": "棒ヒレカツキット",
    "itemCount": 6,  // 60個を表す
    "departmentId": "sakurai",
    "departmentName": "櫻井",
    "status": "PENDING"
}
];

const AutoBoxCalculationScreen: React.FC = () => {
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [itemId, setItemId] = useState<string>("210001"); // デフォルトはロースカツ
const [itemName, setItemName] = useState<string>("ロースカツ");
const [orders, setOrders] = useState<OrderData[]>([]);
const [calculations, setCalculations] = useState<StoreCalculation[]>([]);
const [totalBoxes, setTotalBoxes] = useState<number>(0);
const [checkedCount, setCheckedCount] = useState<number>(0);

// 日付は現在の日付をYYYYMMDD形式で取得
const today = new Date();
const date = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
const departmentId = "sakurai";

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
    try {
        setLoading(true);
        
        // 本番環境では以下のようにAPIから取得
        // const { data } = await client.models.Order.list({
        //   filter: {
        //     date: { eq: date },
        //     departmentId: { eq: departmentId },
        //     itemId: { eq: itemId },
        //     status: { eq: 'PENDING' }
        //   }
        // });
        
        // テスト用データを使用
        const data = testOrderData.filter(order => order.itemId === itemId);
        
        if (data && data.length > 0) {
        setOrders(data);
        setItemName(data[0].itemName);
        
        // 計算を実行
        const calcs = data.map(order => {
            const { boxCount, isOdd } = calculateBoxes(order.itemCount);
            return {
            storeId: order.storeId,
            storeName: order.storeName,
            itemCount: order.itemCount,
            boxCount,
            checked: false,
            isOdd
            };
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
}, [itemId]);

// 商品切り替え
const toggleItem = () => {
    setItemId(prev => prev === "210001" ? "210002" : "210001");
};

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
    
    // 箱の色を商品IDから決定
    const boxColor = itemId === "210001" ? "green" : "blue";
    
    // 各店舗の箱数をBoxテーブルに保存
    const savePromises = calculations.map(calc => {
        const boxData: BoxData = {
        date,
        storeId: calc.storeId,
        storeName: calc.storeName,
        storeTc: orders.find(o => o.storeId === calc.storeId)?.storeTc || "",
        boxColor,
        boxCount: calc.boxCount,
        departmentId,
        status: "CONFIRMED"
        };
        
        // 本番環境では以下のようにAPIで保存
        // return client.models.Box.create(boxData);
        
        // テスト用に成功を返す
        return Promise.resolve({ success: true, data: boxData });
    });
    
    await Promise.all(savePromises);
    
    // 注文のステータスを更新
    const updatePromises = orders.map(order => {
        // 本番環境では以下のようにAPIで更新
        // return client.models.Order.update({
        //   importId: order.importId,
        //   date: order.date,
        //   storeId: order.storeId,
        //   itemId: order.itemId,
        //   status: "DONE"
        // });
        
        // テスト用に成功を返す
        return Promise.resolve({ success: true });
    });
    
    await Promise.all(updatePromises);
    
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
        <Button variant="outlined" onClick={toggleItem}>
        {itemId === "210001" ? "棒ヒレカツに切替" : "ロースカツに切替"}
        </Button>
    </Box>

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
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>箱数</TableCell>
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>注文数</TableCell>
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
            <TableCell align="right" sx={{ fontSize: '1rem' }}>{calc.boxCount}</TableCell>
            <TableCell align="right" sx={{ fontSize: '1rem' }}>{calc.itemCount}</TableCell>
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

export default AutoBoxCalculationScreen;