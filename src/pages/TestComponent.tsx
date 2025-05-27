import { useState } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

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

    return (
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
    );
};

export default TestComponent;
