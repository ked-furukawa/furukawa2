import React, { useState } from 'react';
import { Box, Button, TextField, Paper, Typography, Menu, MenuItem, Tooltip } from '@mui/material';

// 色の定義
type BoxColor = 'green' | 'red' | 'blue' | 'yellow';

// 色の表示名マッピング
const colorNames: Record<BoxColor, string> = {
  green: '緑',
  red: '赤',
  blue: '青',
  yellow: '黄'
};

// 色のスタイルマッピング
const colorStyles: Record<BoxColor, { bg: string, text: string }> = {
  green: { bg: '#4caf50', text: 'white' },
  red: { bg: '#f44336', text: 'white' },
  blue: { bg: '#2196f3', text: 'white' },
  yellow: { bg: '#ffeb3b', text: 'black' }
};

// コンポーネントのProps型定義
interface KeypadProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
  onClear: () => void;
  // 色関連のpropsを追加
  selectedColor?: BoxColor;
  onColorChange?: (color: BoxColor) => void;
}

/**
 * 数字入力用テンキーコンポーネント
 */
export const Keypad: React.FC<KeypadProps> = ({
  value,
  onChange,
  onEnter,
  onClear,
  selectedColor = 'green', // デフォルト色は緑
  onColorChange = () => {}, // デフォルトの空関数
}) => {
  // 色選択メニューの状態
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // 数字ボタンクリック時のハンドラー
  const handleNumberClick = (num: string) => {
    onChange(value + num);
  };

  // 色選択メニューを開く
  const handleColorButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  // 色選択メニューを閉じる
  const handleClose = () => {
    setAnchorEl(null);
  };

  // 色を選択
  const handleColorSelect = (color: BoxColor) => {
    onColorChange(color);
    handleClose();
  };

  // 現在選択中の色のスタイル
  const currentColorStyle = colorStyles[selectedColor];

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        borderRadius: 2,
        overflow: 'hidden',
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* ヘッダー部分を直接追加 */}
      <Box
        sx={{
          p: 1.5,
          backgroundColor: '#1976d2', // MUIのprimary色
          color: 'white',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}
      >
        <Typography variant="h6" fontWeight="medium">
          箱数入力
        </Typography>
      </Box>
      {/* 入力エリアとテンキー */}
      <Box sx={{ p: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
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

      {/* 色選択ボタン */}
      <Box mb={2}>
        <Tooltip title="クリックして箱の色を選択">
          <Button
            variant="contained"
            fullWidth
            onClick={handleColorButtonClick}
            sx={{
              backgroundColor: currentColorStyle.bg,
              color: currentColorStyle.text,
              '&:hover': {
                backgroundColor: currentColorStyle.bg,
                opacity: 0.9
              },
              height: 50,
              fontSize: '1rem'
            }}
          >
            箱の色: {colorNames[selectedColor]}
          </Button>
        </Tooltip>
        
        {/* 色選択メニュー */}
        <Menu
          anchorEl={anchorEl}
          open={open}
          onClose={handleClose}
        >
          {(Object.keys(colorNames) as BoxColor[]).map((color) => (
            <MenuItem 
              key={color} 
              onClick={() => handleColorSelect(color)}
              sx={{
                backgroundColor: colorStyles[color].bg,
                color: colorStyles[color].text,
                '&:hover': {
                  backgroundColor: colorStyles[color].bg,
                  opacity: 0.8
                },
                minWidth: 100,
                justifyContent: 'center',
                margin: '4px',
                borderRadius: '4px'
              }}
            >
              {colorNames[color]}
            </MenuItem>
          ))}
        </Menu>
      </Box>

       {/* テンキー配置 */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
      </Box>
    </Paper>
  );
};