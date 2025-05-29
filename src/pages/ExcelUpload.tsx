// UploadExcelToS3.tsx
import { useState } from 'react';
import {
Box,
Button,
Typography,
LinearProgress,
Alert,
Input,
} from '@mui/material';
import { getUrl, uploadData } from 'aws-amplify/storage';
//テストデータ
import testDataOrder from '../services/testDataOrder.json';
import testDataBox from '../services/testDataBox.json';
import { Schema } from '../../amplify/data/resource';
import { generateClient } from "aws-amplify/data";

export const ExcelUpload = () => {
const [file, setFile] = useState<File | null>(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

const boxClient = generateClient<Schema>();

const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
    setFile(selectedFile);
    setMessage(null);
    } else {
    setMessage({ type: 'error', text: '有効な .xlsx ファイルを選択してください' });
    setFile(null);
    }
};

const handleUpload = async () => { //S3へのアップロード関数
    if (!file) return;

    setLoading(true);
    setMessage(null);

    const filePath = `excel-files/${Date.now()}-${file.name}` // S3上のパス

    try {
            // 同名ファイルが存在するかチェック
    try {
      await getUrl({ path: filePath }); // 存在すれば成功 → エラーでなければ既に存在
        setMessage({ type: 'error', text: 'アップロード済みのファイルです。' });
        setLoading(false);
        return;
        } catch(err) {
            if((err instanceof Error) && err.name !== 'NotFound') {
            throw err; 
        }
    }
    const result = await uploadData({
        path: filePath, // S3上のパス
        data: file,
        options: {
        contentType: file.type,
        },
    }).result;

    console.log('S3 upload result:', result);
    setMessage({ type: 'success', text: 'アップロード成功！' });
    setFile(null);
    } catch (err) {
    console.error(err);
    setMessage({ type: 'error', text: 'アップロード中にエラーが発生しました。' });
    } finally {
    setLoading(false);
    }
};

  const saveDataToDBBox = async (data: any[]) => { //DB保存用関数Box
    try {
    for (const item of data) {
        const result=await boxClient.models.Box.create({
            date: item.date,
            
            storeId: item.storeId,
            storeName: item.storeName,
            storeTc: item.storeTc,
            
            color: item.color,
            boxCount: item.boxCount,
            boxCreatedBy: 'system'
        });
        console.log(result);
    }
        return true;
    } catch (error) {
        console.error('DB登録エラー:', error);
        return false;
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
    const handleSaveClick = async (data: "box" | "order") => {
    if (data === "order") {
    const success = await saveDataToDBOrder(testDataOrder); // Order型
    if (success) console.log("保存に成功しました");
    } else {
    const success = await saveDataToDBBox(testDataBox); // Box型
    if (success) console.log("保存に成功しました");
    }
};

return (
    <>
    <Box
    sx={{
        maxWidth: 500,
        margin: 'auto',
        mt: 5,
        p: 4,
        border: '1px solid #ccc',
        borderRadius: 2,
        boxShadow: 2,
        textAlign: 'center',
    }}
    >
    <Typography variant="h6" gutterBottom>
        Excelファイルをアップロード
    </Typography>

    <Input type="file" inputProps={{ accept: '.xlsx' }} onChange={handleFileChange} />

    {file && (
        <Typography variant="body2" mt={1}>
        選択されたファイル: {file.name}
        </Typography>
    )}

    <Button
        variant="contained"
        color="primary"
        onClick={handleUpload}
        sx={{ mt: 2 }}
        disabled={!file || loading}
    >
        アップロード
    </Button>

    {loading && <LinearProgress sx={{ mt: 2 }} />}

    {message && (
        <Alert severity={message.type} sx={{ mt: 2 }}>
        {message.text}
        </Alert>
    )}
    </Box>
    <Box sx={{
    position: "fixed",
    bottom: 0,
    right: 0,
    margin: 2, 
    borderRadius: 1,
    }}>
        <Button variant="contained" color="secondary" onClick={() => handleSaveClick("order")}> {/*DB保存用関数を呼び出す*/}
        Orderテスト用ボタン
        </Button>
        <Button variant="contained" color="secondary" onClick={() => handleSaveClick("box")}> {/*DB保存用関数を呼び出す*/}
        Boxテスト用ボタン
        </Button>
    </Box>
    </>
);
};

export default ExcelUpload

