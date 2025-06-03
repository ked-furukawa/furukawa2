import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

import testDataOrder from '../services/testDataOrder.json';

const boxClient = generateClient<Schema>();

export const TestComponent = () => {
    const [value, setValue] = useState('');
    const [submittedValue, setSubmittedValue] = useState<number | null>(null);
    const [message, setMessage] = useState<string>('');

    

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
            color: 'green',
            boxCount: numValue,
            boxCreatedBy: '肉',
        });
        console.log(result);
        setMessage('登録成功');
        } catch (error) {
        console.error('DB登録エラー:', error);
        setMessage('登録に失敗しました');
        }
    };

      const saveDataToDBOrder = async (data: any[]) => { //DB保存用関数Order
    try {
    for (const item of data) {
        await boxClient.models.Order.create({
            date: item.date,
            
            storeId: item.storeId,
            storeName: item.storeName,
            storeTc: item.storeTc,
            
            itemId: item.itemId,
            itemName: item.itemName,
            itemFormalName: item.itemFormalName,
            orderCount: item.orderCount
        });
    }
        return true;
    } catch (error) {
        console.error('DB登録エラー:', error);
        return false;
    }
};

// ボタンクリックハンドラーDB保存用
    const handleSaveClick = async () => {
    const success = await saveDataToDBOrder(testDataOrder); // Order型
    if (success) console.log("保存に成功しました");
};


const createTestFlag = async (): Promise<boolean> => {
    try {
        await boxClient.models.CompleteFlag.update({
        date: '2025-06-02',
        departmentId: 'test',
        departmentName: 'テスト部門',
        completeState: '未完了', // 他に '中之島完了', '作業完了' も可
        });
        return true;
    } catch (error) {
        console.error('CompleteFlag 作成エラー:', error);
        return false;
    }
};

// ボタンクリックハンドラーtestフラグ作成用
    const handleCreateFlag = async () => {
    const success = await createTestFlag(); 
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
                    date:'2025-06-02', 
                    storeId:box.storeId, 
                    color:box.color
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
        <Button variant="contained" color="secondary" onClick={ handleCreateFlag }> {/*test部門用の完了フラグを作る*/}
            test部門未完了
        </Button>
        <Button variant="contained" color="error" onClick={handleDeleteAll}>
            Boxテーブル削除
        </Button>
        </Box>
        </>
    );
};

export default TestComponent;
