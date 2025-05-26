// src/components/StoreHeader.tsx
import React from 'react';
import { Box, Typography, Paper, Skeleton } from '@mui/material';

// コンポーネントのProps型定義
interface StoreHeaderProps {
  storeNumber: string;
  storeName: string;
  loading?: boolean;
}

/**
 * 店舗情報を表示するヘッダーコンポーネント
 */
export const StoreHeader: React.FC<StoreHeaderProps> = ({ 
  storeNumber, 
  storeName, 
  loading = false 
}) => {
  return (
    <Paper 
      elevation={2}
      sx={{ 
        p: 2, 
        mb: 3, 
        borderRadius: 2,
        backgroundColor: '#f5f5f5'  // 薄いグレーの背景色
      }}
    >
      {loading ? (
        // ローディング中の表示
        <Box>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="text" width="60%" height={30} />
        </Box>
      ) : (
        // 店舗情報の表示
        <Box>
          <Box display="flex" alignItems="center" mb={1}>
            <Typography 
              variant="h5" 
              component="h1" 
              fontWeight="bold"
              sx={{ mr: 2 }}
            >
              {storeName}
            </Typography>
            <Typography 
              variant="subtitle1" 
              component="span"
              sx={{ 
                backgroundColor: '#e0e0e0', 
                px: 1.5, 
                py: 0.5, 
                borderRadius: 1,
                fontWeight: 'medium'
              }}
            >
              店舗番号: {storeNumber}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            最終更新: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};