import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

// import testDataOrder from '../services/testDataOrder.json';

const boxClient = generateClient<Schema>();

import { fetchUserAttributes } from 'aws-amplify/auth';

import {CompleteState} from '../types/index.ts';



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
                departmentId: { eq: attrs['custom:departmentId'] }
            },
        });
        console.log('data',data);

                // 店舗IDは指定せず、日付のみで取得
        const { data:Flagdata } = await boxClient.models.CompleteFlag.list({
            filter: {
                date: { eq: '2025-06-02' },
                departmentId: { eq: 'test' }
            },
        });
        console.log('Flagdata',Flagdata);

        const date='20250606'
        const result = await boxClient.models.Order.listOrdersByDate({
        date, // GSI の partitionKey
        departmentId: {
            eq: attrs['custom:departmentId'] // sortKey の条件
        }
        
    });
        console.log('resulet',result);
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

    const saveDataToDBOrder = async () => { //DB保存用関数Order
    try {
        const attrs = await fetchUserAttributes();

        const date='20250606'
        const storeId='019'
        const itemId='210039'
        const departmentId=attrs['custom:departmentId']

        const result=await boxClient.models.Order.create({
            importId:'20250606_130000',
            versionGroupId:storeId+'_'+itemId+'_'+date,
            
            date: date,
            
            storeId: storeId,
            storeName: '内野店',
            storeTc: '中之島',
            
            itemId: itemId,
            itemName: '大エビ',
            itemFormalName: '大エビ天重キット',
            itemCount: 3,

            departmentId: departmentId,
            departmentName: 'テスト部門',

        });
        console.log('create',result);
        return true;
    } catch (error) {
        console.error('DB登録エラー:', error);
        return false;
    }
};

// ボタンクリックハンドラーDB保存用
    const handleSaveClick = async () => {
    const success = await saveDataToDBOrder(); // Order型
    if (success) console.log("保存に成功しました");
};


const createOrUpdateTestFlag = async (): Promise<boolean> => {
try {
    const date = '2025-06-02';
    const departmentId = 'test';

    // 既存データを取得
    const { data: existingFlag } = await boxClient.models.CompleteFlag.get({
        date,
        departmentId,
        });

    if (existingFlag) {
    // データが存在する場合は update
    await boxClient.models.CompleteFlag.update({
        date,
        departmentId,
        nakanoshimaState: CompleteState.PENDING, // 必要なフィールドだけ更新
        jyoetsuState: CompleteState.PENDING
    });
    } else {
    // データが存在しない場合は create
    await boxClient.models.CompleteFlag.create({
        date,
        departmentId,
        departmentName: 'テスト部門',
        nakanoshimaState: CompleteState.PENDING, 
        jyoetsuState: CompleteState.PENDING
    });
    }

        return true;
    } catch (error) {
        console.error('CompleteFlag 作成/更新エラー:', error);
        return false;
    }
};

// ボタンクリックハンドラーtestフラグ作成用
    const handleCreateFlag = async () => {
        fetchProducts;

        const success = await createOrUpdateTestFlag(); 
    if (success) console.log("保存に成功しました");

};

const handleDeleteAll = async () => {
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
        <Button variant="contained" color="secondary" onClick={ handleSaveClick}> {/*DB保存用関数を呼び出す*/}
            Orderテスト用ボタン
        </Button>
        <Button variant="contained" color="error" onClick={ handleCreateFlag }> {/*test部門用の完了フラグを作る*/}
            test部門未完了
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteAll}>
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
