// src/components/ProductList.tsx
import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  Box
} from '@mui/material';
import { Product } from '../types';

interface ProductListProps {
  products: Product[];
  selectedProductIds?: string[];
  onProductSelect: (productId: string) => void;
  loading?: boolean;
  error?: string | null;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedProductIds = [],
  onProductSelect,
  loading = false,
  error = null
}) => {
  if (loading) {
    return <Typography>読み込み中...</Typography>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  if (products.length === 0) {
    return <Typography>商品がありません</Typography>;
  }

  return (
    <Paper
      elevation={2}
      sx={{
        borderRadius: 2, // 角の丸さを調整（数値が大きいほど丸くなる）
        overflow: 'hidden' // 角丸の中にテーブルを収める
      }}
    >
      <TableContainer 
        sx={{
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          '& .MuiTableCell-root': { // セルの余白を調整
            padding: '8px 12px' // デフォルトの余白を小さく
          }
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>商品名</TableCell>
              <TableCell align="right">個数</TableCell>
              <TableCell align="center">選択</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((product) => (
              <TableRow 
                key={product.id} 
                hover 
                selected={selectedProductIds.includes(product.id)}
                sx={{ 
                  bgcolor: !product.isChecked ? 'rgba(255, 244, 229, 0.7)' : 'inherit' 
                }}
              >
                <TableCell>{product.name}</TableCell>
                <TableCell align="right">{product.quantity}</TableCell>
                <TableCell align="center">
                  <Checkbox 
                    checked={selectedProductIds.includes(product.id)} 
                    onChange={() => onProductSelect(product.id)} 
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ p: 2, borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
        <Typography variant="body2">
          合計商品数: {products.length} / 合計個数: {products.reduce((sum, product) => sum + (product.quantity || 0), 0)}
        </Typography>
      </Box>
    </Paper>
  );
};