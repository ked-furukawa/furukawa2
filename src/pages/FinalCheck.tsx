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
// interface TotalBoxSummary {
//     storeTc: string;
//     greenBoxes: number;
//     redBoxes: number;
//     blueBoxes: number;
//     yellowBoxes: number;
// }


export const FinalCheck = () => {
    const [storeData, setStoreData] = useState<StoreBoxSummary[]>([]);  

    useEffect(() => {       
    const sub = boxClient.models.Box.observeQuery().subscribe({ //Boxテーブルの変更をサブスクライブ
        next: ({ items }) => { //変更があった際に呼び出される処理、filterしてないのでBoxテーブル全体がitemsに入っている
            const storeMap = items.filter((item:Box)=>item !=null)
            .map(item => ({ //itemsの中身をこの画面で使いたい形にマッピング
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
    // const total = {
    //     green: storeData.reduce((sum, s) => sum + s.greenBoxes, 0),
    //     red: storeData.reduce((sum, s) => sum + s.redBoxes, 0),
    //     blue: storeData.reduce((sum, s) => sum + s.blueBoxes, 0),
    //     yellow: storeData.reduce((sum, s) => sum + s.yellowBoxes, 0),
    // };
    const nakanoshimaData = storeData.filter((s) => s.storeTc === '中之島');
    const jyoetsuData = storeData.filter((s) => s.storeTc !== '中之島');

    const calcTotal = (data:any) => ({ //合計するロジック
        green: data.reduce((sum: any, s: { greenBoxes: any; }) => sum + s.greenBoxes, 0),
        red: data.reduce((sum: any, s: { redBoxes: any; }) => sum + s.redBoxes, 0),
        blue: data.reduce((sum: any, s: { blueBoxes: any; }) => sum + s.blueBoxes, 0),
        yellow: data.reduce((sum: any, s: { yellowBoxes: any; }) => sum + s.yellowBoxes, 0),
    });

    const totalNakanoshima = calcTotal(nakanoshimaData); //各TCの合計
    const totalJyoetsu = calcTotal(jyoetsuData);
    const totalAll = calcTotal(storeData);

    type TotalType = { //合計表のための型定義
        green: number;
        red: number;
        blue: number;
        yellow: number;
    };

    type SummaryTableProps = {
        title: string;
        total: TotalType;
        fontSize?: string;
    };

    const SummaryTable = ({ title, total, fontSize = '1.5rem' }: SummaryTableProps) => { //右表の定義部分
    const cellStyle = (bgcolor?: string, isBold = false) => ({
        fontSize,
        bgcolor,
        fontWeight: isBold ? 'bold' : 'medium',
    });

    return (
        <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" sx={{ fontSize :'1.5rem', mb: 1 }}>
            {title}
        </Typography>
        <TableContainer component={Paper} sx={{  minWidth: 100 }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
                <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'white', }}>Box緑</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'white', }}>Box赤</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white', }}>Box青</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light', color: 'white', }}>Box黄</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white', }}>合計</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                <TableCell align="right" sx={cellStyle('success.light', true)}>{total.green}</TableCell>
                <TableCell align="right" sx={cellStyle('error.light', true)}>{total.red}</TableCell>
                <TableCell align="right" sx={cellStyle('primary.light', true)}>{total.blue}</TableCell>
                <TableCell align="right" sx={cellStyle('warning.light', true)}>{total.yellow}</TableCell>
                <TableCell align="right" sx={{ fontSize, fontWeight: 'bold' }}>
                    {total.green + total.red + total.blue + total.yellow}
                </TableCell>
                </TableRow>
            </TableBody>
            </Table>
        </TableContainer>
        </Box>
    
    );
    }

    return (
    <Box sx={{ //表部分の親Box
        display: 'flex',
        flexDirection: 'row', // ← 横並びにする
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        width: '100%',
        height: '100vh',
        pl: 0,
        gap: 3, // 間のスペース

    }}>
    <Box sx={{display: 'flex', //左表Box
        justifyContent: 'flex-start', flexDirection: 'column',
        alignItems: 'flex-start', minHeight:'100vh', width: '100%', p: 3,  }}>
    <Typography variant="h5" component="h2" gutterBottom sx={{ alignSelf: 'flex-start' }}>
        店舗別箱数一覧
    </Typography>
    
    <TableContainer component={Paper} sx={{ width: '100%',maxHeight: '600px',  overflowY: 'auto', mt: 2 }}>
        <Table stickyHeader aria-label="店舗データテーブル" >
            <TableHead>
            <TableRow> 
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>TC</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗番号</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗名</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'white' }}>トートーbox緑</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'white' }}>トートーbox赤</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}>トートーbox青</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light', color: 'white' }}>トートーbox黄</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white',width: '15%' }}>合計</TableCell>
            </TableRow>
            </TableHead>
            <TableBody >
            {[
                // 1. 中之島のデータ（昇順）
                ...storeData
                    .filter((s) => s.storeTc === '中之島')
                    .sort((a, b) => Number(a.storeId) - Number(b.storeId)),

                // 2. 上越のデータ（昇順）
                ...storeData
                    .filter((s) => s.storeTc !== '中之島')
                    .sort((a, b) => Number(a.storeId) - Number(b.storeId))
                
            ].map((store) => (
                <TableRow key={store.storeId} hover>
                <TableCell>{store.storeTc}</TableCell>
                <TableCell>{store.storeId}</TableCell>
                <TableCell>{store.storeName}</TableCell>
                <TableCell  //店舗IDごとの箱の合計
                    align="right"
                    sx={{ fontSize: '1.5rem' ,bgcolor: 'success.light', fontWeight: 'bold' }}
                >
                    {store.greenBoxes}
                </TableCell>
                <TableCell 
                    align="right"
                    sx={{ fontSize: '1.5rem' , bgcolor: 'error.light', fontWeight: 'bold' }}
                >
                    {store.redBoxes}
                </TableCell>
                <TableCell 
                    align="right" 
                    sx={{ fontSize: '1.5rem' , bgcolor: 'primary.light', fontWeight: 'bold' }}
                >
                    {store.blueBoxes}
                </TableCell>
                <TableCell 
                    align="right" 
                    sx={{ fontSize: '1.5rem' , bgcolor: 'warning.light', fontWeight: 'bold' }}
                >
                    {store.yellowBoxes}
                </TableCell>
                <TableCell //店舗IDごとの全ての合計
                    align="right"
                    sx={{ fontSize: '1.5rem' , fontWeight: 'bold' }}
                >
                    {store.greenBoxes + store.redBoxes + store.blueBoxes + store.yellowBoxes}
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
    </TableContainer>
    </Box>

    <Box //右表Box
    sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minHeight: '100vh',
    width:'450px',
    pt: 3,
    gap: 2,
    }}
>
    <SummaryTable title="全体 合計" total={totalAll} />
    <SummaryTable title="中之島物流センター 合計" total={totalNakanoshima} />
    <SummaryTable title="上越物流センター 合計" total={totalJyoetsu} />
    </Box>
    </Box>
    );
};


export default FinalCheck;