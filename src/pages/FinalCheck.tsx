import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Button, Tooltip, Dialog, DialogTitle, IconButton, DialogContent, List, ListItem, ListItemText, Divider, Tab, Tabs } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

type Box = Schema['Box']['type'];
const boxClient = generateClient<Schema>();

//excel出力用
import ExcelJS from 'exceljs';
import { createDetailListFromTemplate } from '../components/utils/createDetailListFromTemplate';
import { downloadData } from 'aws-amplify/storage';
import { saveAs } from 'file-saver';
import theme from "../theme/theme";
import React from "react";

// 店舗集計データの型
interface StoreBoxSummary {
    date: string,
    storeId: string;
    storeName: string;
    storeTc: string;
    greenBoxes: number;
    redBoxes: number;
    blueBoxes: number;
    yellowBoxes: number;
}
type StoreData = {
    date: string;
    storeId: string;
    boxColor: string;
    boxCount: number;
    departmentId: string;
    storeName: string | null;
    storeTc: string | null;
    status: string | null;
    readonly createdAt: string;
    readonly updatedAt: string;
};


export const FinalCheck = () => {
    const [storeData, setStoreData] = useState<StoreBoxSummary[]>([]);  
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [isAllDone, setIsAllDone] = useState(false);

    const [tabValue, setTabValue] = useState(0);//タブ切り替え用state

    const [open, setOpen] = useState(false);//モーダル用state
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [boxDetails, setBoxDetails] = useState<StoreData[]>([]);

    useEffect(() => {
    const sub = boxClient.models.Box.observeQuery({
    filter: {
        date: {
        eq: selectedDate?.toISOString().split('T')[0].replace(/-/g, '') || ''
        }
    }
    }).subscribe({ //Boxテーブルの変更をサブスクライブ
        next: ({ items }) => { //変更があった際に呼び出される処理、filterしてないのでBoxテーブル全体がitemsに入っている
            let filteredItems: Box[];
            //第二工場にある部門のID一覧
            const dai2 = ['1souzai', '2souzai', '3souzai', 'namashitsu1', 'namashitu2'];
            if (tabValue === 2) {
        // 惣菜・生質のみ
        filteredItems = items.filter(
            (item) => item != null && dai2.includes(item.departmentId)
            );
        } else if (tabValue === 1) {
            // 上記以外
            filteredItems = items.filter(
            (item) => item != null && !dai2.includes(item.departmentId)
            );
        } else {
            // 全件
            filteredItems = items.filter((item) => item != null);
        }
        const storeMap = filteredItems.filter((item:Box)=>item !=null)
        .map(item => ({ //itemsの中身をこの画面で使いたい形にマッピング
            date: item.date,
            storeId: item.storeId,
            storeName: item.storeName,
            storeTc: item.storeTc,
            departmentId: item.departmentId,

            greenBoxes: item.boxColor === 'green' ? item.boxCount : 0,
            redBoxes: item.boxColor === 'red' ? item.boxCount : 0,
            blueBoxes: item.boxColor === 'blue' ? item.boxCount : 0,
            yellowBoxes: item.boxColor === 'yellow' ? item.boxCount : 0
        })) //マッピングしたものはstoreMapに入っている、以降はこれを使う

        aggregateStoreData(storeMap);
        },
        error: (err) => {
        console.error('データ取得エラー:', err);
        }
    });

    return () => sub.unsubscribe();
    }, [selectedDate,tabValue]);

    useEffect(() => {//完了状態を監視
        const sub = boxClient.models.ImportWorkStatus.observeQuery({
            filter: {
            date: {
                eq: selectedDate?.toISOString().split('T')[0].replace(/-/g, '') || ''
            }
            }
        }).subscribe({
            next: ({ items }) => {
                const filtered = items.filter(item => item != null);
                const allDone = filtered.length > 0 && filtered.every(item => item.importProgress === 'DONE');
                setIsAllDone(allDone);
            },
            error: (err) => {
            console.error('ImportWorkStatusデータ取得エラー:', err);
            }
        });

        return () => sub.unsubscribe();
        }, [selectedDate]);


    const getDetailDataSomehow = () =>{
        console.log("storeData",storeData)
        return storeData
    }

    const handleDownloadExcel = async() => {
        try{
        // Downloads file content to memory
        const { body ,eTag } = await downloadData({
        path: "excel-files/納品箱数明細票テンプレート.xlsx"
        }).result;
        console.log('eTag',eTag)
        console.log('body',body)

        // 明示的に Blob にキャスト
        const blob = body as unknown as Blob;
        const arrayBuffer = await blob.arrayBuffer();

        // ExcelJSで読み込み
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(arrayBuffer);

            // 明細データを取得（例）
        const detailData = getDetailDataSomehow();
        console.log("detailData",detailData)

            // テンプレートにデータを書き込む
        createDetailListFromTemplate(workbook, detailData);

            // ファイル出力
        const buffer = await workbook.xlsx.writeBuffer();
        const newBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        saveAs(newBlob, `納品箱数明細票_${new Date().toISOString().slice(0, 10)}.xlsx`);

        } catch (error) {
            console.error('Excel ファイルのダウンロードまたは処理中にエラーが発生しました:', error);
        }

    };

    const DateSelector = () => { //カレンダーで日付指定

    return (
        <Box
        sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
        }}
        >
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
            label="日付を選択"
            value={selectedDate}
            onChange={(newDate) => setSelectedDate(newDate)}
            slotProps={{
                textField: {
                size: 'small',
                variant: 'outlined',
                },
            }}
            />
        </LocalizationProvider>
        </Box>
    );
    };


    //タブ切り替え用関数
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    };

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
        <Box>
        <Typography variant="subtitle1" sx={{ fontSize :'1.5rem', }}>
            {title}
        </Typography>
        <TableContainer component={Paper} sx={{  minWidth: 100 }}>
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }}>
            <TableHead>
                <TableRow>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'success.light', boxColor: 'white', }}>Box緑</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'error.light', boxColor: 'white', }}>Box赤</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.light', boxColor: 'white', }}>Box青</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light', boxColor: 'white', }}>Box黄</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white', }}>合計</TableCell>
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

    // 箱詳細情報を取得する関数
    const fetchBoxDetails = async (storeId:string, date:string) => {
    try {
        const response = await boxClient.models.Box.listBoxesByDateAndStore({
        date: date,
        storeId: { eq: storeId }
        });
        
        console.log('取得した箱情報:', response.data);
        setBoxDetails(response.data || []);
    } catch (error) {
        console.error('箱情報の取得エラー:', error);
        setBoxDetails([]);
    }
    };

    const handleStoreClick = async(store:StoreBoxSummary) => {//モーダル開閉用関数
        setSelectedStoreId(store.storeId);
        setOpen(true);
        // 箱詳細情報を取得
        await fetchBoxDetails(store.storeId, selectedDate?.toISOString().split('T')[0].replace(/-/g, '')||'');
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedStoreId('');
    };

    return (
    <Box sx={{ //表部分の親Box
        display: 'flex',
        flexDirection: 'row', // ← 横並びにする
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        width: '100%',
        height: '100vh',
        gap: 3, // 間のスペース

    }}>
        <DateSelector />
    <Box sx={{display: 'flex', //左表Box
        justifyContent: 'flex-start', flexDirection: 'column',
        alignItems: 'flex-start', minHeight:'100vh', width: '100%', pt:10, pl:8}}>
    <Typography variant="h5" component="h2" gutterBottom sx={{ alignSelf: 'flex-start' }}>
        店舗別箱数一覧
    </Typography>
    <Tabs value={tabValue} onChange={handleTabChange} sx={{ mb: 2 }}>
        <Tab label="センター" />
        <Tab label="本社工場" />
        <Tab label="第二工場" />
    </Tabs>

    
    <TableContainer component={Paper} sx={{ width: '100%',maxHeight: '600px',  overflowY: 'auto', mt: 2 }}>
        <Table stickyHeader aria-label="店舗データテーブル" >
            <TableHead>
            <TableRow> 
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>TC</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>店舗番号</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>店舗名</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light', boxColor: 'white' }}>トートーbox緑</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'error.light', boxColor: 'white' }}>トートーbox赤</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', boxColor: 'white' }}>トートーbox青</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light', boxColor: 'white' }}>トートーbox黄</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white',width: '15%' }}>合計</TableCell>
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
                <TableCell 
                    sx={{ 
                    cursor: 'pointer', 
                    color: 'primary.main', 
                    textDecoration: 'underline',
                    '&:hover': {
                        backgroundColor: 'primary.light',
                        color: 'white'
                    }
                    }}
                    onClick={() => handleStoreClick(store)}
                >
                    {store.storeId}
                </TableCell>
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
     {/* モーダル */}
    <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        >
        <DialogTitle sx={{ 
            bgcolor: theme.palette.primary.main, 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: 2,
            px: 3
        }}>
            <Typography variant="h6" component="div" sx={{ 
            fontWeight: 'bold',
            fontSize:  '1.5rem'
            }}>
            店舗CD:{selectedStoreId} - 箱数詳細
            </Typography>
            <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose}
            aria-label="close"
            >
            <CloseIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
                {boxDetails.length > 0 ? (
                <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    <ListItem sx={{ 
                    bgcolor: '#f5f5f5', 
                    py: 1.5,
                    borderBottom: '1px solid #e0e0e0'
                    }}>
                    <ListItemText 
                        primary={
                        <Typography 
                            variant="subtitle1" 
                            sx={{ 
                            fontWeight: 'bold',
                            fontSize: '1.3rem' 
                            }}
                        >
                            部門名
                        </Typography>
                        } 
                        sx={{ flex: 2 }}
                    />
                    <ListItemText 
                        primary={
                        <Typography 
                            variant="subtitle1" 
                            align="right"
                            sx={{ 
                            fontWeight: 'bold',
                            fontSize:'1.3rem'
                            }}
                        >
                            色
                        </Typography>
                        } 
                        sx={{ flex: 1 }}
                    />
                    <ListItemText 
                        primary={
                        <Typography 
                            variant="subtitle1" 
                            align="right"
                            sx={{ 
                            fontWeight: 'bold',
                            fontSize:'1.3rem'
                            }}
                        >
                            箱数
                        </Typography>
                        } 
                        sx={{ flex: 1 }}
                    />
                    </ListItem>
                    
                    {boxDetails.map((box, index) => (
                    <React.Fragment key={`${box.storeId}-${index}`}>
                        <ListItem sx={{ 
                        py: 2,
                        '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                        }}>
                        <ListItemText 
                            primary={
                            <Typography 
                                variant="body1"
                                sx={{ 
                                fontSize: '1.2rem',
                                fontWeight: 500
                                }}
                            >
                                {box.departmentId === '1souzai' ? '惣菜1' :
                                box.departmentId === '2souzai' ? '惣菜2' :
                                box.departmentId === '3souzai' ? '惣菜3' :
                                box.departmentId === 'kakou1' ? '加工' :
                                box.departmentId === 'kakou2' ? '加工' :
                                box.departmentId === 'seiniku' ? '精肉' :
                                box.departmentId === 'namashitsu1' ? '生室' :
                                box.departmentId === 'namashitsu2' ? '生室' :
                                box.departmentId === 'honsyabuturyu' ? '本社物流' :
                                box.departmentId === 'seika' ? '青果' :
                                box.departmentId === 'kurosawa' ? '黒澤(テスト用)' :
                                box.departmentId === 'furukawa' ? '古川(テスト用)' :
                                box.departmentId === 'sakurai' ? '櫻井(テスト用)' :
                                box.departmentId}
                            </Typography>
                            } 
                            sx={{ flex: 2 }}
                        />
                        <ListItemText 
                            primary={
                            <Typography 
                                variant="body1" 
                                align="right"
                                sx={{ 
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                                }}
                            >
                                {box.boxColor === 'red' ? '赤色' : 
                                box.boxColor === 'blue' ? '青色' : 
                                box.boxColor === 'green' ? '緑色' : 
                                box.boxColor === 'yellow' ? '黄色' :
                                `${box.boxColor}色`}
                            </Typography>
                            } 
                            sx={{ flex: 1 }}
                        />
                        <ListItemText 
                            primary={
                            <Typography 
                                variant="body1" 
                                align="right"
                                sx={{ 
                                fontSize: '1.2rem',
                                fontWeight: 'bold'
                                }}
                            >
                                {box.boxCount}個
                            </Typography>
                            } 
                            sx={{ flex: 1 }}
                        />
                        </ListItem>
                        {index < boxDetails.length - 1 && <Divider />}
                    </React.Fragment>
                    ))}
                </List>
                ) : (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                    データがありません
                    </Typography>
                </Box>
                )}
            </DialogContent>
        </Dialog>
    </Box>

    <Box //右表Box
    sx={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minHeight: '100vh',
    width:'450px',
    pt: 10,
    pr: 8,
    gap: 2,
    }}
>
    <SummaryTable title="全体 合計" total={totalAll} />
    <SummaryTable title="中之島物流センター 合計" total={totalNakanoshima} />
    <SummaryTable title="上越物流センター 合計" total={totalJyoetsu} />
    <Tooltip title="仕分け作業が完了していません">
    <span>
        <Button
        sx={{
            mt: "100px",
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
            backgroundColor: 'primary.dark',
            },
            '&.Mui-disabled': {
            backgroundColor: 'grey.400',
            color: 'white',
            },
        }}
        onClick={handleDownloadExcel}
        disabled={!true}
        >
        明細表をダウンロード
        </Button>
    </span>
    </Tooltip>
    </Box>
    </Box>
    );
};


export default FinalCheck;