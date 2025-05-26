// src/components/ErrorMessage.tsx
import React from 'react';
import { Box, Typography } from '@mui/material';

interface ErrorMessageProps {
  message: string | null;
  severity?: 'error' | 'warning' | 'info';
}

/**
 * エラーメッセージを表示するコンポーネント
 * 
 * @param message 表示するメッセージ
 * @param severity メッセージの重要度（error, warning, info）
 */
export const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  severity = 'error' 
}) => {
  if (!message) return null;
  
  const bgColor = {
    error: 'error.light',
    warning: 'warning.light',
    info: 'info.light'
  }[severity];
  
  const textColor = {
    error: 'error.contrastText',
    warning: 'warning.contrastText',
    info: 'info.contrastText'
  }[severity];
  
  return (
    <Box sx={{ mb: 2, p: 1, bgcolor: bgColor, color: textColor, borderRadius: 1 }}>
      <Typography variant="body2">{message}</Typography>
    </Box>
  );
};