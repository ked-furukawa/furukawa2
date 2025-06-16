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
import { uploadData } from 'aws-amplify/storage';

// import { Schema } from '../../amplify/data/resource';
// import { generateClient } from "aws-amplify/data";

export const ExcelUpload = () => {
const [file, setFile] = useState<File | null>(null);
const [loading, setLoading] = useState(false);
const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);


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
    </>
);
};

export default ExcelUpload

