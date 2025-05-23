// src/components/Keypad.tsx
import React from 'react';
import { Box, Button, TextField, Paper, Typography } from '@mui/material';

// コンポーネントのProps型定義
interface KeypadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onClear: () => void;
}

/**
 * 数字入力用テンキーコンポーネント
 */
export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  onEnter,
  onClear, 
}) => {
  // 数字ボタンクリック時のハンドラー
  const handleNumberClick = (num: string) => {
    onChange(value + num);
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4,
        borderRadius: 2,
        width: '100%',  // 親要素の幅に合わせる
        maxWidth: 500,  // 最大幅を指定（必要に応じて調整）
  }}
    >
      {/* 入力表示エリア */}
      <TextField
        fullWidth
        variant="outlined"
        value={value}
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
            onClick={onClear}
          >
            クリア
          </Button>
          <Button
            variant="contained"
            color="primary"
            sx={{ flex: 1, height: 50 }}
            onClick={onEnter}
          >
            確定
          </Button>
        </Box>
      </Box>

      {/* ステータス表示 */}
      <Box mt={3}>
        <Typography variant="body1" align="center" color="text.secondary">
          入力中の箱数: {value || 0}
        </Typography>
      </Box>
    </Paper>
  );
};