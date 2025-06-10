import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

import testDataOrder1 from '../services/testDataOrder1.json';
import testDataOrder2 from '../services/testDataOrder2.json';

const boxClient = generateClient<Schema>();

import { fetchUserAttributes } from 'aws-amplify/auth';

import {StatusTemplate} from '../types/index.ts';

import { formatDateToJST } from '../components/utils/formatDateToJST.tsx';
// import { groupOrdersByTcAndStore } from '../components/utils/groupOrdersByTcAndStore.tsx';


export const TestComponent = () => {
    const [value, setValue] = useState('');
    const [submittedValue, setSubmittedValue] = useState<number | null>(null);
    const [message, setMessage] = useState<string>('');

    const fetchProducts = async () => {
    try {
    
        const attrs = await fetchUserAttributes();
        console.log('ログインユーザーの departmentId:', attrs['custom:departmentId']);
    
        // 店舗IDは指定せず、日付のみで取得
        const { data } = await boxClient.models.Order.list({
            filter: {
                date: { eq: '2025-06-02' },
                departmentId: { beginsWith: attrs['custom:departmentId'] }
            },
        });
        console.log('data',data);
        console.log(StatusTemplate.PENDING); //PENDING

                // 店舗IDは指定せず、日付のみで取得

        const date='20250606'
        const result = await boxClient.models.Order.listOrdersByDeptAndImport({
        date, // GSI の partitionKey
        departmentIdImportId: {
            eq: {departmentId:attrs['custom:departmentId'] as string,
                importId:'20250606_130000'} // sortKey の条件
        },
    });
        console.log('resulet',result);
        const testdate=formatDateToJST(new Date);
        console.log(testdate);

        // const grouped = groupOrdersByTcAndStore(testDataOrder);
        // console.log('グルーピング結果',grouped)

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
                    date:'20250602', 
                    storeId:box.storeId, 
                    boxColor:box.boxColor,
                    departmentId:'test'
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
                    date:'20250609', 
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
