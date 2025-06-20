import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

import testDataOrder1 from '../services/testDataOrder1.json';
import testDataOrder2 from '../services/testDataOrder2.json';
import testDataBox from '../services/testDataBox.json'

const boxClient = generateClient<Schema>();


import {StatusTemplate} from '../types/index.ts';

import { formatDateToJST } from '../components/utils/formatDateToJST.ts';
import { useParams } from 'react-router-dom';
// import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore.tsx';


export const TestComponent = () => {
    const [value, setValue] = useState('');
    const [submittedValue, setSubmittedValue] = useState<number | null>(null);
    const [message, setMessage] = useState<string>('');
    const { departmentId } = useParams<{ departmentId: string }>();

    if (!departmentId) {
    // エラー処理や、リダイレクト処理
    return <div>部門IDが必要です</div>;
    }
    const date=formatDateToJST(new Date)


    const fetchProducts = async () => {
    try {
        console.log('ログインユーザーの departmentId:', departmentId);
    
        // 店舗IDは指定せず、日付のみで取得
        const { data } = await boxClient.models.Order.list({
            filter: {
                date: { eq: '2025-06-02' },
                departmentId: { beginsWith: departmentId }
            },
        });
        console.log('data',data);
        console.log(StatusTemplate.PENDING); //PENDING

                // 店舗IDは指定せず、日付のみで取得

        const date='20250606'
        const result = await boxClient.models.Order.listOrdersByDeptAndImport({
        date, // GSI の partitionKey
        departmentIdImportId: {
            eq: {departmentId:departmentId as string,
                importId:'20250606_130000'} // sortKey の条件
        },
    });
        console.log('resulet',result);
        const testdate=formatDateToJST(new Date);
        console.log(testdate);
    }
    finally{
        console.log('test終了');
    }
    };
    

    

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        // 数値か空欄のみ許容
        if (/^\d*$/.test(inputValue)) {
        setValue(inputValue);
        }
    };

    const handleSubmit = async () => {
    if (value === '') {
        setMessage('箱数を入力してください');
        return;
    }

    const numValue = Number(value);
    setSubmittedValue(numValue);

    try {
        const result = await boxClient.models.Box.update({ //DBの書き換え部分、今回はBoxテーブル
            date: '2025-06-02', //実際は画面内のどこかに保持している変数などを使って必要情報を埋めていく
            storeId: '019', //必要情報=定義したテーブルの中身
            storeName: '内野店',
            storeTc: '中之島',
            boxColor: 'green',
            boxCount: numValue,
            departmentId: 'test',
        });
        console.log(result);
        setMessage('登録成功');
        } catch (error) {
        console.error('DB登録エラー:', error);
        setMessage('登録に失敗しました');
        }
    };

    const saveDataToDBOrder = async (testDataOrder:any) => { //DB保存用関数Order
    try {

    for (const order of testDataOrder) {
        const result =await boxClient.models.Order.create({
            ...order
        });

        console.log('create',result);
    }
    const importId=testDataOrder[0].importId;
    const { data: existingRecords } = await boxClient.models.ImportWorkStatus.list({
    filter: {
        importId: { eq: importId },
        departmentId: { eq: departmentId },
        date: { eq: date }
    }
});

    let result;

    if (existingRecords.length > 0) {
    // 既存レコードがある場合：最初の1件を更新
    const existing = existingRecords[0];
    result = await boxClient.models.ImportWorkStatus.update({
        date: existing.date,
        importId: existing.importId,
        departmentId:existing.departmentId,
        importProgress: 'PENDING',
        sortingPhase: 'PENDING',
    });
    } else {
    // レコードが存在しない場合 → 作成
    result = await boxClient.models.ImportWorkStatus.create({
        date,
        departmentId,
        importId
    });
    }

console.log('importId result:', result);

        return true;
    
    } catch (error) {
        console.error('DB登録エラー:', error);
        return false;
    }
};

// ボタンクリックハンドラーDB保存用
    const handleSaveClick = async (testData:any) => {
    const success = await saveDataToDBOrder(testData); // Order型
    if (success) console.log("保存に成功しました");
};


const handleDeleteBox = async () => {
    try {
      // 1. 全 Box を取得
        const { data: orders } = await boxClient.models.Box.list();

      // 2. 各 Box を削除（id 必須）
        if (orders) {
            await Promise.all(
            orders.map((box) =>
                boxClient.models.Box.delete({
                    date:box.date, 
                    storeId:box.storeId, 
                    boxColor:box.boxColor,
                    departmentId:box.departmentId
                })
            )
            );
        }

        alert('全Boxデータを削除しました');
        } catch (err) {
        console.error('削除エラー:', err);
        alert('削除に失敗しました');
        }
    };

const handleDeleteOrder = async () => {
    try {
      // 1. 全 Order を取得
        const { data: orders } = await boxClient.models.Order.list();

        if (orders) {
            await Promise.all(
            orders.map((order) =>
                boxClient.models.Order.delete({
                    date:order.date, 
                    importId:order.importId,
                    storeId:order.storeId, 
                    itemId:order.itemId
                })
            )
            );
        }

        alert('全Orderデータを削除しました');
        } catch (err) {
        console.error('削除エラー:', err);
        alert('削除に失敗しました');
        }
    };

    const handleDeleteImportId = async () => {
    try {
        const { data } = await boxClient.models.ImportWorkStatus.list();

        if (data) {
            await Promise.all(
            data.map((data) =>
                boxClient.models.ImportWorkStatus.delete({
                    date:data.date, 
                    importId:data.importId,
                    departmentId:data.departmentId,
                })
            )
            );
        }

        alert('全ImportWorkStatusデータを削除しました');
        } catch (err) {
        console.error('削除エラー:', err);
        alert('削除に失敗しました');
        }
    };
    const saveBoxData = async (testDataBox:any) => {
        try{
            for (const box of testDataBox) {
                await boxClient.models.Box.create({
                    ...box
                });
    }
        }catch(err){
            alert('保存に失敗')
        }
    }


return (
        <>
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} p={4}>
        <TextField
            label="内野店の箱数を変更"
            variant="outlined"
            value={value}
            onChange={handleChange}
        />
        <Button variant="contained" color="primary" onClick={handleSubmit}>
            決定
        </Button>
        {submittedValue !== null && (
            <Typography variant="h6">入力された数字: {submittedValue}</Typography>
        )}
        {message && <Typography color="error">{message}</Typography>}
        </Box>
        <Box sx={{
    position: "fixed",
    bottom: 0,
    right: 0,
    margin: 2, 
    borderRadius: 1,
    }}>
        <Button variant="contained" color="secondary" onClick={() => handleSaveClick(testDataOrder1)}> {/*DB保存用関数を呼び出す*/}
            10:30保存
        </Button>
        <Button variant="contained" color="secondary" onClick={() => handleSaveClick(testDataOrder2)}> {/*DB保存用関数を呼び出す*/}
            13:00保存
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteOrder}>
            Orderテーブル削除
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteImportId}>
            ImportWorkStatusテーブル削除
        </Button>
        <Button variant="contained" color="secondary" onClick={() => saveBoxData(testDataBox)}> {/*DB保存用関数を呼び出す*/}
            テスト用箱データ保存
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteBox}>
            Boxテーブル削除
        </Button>
        <Button variant="contained" color="error" onClick={fetchProducts}>
            test
        </Button>
        </Box>
        </>
    );
};

export default TestComponent;
