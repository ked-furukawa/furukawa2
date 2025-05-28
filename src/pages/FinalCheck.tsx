import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography } from "@mui/material";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

type Box = Schema['Box']['type'];
const boxClient = generateClient<Schema>();

// 店舗集計データの型
interface StoreBoxSummary {
    storeId: string;
    storeName: string;
    storeTc: string;
    greenBoxes: number;
    redBoxes: number;
    blueBoxes: number;
    yellowBoxes: number;
}


export const FinalCheck = () => {
    const [storeData, setStoreData] = useState<StoreBoxSummary[]>([]);  

    useEffect(() => {       
    const sub = boxClient.models.Box.observeQuery().subscribe({ //Boxテーブルの変更をサブスクライブ
        next: ({ items }) => { //変更があった際に呼び出される処理、filterしてないのでBoxテーブル全体がitemsに入っている
            const storeMap = items.map(item => ({ //itemsの中身をこの画面で使いたい形にマッピング
                date: item.date,
                storeId: item.storeId,
                storeName: item.storeName,
                storeTc: item.storeTc,

                greenBoxes: item.color === 'green' ? item.boxCount : 0,
                redBoxes: item.color === 'red' ? item.boxCount : 0,
                blueBoxes: item.color === 'blue' ? item.boxCount : 0,
                yellowBoxes: item.color === 'yellow' ? item.boxCount : 0
            })) //マッピングしたものはstoreMapに入っている、以降はこれを使う

            aggregateStoreData(storeMap);
        },
        error: (err) => {
        console.error('データ取得エラー:', err);
        }
    });

    return () => sub.unsubscribe();
    }, []);


  // 店舗データの集計
    const aggregateStoreData = (storeMap: any) => {
        const aggregatedMap = new Map<string, StoreBoxSummary>();

        storeMap.forEach((item: StoreBoxSummary) => {
            if (!aggregatedMap.has(item.storeId)) {
                aggregatedMap.set(item.storeId, {
                    ...item, // 最初の1件を元に初期化
                    greenBoxes: 0,
                    redBoxes: 0,
                    blueBoxes: 0,
                    yellowBoxes: 0
                });
            }
        const aggregated = aggregatedMap.get(item.storeId)!;
            aggregated.greenBoxes += item.greenBoxes;
            aggregated.redBoxes += item.redBoxes;
            aggregated.blueBoxes += item.blueBoxes;
            aggregated.yellowBoxes += item.yellowBoxes;
        });
        const result = Array.from(aggregatedMap.values());
        setStoreData(result)
    };

    return (
    <div>
    <Box sx={{display: 'flex', // フレックスボックスにする
        justifyContent: 'center', 
        alignItems: 'center', minHeight:'100vh', width: '100%', p: 3 }}>
    <Typography variant="h5" component="h2" gutterBottom>
        店舗別箱数一覧
    </Typography>
    
    <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="店舗データテーブル">
            <TableHead>
            <TableRow> 
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗番号</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗名</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>TC</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'white' }}>トートーbox</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'white' }}>トートーbox</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}>トートーbox</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light', color: 'white' }}>トートーbox</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>合計</TableCell>
            </TableRow>
            </TableHead>
            <TableBody>
            {storeData.map((store) => (
                <TableRow key={store.storeId} hover>
                <TableCell>{store.storeId}</TableCell>
                <TableCell>{store.storeName}</TableCell>
                <TableCell>{store.storeTc}</TableCell>
                <TableCell  //店舗IDごとの箱の合計
                    align="right"
                    sx={{ bgcolor: 'success.light', fontWeight: 'medium' }}
                >
                    {store.greenBoxes}
                </TableCell>
                <TableCell 
                    align="right"
                    sx={{ bgcolor: 'error.light', fontWeight: 'medium' }}
                >
                    {store.redBoxes}
                </TableCell>
                <TableCell 
                    align="right" 
                    sx={{ bgcolor: 'primary.light', fontWeight: 'medium' }}
                >
                    {store.blueBoxes}
                </TableCell>
                <TableCell 
                    align="right" 
                    sx={{ bgcolor: 'warning.light', fontWeight: 'medium' }}
                >
                    {store.yellowBoxes}
                </TableCell>
                <TableCell //店舗IDごとの全ての合計
                    align="right"
                    sx={{ fontWeight: 'bold' }}
                >
                    {store.greenBoxes + store.redBoxes + store.blueBoxes + store.yellowBoxes}
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </TableContainer>
    </Box>
    {/* <Box sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 2,
        display: 'flex',
        justifyContent: 'center',
        gap: 2,
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        zIndex: 1100,
    }}>

    </Box> */}
    </div>
    );
};


export default FinalCheck;