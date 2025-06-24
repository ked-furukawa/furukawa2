import { useState } from 'react';
import { Backdrop, Box, Button, CircularProgress, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography } from '@mui/material';
import { StatusTemplate } from '../types';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';
import { useParams } from 'react-router-dom';
const client = generateClient<Schema>();

import { formatDateToJST } from '../components/utils/formatDateToJST';

// interface ImportWorkStatus {
//     date: string;                 // 例: '20250606'
//     departmentId: string;        // 例: 'test'
//     importId: string;            // 例: '20250606_103000'
//     importProgress: 'PENDING' | 'IN_PROGRESS' | 'DONE';
//     sortingPhase: 'PENDING' | 'COMPLETED_NAKANOSHIMA' | 'COMPLETED_JYOETSU' | 'DONE';
// }

interface Order {
    importId: string;               // '20250606_103000'
    date: string;                   // '20250606'
    storeId: string;                // '019'
    storeName?: string | null;            // '内野店'（任意）
    storeTc?: string | null;              // '中之島'（任意）

    itemId: string;                // '210039'
    itemName?: string | null;            // '大エビ'（任意）
    itemFormalName?: string | null;      // '大エビ天重キット'（任意）
    itemCount: number;            // 3

    departmentId: string;         // 'souzai2'
    departmentName?: string | null;      // '惣菜2'（任意）

    status?: string | null;  // 省略時は PENDING 扱い
}



interface StartSortingProps {
    navigateTo: (key: string) => void;
}

const StartSorting: React.FC<StartSortingProps> = ({navigateTo}) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processing, setProcessing] = useState(false);


    const departmentId = useParams().departmentId!;
    const date = formatDateToJST(new Date);


    const handleStartClick = () => {
        setDialogOpen(true);
    };

    const handleCancel = () => {
        setDialogOpen(false);
    };

    const handleConfirm = async () => {
    setDialogOpen(false);
    setProcessing(true);

    try {
        // Step 1: PENDINGなImportWorkStatusを取得
        const { data : ImportIds } = await client.models.ImportWorkStatus.listImportIdsByDateAndDept({
                date: date,
                departmentId: {
                    eq: departmentId
                }
            },
            {
        limit: 1000  // 最大1000件取得
        });
        const pendingStatuses = ImportIds.filter((item: any) => item.importProgress === StatusTemplate.PENDING);

        if (pendingStatuses.length === 0) {
        alert("保留中の注文が存在しません");
        return;
        }

        // Step 2: 対象importId群を取得し、昇順ソート
        const sortedStatuses = pendingStatuses.sort((a, b) => a.importId.localeCompare(b.importId));
        const targetImportId = sortedStatuses[0].importId;
        const importIds = sortedStatuses.map(s => s.importId);

        // Step 3: Order取得
        const allOrders: Order[] = [];

        for (const importId of importIds) {
        const { data:Orders } = await client.models.Order.listOrdersByDeptAndImport(
            {
                date: date,
                departmentIdImportId: {
                eq: {
                    departmentId: departmentId,
                    importId: importId
                }
                }
            },
            {
                limit: 1000
            }
            );

        allOrders.push(...Orders);
        }

        // Step 4: 集計 (date + storeId + itemId ごと)
        const aggregated = new Map<string, Order>();

        for (const order of allOrders) {
            const key = `${order.date}__${order.storeId}__${order.itemId}`;
            if (aggregated.has(key)) {
                const existing = aggregated.get(key)!;
                existing.itemCount += order.itemCount;
            } else {
                aggregated.set(key, { ...order });
            }
        }

        // Step 5: targetImportId に上書き保存（Put操作）
        const aggregatedOrders = Array.from(aggregated.values()).map((order) => ({
            ...order,
            importId: targetImportId, // すべて最も古い importId に書き換え
        }));

        for (const order of aggregatedOrders) {
        try {
            await client.models.Order.update(order);
        } catch (err: any) {
            // update失敗＝未作成 → createで新規作成
            if (err.errors?.[0]?.message?.includes('Cannot update non-existing model')) {
            await client.models.Order.create(order);
            } else {
            throw err; // それ以外のエラーは再スロー
            }
        }
        }

        // Step 6: ImportWorkStatus を更新(最古のものをIN_PROGRESS、それ以外はDONEに)
        for (const status of pendingStatuses) {
        const isTarget = status.importId === targetImportId;
        await client.models.ImportWorkStatus.update({
            ...status,
            importProgress: isTarget ? 'IN_PROGRESS' : 'DONE',
        });
        }

        navigateTo('SortingCheckScreen');

        } catch (error) {
        console.error('エラーが発生しました:', error);
        alert('エラーが発生しました');
        } finally {
        setProcessing(false);
        }
    };

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

const formatDate = (yyyymmdd: string): string => {
    if (!/^\d{8}$/.test(yyyymmdd)) return yyyymmdd;

    const year = parseInt(yyyymmdd.slice(0, 4));
    const month = parseInt(yyyymmdd.slice(4, 6)) - 1; // JS Dateは0始まりの月
    const day = parseInt(yyyymmdd.slice(6, 8));

    const dateObj = new Date(year, month, day);
    dateObj.setDate(dateObj.getDate() + 1); // 翌日にする

    const yyyy = dateObj.getFullYear();
    const mm = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const dd = dateObj.getDate().toString().padStart(2, '0');

    return `${yyyy}年${mm}月${dd}日`;
};

return (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
    >
    <Container maxWidth="sm">
        <Box mt={5} p={4} boxShadow={3} borderRadius={2} display="flex" flexDirection="column" alignItems="center" gap={2}>
            <Box mb={3} width="100%">
                <Typography variant="subtitle1" color="textSecondary" component="span" sx={{ fontSize: '1.25rem' }}>
                    部門:
                </Typography>
                <Typography variant="subtitle1" component="span" ml={1} sx={{ fontSize: '1.25rem' }}>
                    {getDepartmentName(departmentId)}
                </Typography>
            </Box>
            <Box mb={3} width="100%">
                <Typography variant="subtitle1" color="textSecondary" component="span" sx={{ fontSize: '1.25rem' }}>
                    納品日:
                </Typography>
                <Typography variant="subtitle1" component="span" ml={1} sx={{ fontSize: '1.25rem' }}>
                    {formatDate(date)}
                </Typography>
            </Box>
            <Button
            variant="contained"
            color="primary"
            onClick={handleStartClick}
            disabled={processing}
            size="large"
            sx={{ minWidth: 120 }}
            >
            開始
            </Button>

            <Dialog
                open={dialogOpen}
                onClose={(reason) => {
                    if (processing) return;
                    if (reason === "backdropClick" || reason === "escapeKeyDown") {
                    return;
                    }
                    setDialogOpen(false);
                }}
            >
            <DialogTitle>仕分け作業の開始</DialogTitle>
            <DialogContent>
                <DialogContentText>
                本当に仕分け作業を開始してよろしいですか？
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} disabled={processing}>キャンセル</Button>
                <Button onClick={handleConfirm} color="primary" autoFocus disabled={processing}>
                はい
                </Button>
            </DialogActions>
            </Dialog>

            <Backdrop
            sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
            open={processing}
            >
            <CircularProgress color="inherit" />
            </Backdrop>
        </Box>
    </Container>
    </Box>
    );
};

export default StartSorting;
