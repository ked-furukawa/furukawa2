import React, { useState } from 'react';
import { Box, Button, Typography, TextField, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Checkbox } from '@mui/material';

// 食品データの型定義
interface FoodItem {
  id: number;
  name: string;
  quantity: number;
  checked: boolean;
}

const App: React.FC = () => {
  // 入力値の状態
  const [inputValue, setInputValue] = useState('');
  
  // 店舗情報
  const storeInfo = {
    name: "新津店　　　　　　　　　　　　",
    code: "038"
  };
  
  // 食品リストの状態
  const [foodItems, setFoodItems] = useState<FoodItem[]>([
    { id: 1, name: "カツ丼", quantity: 3, checked: false },
    { id: 2, name: "カレー", quantity: 1, checked: false },
    { id: 3, name: "タレ", quantity: 2, checked: false },
  ]);

  // チェックボックスの状態変更ハンドラ
  const handleCheckChange = (id: number) => {
    setFoodItems(foodItems.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  // テンキー関連の関数
  const handleNumberClick = (num: string) => {
    setInputValue((prev) => prev + num);
  };

  const handleBackspace = () => {
    setInputValue((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setInputValue('');
  };

  const handleEnter = () => {
    if (inputValue) {
      alert(`確定された値: ${inputValue}`);
      setInputValue('');
    }
  };

  return (
    <Box 
      p={2} 
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      minHeight="100vh"
    >
      {/* 左側：店舗情報と食品リスト */}
      <Paper
        elevation={3}
        sx={{
          width: { xs: '100%', sm: '60%', md: '65%' },
          p: 3,
          borderRadius: 2,
          mr: { xs: 0, sm: 2 },
          display: { xs: 'none', sm: 'block' }
        }}
      >
        {/* 店舗情報 */}
        <Box mb={3} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" fontWeight="bold">
            {storeInfo.name}
          </Typography>
          <Box sx={{ bgcolor: 'primary.main', color: 'white', px: 2, py: 1, borderRadius: 1 }}>
            <Typography variant="h6">
              店舗番号: {storeInfo.code}
            </Typography>
          </Box>
        </Box>

        {/* 食品リスト */}
        <Typography variant="h6" mb={1}>食品リスト</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.100' }}>
                <TableCell>食品名</TableCell>
                <TableCell align="right">個数</TableCell>
                <TableCell align="center">チェック</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {foodItems.map((item) => (
                <TableRow 
                  key={item.id}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: 'grey.50' } }}
                >
                  <TableCell>{item.name}</TableCell>
                  <TableCell align="right">{item.quantity}</TableCell>
                  <TableCell align="center">
                    <Checkbox 
                      checked={item.checked}
                      onChange={() => handleCheckChange(item.id)}
                      color="primary"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* 右側のテンキー部分 */}
      <Paper 
        elevation={3} 
        sx={{ 
          width: { xs: '100%', sm: '35%', md: '30%' },
          p: 3,
          borderRadius: 2
        }}
      >
        {/* 入力表示エリア */}
        <TextField
          fullWidth
          variant="outlined"
          value={inputValue}
          placeholder="0"
          InputProps={{
            readOnly: true,
            sx: { input: { textAlign: 'right', fontSize: '1.8rem' } }
          }}
          sx={{ mb: 3 }}
        />

        {/* テンキー配置 */}
        <Box>
          {/* 1行目: 7-8-9 */}
          <Box display="flex" gap={1} mb={1}>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('7')}
            >
              7
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('8')}
            >
              8
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('9')}
            >
              9
            </Button>
          </Box>

          {/* 2行目: 4-5-6 */}
          <Box display="flex" gap={1} mb={1}>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('4')}
            >
              4
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('5')}
            >
              5
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('6')}
            >
              6
            </Button>
          </Box>

          {/* 3行目: 1-2-3 */}
          <Box display="flex" gap={1} mb={1}>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('1')}
            >
              1
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('2')}
            >
              2
            </Button>
            <Button 
              variant="outlined" 
              sx={{ flex: 1, height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('3')}
            >
              3
            </Button>
          </Box>

          {/* 4行目: 0 (中央配置) */}
          <Box display="flex" justifyContent="center" mb={2}>
            <Button 
              variant="outlined" 
              sx={{ width: '33.3%', height: 60, fontSize: '1.5rem', fontWeight: 'bold' }} 
              onClick={() => handleNumberClick('0')}
            >
              0
            </Button>
          </Box>
          
          {/* 5行目: 機能ボタン */}
          <Box display="flex" gap={1}>
            <Button
              variant="contained"
              color="error"
              sx={{ flex: 1, height: 50 }}
              onClick={handleClear}
            >
              クリア
            </Button>
            <Button
              variant="contained"
              color="secondary"
              sx={{ flex: 1, height: 50 }}
              onClick={handleBackspace}
            >
              修正
            </Button>
            <Button
              variant="contained"
              color="primary"
              sx={{ flex: 1, height: 50 }}
              onClick={handleEnter}
            >
              確定
            </Button>
          </Box>
        </Box>

        {/* ステータス表示 */}
        <Box mt={3}>
          <Typography variant="body1" align="center" color="text.secondary">
            入力中の箱数: {inputValue || 0}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default App;