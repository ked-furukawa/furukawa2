import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Button, Tooltip, Dialog, DialogTitle, IconButton, DialogContent, List, ListItem, ListItemText, Divider, Tab, Tabs, ListItemButton } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
// import { StatusTemplate } from "../types";

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
    orangeBoxes: number;
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
type OrderItem = {
    importId: string;
    date: string;

    storeId: string;
    storeName?: string | null;
    storeTc?: string | null;

    itemId: string;
    itemName?: string | null;
    itemFormalName?: string | null;
    itemCount: number;

    departmentId: string;
    departmentName?: string | null;

    status?: string | null;
};


export const FinalCheck = () => {
    const [storeData, setStoreData] = useState<StoreBoxSummary[]>([]);  
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
    const [isAllDone, setIsAllDone] = useState(false);

    const [tabValue, setTabValue] = useState(0);//タブ切り替え用state

    const [open, setOpen] = useState(false);//モーダル用state
    const [selectedStoreId, setSelectedStoreId] = useState<string>('');
    const [openSecond, setOpenSecond] = useState(false);//二段階目モーダル用state
    const [selectedDepartmentName, setSelectedDepartmentName] = useState<string>('');

    const [boxDetails, setBoxDetails] = useState<StoreData[]>([]);
    const [orderDetails, setOrderDetails] = useState<OrderItem[]>([]);

    const [rawItems, setRawItems] = useState<Box[]>([]);

    useEffect(() => {
    const fetchData = async () => {
        try {
        const { data } = await boxClient.models.Box.listBoxesByDateAndDept({
              date: selectedDate?.toISOString().split('T')[0].replace(/-/g, '') || ''
            },
            {
            limit: 1000  // 最大1000件取得
            });
         // status = 'DOUBLE_CHECKED' でフィルタリング
        const doubleCheckedBoxes = (data ?? []).filter(box => box.status === 'DOUBLE_CHECKED');
        setRawItems(doubleCheckedBoxes); // データを保存
        } catch (err) {
        console.error('データ取得エラー:', err);
        }
    };
    fetchData();
    }, [selectedDate]);


    useEffect(() => {
    const dai2 = ['1souzai', '2souzai', '3souzai', 'namashitsu1', 'namashitu2'];

    let filteredItems: Box[];
    if (tabValue === 2) {
        filteredItems = rawItems.filter(
        (item) => item != null && dai2.includes(item.departmentId)
        );
    } else if (tabValue === 1) {
        filteredItems = rawItems.filter(
        (item) => item != null && !dai2.includes(item.departmentId)
        );
    } else {
        filteredItems = rawItems.filter((item) => item != null);
    }

    const storeMap = filteredItems.map(item => ({
        date: item.date,
        storeId: item.storeId,
        storeName: item.storeName,
        storeTc: item.storeTc,
        departmentId: item.departmentId,
        greenBoxes: item.boxColor === 'green' ? item.boxCount : 0,
        redBoxes: item.boxColor === 'red' ? item.boxCount : 0,
        blueBoxes: item.boxColor === 'blue' ? item.boxCount : 0,
        orangeBoxes: item.boxColor === 'orange' ? item.boxCount : 0, 
    }));

    aggregateStoreData(storeMap);
    }, [rawItems, tabValue]);


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
                console.log("ボタン用のフラグ",allDone)
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
            // tabValue に応じたテンプレートパスとファイル名のマッピング
        const templatePathMap: Record<number, string> = {
            0: "excel-files/センター　納品箱数明細票テンプレート.xlsx",
            1: "excel-files/本社　納品箱数明細票テンプレート.xlsx",
            2: "excel-files/第2工場　納品箱数明細票テンプレート.xlsx",
        };

        const filenameMap: Record<number, string> = {
            0: "センター　納品箱数明細票",
            1: "本社　納品箱数明細票",
            2: "第2工場　納品箱数明細票",
        };

        const templatePath = templatePathMap[tabValue];
        const fileNamePrefix = filenameMap[tabValue] ?? "納品箱数明細票";
        console.log("tabValue",tabValue)
        
        if (!templatePath) {
        console.warn("未対応の tabValue:", tabValue);
        return;
        }

        // テンプレートファイルのダウンロード
        const { body, eTag } = await downloadData({ path: templatePath }).result;
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
        createDetailListFromTemplate(workbook, detailData,tabValue);

            // ファイル出力
        const buffer = await workbook.xlsx.writeBuffer();
        const newBlob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        // ファイル保存
        saveAs(newBlob, `${fileNamePrefix}_${selectedDate?.toISOString().slice(0, 10)}.xlsx`);

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
    //ボタンテキスト
    const buttonLabel = tabValue === 0
    ? "センター明細表ダウンロード"
    : tabValue === 1
        ? "本社工場明細表ダウンロード"
        : "第二工場明細表ダウンロード"; // デフォルトや他タブ用
    //右の合計表タイトル
    const summaryTitle0 = tabValue === 0
    ? "センター 全体合計"
    : tabValue === 1
        ? "本社工場 全体合計"
        : "第二工場 全体合計";
    const summaryTitle1 = tabValue === 0
    ? "センター 中之島合計"
    : tabValue === 1
        ? "本社工場 中之島合計"
        : "第二工場 中之島合計";
    const summaryTitle2 = tabValue === 0
    ? "センター 上越合計"
    : tabValue === 1
        ? "本社工場 上越合計"
        : "第二工場 上越合計";

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
                    orangeBoxes: 0
                });
            }
        const aggregated = aggregatedMap.get(item.storeId)!;
            aggregated.greenBoxes += item.greenBoxes;
            aggregated.redBoxes += item.redBoxes;
            aggregated.blueBoxes += item.blueBoxes;
            aggregated.orangeBoxes += item.orangeBoxes;
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
        orange: data.reduce((sum: any, s: { orangeBoxes: any; }) => sum + s.orangeBoxes, 0),
    });

    const totalNakanoshima = calcTotal(nakanoshimaData); //各TCの合計
    const totalJyoetsu = calcTotal(jyoetsuData);
    const totalAll = calcTotal(storeData);

    type TotalType = { //合計表のための型定義
        green: number;
        red: number;
        blue: number;
        orange: number;
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
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'warning.light', boxColor: 'white', }}>Box橙</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white', }}>合計</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                <TableRow>
                <TableCell align="right" sx={cellStyle('success.light', true)}>{total.green}</TableCell>
                <TableCell align="right" sx={cellStyle('error.light', true)}>{total.red}</TableCell>
                <TableCell align="right" sx={cellStyle('primary.light', true)}>{total.blue}</TableCell>
                <TableCell align="right" sx={cellStyle('warning.light', true)}>{total.orange}</TableCell>
                <TableCell align="right" sx={{ fontSize, fontWeight: 'bold' }}>
                    {total.green + total.red + total.blue + total.orange}
                </TableCell>
                </TableRow>
            </TableBody>
            </Table>
        </TableContainer>
        </Box>
    
    );
    }

        const getDepartmentName = (departmentId:string) => {
        switch (departmentId) {
            case '1souzai':
                return '惣菜1';
            case '2souzai':
                return '惣菜2';
            case '3souzai':
                return '惣菜3';
            case 'kakou1':
                return '加工'
            case 'kakou2':
                return '加工(ロースとんかつ)';
            case 'seiniku':
                return '精肉';
            case 'namashitsu1':
                return '生室(水産部門)'
            case 'namashitsu2':
                return '生室(精肉部門)';
            case 'honsyabuturyu':
                return '本社物流';
            case 'seika':
                return '青果';
            case 'kurosawa':
                return '黒澤(テスト用)';
            case 'furukawa':
                return '古川(テスト用)';
            case 'sakurai':
                return '櫻井(テスト用)';
            default:
            return departmentId;
        }
        };


// 箱詳細情報を取得する関数
const fetchBoxDetails = async (storeId: string, date: string) => {
  try {
    const response = await boxClient.models.Box.listBoxesByDateAndStore({
      date: date,
      storeId: { eq: storeId }
    });
    
    // "status" が "DOUBLE_CHECKED" のものだけ抽出
    const doubleCheckedBoxes = response.data.filter(box => box.status === "DOUBLE_CHECKED");
    
    // 部門の表示順を定義（指定された順序に基づく）
    const departmentOrder: Record<string, number> = {
      // 本番工場
      'seiniku': 1,        // 本番工場精肉
      'kakou1': 2,         // 本番工場加工
      'kakou2': 3,         // 本番工場加工
      'honsyabuturyu': 4,  // 本番工場本社物流
      'seika': 5,          // 青果（順序指定になかったが追加）
      
      // 第二工場
      '1souzai': 6,        // 第二工場惣菜１
      '2souzai': 7,        // 第二工場惣菜2
      '3souzai': 8,        // 第二工場惣菜３
      'namashitsu1': 9,    // 第二工場生室
      'namashitsu2': 10,   // 第二工場生室
    };
    
    // 箱の色の表示順を定義
    const colorOrder: Record<string, number> = {
      'green': 1,  // 緑
      'red': 2,    // 赤
      'blue': 3,   // 青
      'orange': 4  // 橙
    };
    
    // 箱の表示順をソート
    const sortedBoxes = doubleCheckedBoxes.sort((a, b) => {
      // 1. 部門順でソート
      const orderA = departmentOrder[a.departmentId] || 999;
      const orderB = departmentOrder[b.departmentId] || 999;
      
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      
      // 2. 同じ部門内では箱の色でソート
      const colorA = colorOrder[a.boxColor] || 999;
      const colorB = colorOrder[b.boxColor] || 999;
      
      return colorA - colorB;
    });
    
    console.log('取得した箱情報:', sortedBoxes);
    setBoxDetails(sortedBoxes || []);
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

    const fetchOrderDetails = async (storeId:string,departmentId: string,date:string) => {
    try {
        const response = await boxClient.models.Order.listOrdersByDept({
        date: date,
        departmentId: {
            eq: departmentId
        }
        },{
    limit: 1000  // 最大1000件取得
}
);
        const filteredOrders = response.data.filter(order => order.storeId === storeId);
        const orders: OrderItem[] = filteredOrders

    const aggregated: Record<string, OrderItem> = {};

    // 店舗ID + 商品IDの組み合わせでグループ化して集計
    for (const order of orders) {
      const key = `${order.storeId}_${order.itemId}`;
      
      if (!aggregated[key]) {
        // 最初の1件をコピー（itemCountは0から加算）
        aggregated[key] = { ...order, itemCount: 0 };
      }

      aggregated[key].itemCount += order.itemCount ?? 0;
    }

    // 集計したデータを配列に変換
    const aggregatedOrders: OrderItem[] = Object.values(aggregated);
    
    // TC順→店舗番号順→商品名順でソート
    const sortedOrders = aggregatedOrders.sort((a, b) => {
      // 1. TC順でソート（中之島を先頭にする場合）
      if (a.storeTc === '中之島' && b.storeTc !== '中之島') return -1;
      if (a.storeTc !== '中之島' && b.storeTc === '中之島') return 1;
      
      // 同じTCの場合は店舗番号順でソート
      if (a.storeTc === b.storeTc) {
        // 2. 店舗番号順でソート
        if (a.storeId !== b.storeId) {
          return Number(a.storeId) - Number(b.storeId);
        }
        
        // 3. 同じ店舗の場合は商品名順でソート
        return (a.itemFormalName || '').localeCompare(b.itemFormalName || '');
      }
      
      // それ以外の場合はTC名でソート
      return (a.storeTc || '').localeCompare(b.storeTc || '');
    });
    
    console.log('ソート後のOrder情報:', sortedOrders);
    setOrderDetails(sortedOrders || []);
  } catch (error) {
    console.error('Order情報の取得エラー:', error);
    setOrderDetails([]);
  }
};
    

    const handleDepartmentClick = async(box:StoreData) => {//モーダル開閉用関数
        const departmentName = getDepartmentName(box.departmentId);
        setSelectedDepartmentName(departmentName);
        setOpenSecond(true);
        await fetchOrderDetails(box.storeId,box.departmentId, selectedDate?.toISOString().split('T')[0].replace(/-/g, '')||'');
    };

    const handleClose2 = () => {
        setOpenSecond(false);
        setSelectedDepartmentName('');
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

    
    <TableContainer component={Paper} sx={{ width: '100%',maxHeight: '600px',  overflowY: 'auto'}}>
        <Table stickyHeader aria-label="店舗データテーブル" >
            <TableHead>
            <TableRow> 
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>TC</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>店舗番号</TableCell>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white' }}>店舗名</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light', boxColor: 'white' }}>トートーbox緑</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'error.light', boxColor: 'white' }}>トートーbox赤</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', boxColor: 'white' }}>トートーbox青</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light', boxColor: 'white' }}>トートーbox橙</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', boxColor: 'white',width: '15%' }}>合計</TableCell>
            </TableRow>
            </TableHead>
            <TableBody >
            {(() => {
                const nakanoshimaFiltered = storeData
                .filter(s => s.storeTc === '中之島' && s.storeId !== '089' && s.storeId !== '057')
                .sort((a, b) => Number(a.storeId) - Number(b.storeId));

                const store89 = storeData.filter(s => s.storeTc === '中之島' && s.storeId === '089');
                const store057 = storeData.filter(s => s.storeTc === '中之島' && s.storeId === '057');

                const others = storeData
                .filter(s => s.storeTc !== '中之島')
                .sort((a, b) => Number(a.storeId) - Number(b.storeId));

                const reordered = [
                ...nakanoshimaFiltered,
                ...store89,
                ...store057,
                ...others
                ];

                return reordered.map((store) => (
                <TableRow key={store.storeId} hover>
                <TableCell>{store.storeTc}</TableCell>
                <TableCell  //店舗の箱数詳細
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
                    {store.orangeBoxes}
                </TableCell>
                <TableCell //店舗IDごとの全ての合計
                    align="right"
                    sx={{ fontSize: '1.5rem' , fontWeight: 'bold' }}
                >
                    {store.greenBoxes + store.redBoxes + store.blueBoxes + store.orangeBoxes}
                </TableCell>
                </TableRow>
                ));
            })()}
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
                        <ListItemButton //の部門の注文詳細を表示する
                            onClick={() => {
                            handleDepartmentClick(box)
                            }} sx={{ 
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
                            {getDepartmentName(box.departmentId)}
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
                                box.boxColor === 'orange' ? '橙色' :
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
                        </ListItemButton>
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
        {/*モーダル2*/}
        <Dialog open={openSecond} onClose={handleClose2} maxWidth="sm"fullWidth>
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
            担当部門:{selectedDepartmentName} - 注文詳細
            </Typography>
            <IconButton
            edge="end"
            color="inherit"
            onClick={handleClose2}
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
                            TC
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
                            店舗番号
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
                            店舗名
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
                            商品名・規格
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
                            注文数
                        </Typography>
                        } 
                        sx={{ flex: 1 }}
                    />
                    </ListItem>
                    {orderDetails.map((order, index) => (
                    <React.Fragment key={`${order.storeId}-${index}`}>
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
                            {order.storeTc}
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
                                {order.storeId}
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
                                {order.storeName}
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
                                {order.itemFormalName}
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
                                {order.itemCount}個
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
    <SummaryTable title={summaryTitle0} total={totalAll} />
    <SummaryTable title={summaryTitle1} total={totalNakanoshima} />
    <SummaryTable title={summaryTitle2} total={totalJyoetsu} />
    {/* スペーサーとして空Boxを使う */}
    <Box sx={{ height: '100px' }} />
    {!isAllDone ? (
    <Tooltip title="仕分け作業が完了していません">
        <Box component="span" sx={{ display: 'inline-block' }}>
        <Button
            sx={{
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
            disabled
        >
            {buttonLabel}
        </Button>
        </Box>
    </Tooltip>
    ) : (
    <Button
        sx={{
        mt: "100px",
        backgroundColor: 'primary.main',
        color: 'white',
        '&:hover': {
            backgroundColor: 'primary.dark',
        },
        }}
        onClick={handleDownloadExcel}
    >
        {buttonLabel}
    </Button>
    )}
    </Box>
    </Box>
    );
};


export default FinalCheck;