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
Alert,
Dialog,
DialogTitle,
DialogContent,
DialogActions
} from '@mui/material';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useParams } from 'react-router-dom';
// import { formatDateToJST } from '../components/utils/formatDateToJST';
import { resolveImportId } from '../components/utils/resolveImportId';
import { formatDateToJST } from '../components/utils/formatDateToJST';

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
storeTc: string|null,
itemCount: number;
boxCount: number;
checked: boolean;
isOdd: boolean;
}
interface SpecialSortingProps {
    navigateTo: (key: string) => void;
}

type Phase = 'UNDONE' | 'ODD' | 'EVEN' | 'DONE';


const SpecialSorting: React.FC<SpecialSortingProps> = ({navigateTo}) => {
const [loading, setLoading] = useState<boolean>(true);
const [error, setError] = useState<string | null>(null);
const [orders, setOrders] = useState<OrderData[]>([]);
const [calculations, setCalculations] = useState<StoreCalculation[]>([]);
const [totalBoxes, setTotalBoxes] = useState<number>(0);
const [checkedCount, setCheckedCount] = useState<number>(0);
const [importId, setImportId] = useState<string>('');

const [currentRegion, setCurrentRegion] = useState<string>('中之島'); // 初期値は中之島
const [savingData, setSavingData] = useState<boolean>(false);
const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);

const [phase, setPhase] = useState<Phase>('UNDONE');
const [hasPending, setHasPending] = useState(false);


const departmentId = useParams().departmentId!;

// 日付は現在の日付をYYYYMMDD形式で取得
// const today = new Date();
const date = formatDateToJST(new Date);
// const date="20250609"

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
    const fetchImportResult = async () => {
        console.log(departmentId)
    try {
        setLoading(true);
        const importResult= await resolveImportId(date,departmentId)
        if (!importResult) {
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
        } catch (err) {
        console.error("importIdの取得に失敗しました:", err);
        setError("importIdの取得に失敗しました");
    } finally {
        setLoading(false);
    }
    };
    fetchImportResult();
}, []);

useEffect(() => {
    const fetchOrders = async () => {
        console.log(departmentId)
        setCheckedCount(0)
    try {
        const { data } = await client.models.Order.listOrdersByDeptAndImport({
            date: date,
            departmentIdImportId: {
                eq: {
                departmentId: departmentId,
                importId: importId
                }
            }
        });

        if (data.length > 0) {
        // 計算を実行
        const calcs = data.map(order => {
            const { boxCount, isOdd } = calculateBoxes(order.itemCount);
            return {
            storeId: order.storeId,
            storeName: order.storeName,
            storeTc: order.storeTc,
            itemCount: order.itemCount,
            boxCount,
            checked: false,
            isOdd
            };
        }).sort((a, b) => {
            // isOddがtrueのものを後に
            if (!a.isOdd && b.isOdd) return -1;
            if (a.isOdd && !b.isOdd) return 1;
            return 0;
        });
        let filteredCalcs = calcs
        if(phase==="UNDONE"){
            filteredCalcs = calcs.filter(order => order.storeTc === currentRegion)
            const filteredOrders =data.filter(order => order.storeTc === currentRegion)
            setOrders(filteredOrders);
            console.log("filteredCalcs",filteredCalcs)
        }else if(phase==="ODD"){
            filteredCalcs = calcs.filter(order =>order.isOdd === true)
            console.log("filteredCalcs",filteredCalcs)
        }else if(phase==="EVEN"){
            filteredCalcs = calcs
            console.log("filteredCalcs",filteredCalcs)
        }else{
            filteredCalcs = []
            console.log("filteredCalcs",filteredCalcs)
        }
        
        setCalculations(filteredCalcs);
        
        // 合計箱数を計算
        const total = filteredCalcs.reduce((sum, item) => sum + item.boxCount, 0);
        setTotalBoxes(total);
        }
    } catch (err) {
        console.error("注文データの取得に失敗しました:", err);
        setError("注文データの取得に失敗しました");
    } finally {
        setLoading(false);
    }
    };
    
    fetchOrders();
}, [importId,phase]);

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
const navigateToNextStore = async () => {
    try {
    setLoading(true);
    setSavingData(true);

    if(phase==="UNDONE"){//一回目だけ保存処理
    // 各店舗の箱数をBoxテーブルに保存
    const savePromises = calculations.map(calc => {
        const boxData: BoxData = {
        date: date,
        storeId: calc.storeId+importId,
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
    const updatePromises = orders.map(async order => {
        try {
        const result = await client.models.Order.update({
            importId: order.importId,
            date: order.date,
            storeId: order.storeId,
            itemId: order.itemId,
            departmentId: order.departmentId,
            status: 'DONE'
        });
        
        if (result.errors && result.errors.length > 0) {
            throw new Error(`更新エラー: ${result.errors[0].message}`);
        }
        
        return result;
        } catch (error) {
        throw error;
        }
    });
    
    await Promise.all(updatePromises);

    let sortingPahse='COMPLETED_NAKANOSHIMA'
    if(currentRegion!=="中之島"){
        sortingPahse='COMPLETED_JYOETSU'
    }
    // ImportWorkStatus の sortingPhase を COMPLETED_NAKANOSHIMA に更新
    await client.models.ImportWorkStatus.update({
        date: date,
        departmentId: departmentId as string,
        importId: importId,
        sortingPhase: sortingPahse,
        ...(sortingPahse==='COMPLETED_JYOETSU' && { importProgress: "DONE" })
    });
    }

    if(phase==='UNDONE'){
        if (currentRegion === "中之島") {
            navigateTo('SortingCheckScreen');
            } else {
            setPhase("EVEN");
            };
    }else if (phase === 'EVEN') {
        setPhase('ODD');
    } else {
        if(hasPending){
            navigateTo("SortingCheckScreen")
        }else{
            setPhase('DONE');
        }
    }
    console.log("phase",phase)
    } catch (err) {
    console.error("箱数の確定に失敗しました:", err);
    setError("箱数の確定に失敗しました");
    } finally {
    setLoading(false);
    setSavingData(false);
    setShowConfirmDialog(false);
    }
    };

    // 箱数確定処理
const navigateToCompletedScreen = async () => {
    try {
    setLoading(true);
    setSavingData(true);
    // 1. Boxデータ取得
    const response = await client.models.Box.listBoxesByDateAndDept({
      date: date,
      departmentId: {
        eq: departmentId
      }
    });

    const allBoxes = response.data;

    // 2. storeIdの先頭3文字でグループ化＆合算
    const grouped: { [key: string]: any } = {};

    allBoxes.forEach(box => {
    const prefix = box.storeId.slice(0, 3);
    if (!grouped[prefix]) {
        grouped[prefix] = { 
        date: box.date,
        storeId: prefix,
        storeName: box.storeName,
        storeTc: box.storeTc,
        boxColor: box.boxColor,  // 最初に見つかったboxColorを使用
        boxCount: 0,
        departmentId: box.departmentId,
        status: "DOUBLE_CHECKED"
        };
    }
    grouped[prefix].boxCount += box.boxCount;
    });

    // 3. 各prefixごとに新規レコードを作成
    const createPromises = Object.values(grouped).map(async (box) => {
        try {
            console.log('Creating box:', box); // デバッグ用
            const result = await client.models.Box.create(box);
            console.log('Created successfully:', result); // デバッグ用
            return result;
        } catch (error) {
            console.error('Failed to create box:', box, error);
            throw error;
        }
        });
    try {
        const results = await Promise.all(createPromises);
        console.log('All boxes created:', results);
        } catch (error) {
        console.error('Promise.all failed:', error);
        throw error;
        }

    // 4. phase を DONE に変更
    setPhase("DONE");
  } catch (err) {
    console.error("navigateToCompletedScreen error:", err);
    setError("集計に失敗しました");
  } finally {
    setLoading(false);
    setSavingData(false);
    setShowConfirmDialog(false);
    }
};
    const handleNextAction = () => {
    if (!hasPending && phase === "ODD") {
        // hasPending が false かつ phase が DONE のとき
        // 別の処理を行う
        navigateToCompletedScreen(); // ← 任意の関数
    } else {
        // 通常処理
        navigateToNextStore();
    }
    };

    async function handleDialogOpen() {
        const checkPendingStatus = async () => {
            const response = await client.models.ImportWorkStatus.list({
                filter: {
                    date: { eq: date },
                    departmentId: { eq: departmentId }
                }
            });

            const foundPending = response.data.some(status => status.importProgress === "PENDING");
            setHasPending(foundPending);
            return foundPending; // 結果を返す
        };

        const result = await checkPendingStatus(); // 結果を受け取る
        setHasPending(result); // 念のためもう一度セット（任意）
        setShowConfirmDialog(true); // 状態が確定してからダイアログを開く
    }

    // 確認ダイアログをキャンセルする関数
    function handleDialogCancel() {
        setShowConfirmDialog(false);
    }

    const getPhaseLabel = () => {//フェーズ表示テキスト
    if (phase === 'UNDONE') {
        return `${currentRegion} `;
    } else if (phase === 'ODD') {
        return `10枚入り箱の店舗リスト`;
    } else if (phase === 'EVEN') {
        return `全体箱数のダブルチェック`;
    } else if (phase === 'DONE') {
        return `本日の作業完了`;
    } else {
        return '';
    }
    };

    const itemCountLabel = (() => {//注文数位置のテキスト
    switch (phase) {
        case 'ODD':
        case 'EVEN':
        return '20枚箱数';
        default:
        return '注文数';
    }
    })();

    const boxCountLabel = (() => {//箱数位置のテキスト
    switch (phase) {
        case 'ODD':
        case 'EVEN':
        return '10枚箱数';
        default:
        return '箱数';
    }
    })();

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
        {getPhaseLabel()}
        </Typography>

    {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        </Alert>
    )}

    {/* メインコンテンツ - テーブル */}
    {phase === "DONE" ? (
  <Typography
    variant="h6"
    sx={{ textAlign: 'center', mt: 4, mb: 4, fontWeight: 'bold' }}
  >
    本日の作業は完了しました
  </Typography>
) : (
    <>
    <TableContainer component={Paper} sx={{ mb: 4 }}>
    <Table>
        <TableHead>
        <TableRow sx={{ bgcolor: 'primary.main' }}>
            <TableCell sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>TC</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>店舗番号</TableCell>
            <TableCell sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>店舗名</TableCell>
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>{itemCountLabel}</TableCell>
            <TableCell align="right" sx={{ color: 'primary.contrastText', fontSize: '1.1rem', fontWeight: 'bold' }}>{boxCountLabel}</TableCell>
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
            <TableCell sx={{ fontSize: '1rem' }}>{calc.storeTc}</TableCell>
            <TableCell sx={{ fontSize: '1rem' }}>{calc.storeId}</TableCell>
            <TableCell sx={{ fontSize: '1rem' }}>{calc.storeName}</TableCell>
            <TableCell align="right" sx={{ fontSize: '1rem' }}>
                {(phase === "EVEN"||phase==="ODD") && calc.isOdd
                ? calc.boxCount-1
                : (phase === "EVEN"||phase==="ODD") && !calc.isOdd
                ? calc.boxCount
                : calc.itemCount}
                </TableCell>
            <TableCell align="right" sx={{ fontSize: '1rem' }}>
                {(phase === "EVEN"||phase==="ODD") && calc.isOdd
                ? 1
                : (phase === "EVEN"||phase==="ODD") && !calc.isOdd
                ? 0 
                : calc.boxCount}
                </TableCell>
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
        onClick={handleDialogOpen}
        sx={{ fontSize: '1.1rem', py: 1, px: 3 }}
        >
        {loading ? <CircularProgress size={24} /> : "箱数確定"}
        </Button>
        <Dialog
        open={showConfirmDialog}
        onClose={handleDialogCancel}
      >
        <DialogTitle>次の作業に進みますか？</DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {
                currentRegion==="中之島" && phase==="UNDONE"
                ? '中之島の作業が完了しました。商品数確認画面に進みます。'
                :currentRegion!=="中之島" && phase==="UNDONE" 
                ? `上越の作業が完了しました。箱数のダブルチェックに進みます。`
                :phase==="EVEN"
                ? "全体箱数のダブルチェックが完了しました。10枚箱の店舗リストに進みます"
                :phase==="ODD" && hasPending
                ?"未仕分けの注文が追加されています。商品数確認画面に戻ります。"
                :"未仕分けの注文が存在しません。本日の作業を完了します。"
            }
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogCancel} disabled={savingData}>
            キャンセル
          </Button>
          <Button 
            onClick={handleNextAction} 
            color="primary" 
            variant="contained"
            disabled={savingData}
          >
            {savingData ? '保存中...' : '次へ進む'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
    </>
    )}
    </Container>
);
};

export default SpecialSorting;