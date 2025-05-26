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
    return <Paper elevation={2}><Box p={3}>読み込み中...</Box></Paper>;
  }
  
  if (error) {
    return <Paper elevation={2}><Box p={3} color="error.main">{error}</Box></Paper>;
  }
  
  if (products.length === 0) {
    return <Paper elevation={2}><Box p={3}>商品がありません</Box></Paper>;
  }

  return (
    <Paper 
      elevation={2} 
      sx={{ 
        borderRadius: 2, // 角の丸さを調整（数値が大きいほど丸くなる）
        overflow: 'hidden' // 角丸の中にテーブルを収める
      }}
    >
      <TableContainer sx={{ 
        maxHeight: 'calc(100vh - 200px)', 
        overflowY: 'auto',
        '& .MuiTableCell-root': { // セルの余白を調整
          padding: '8px 12px' // デフォルトの余白を小さく
        }
      }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>商品名</TableCell>
              <TableCell align="right">個数</TableCell>
              <TableCell padding="checkbox" align="center">選択</TableCell>
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
                <TableCell padding="checkbox" align="center">
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
      <Box p={2} bgcolor="#f5f5f5">
        <Typography variant="body2" align="right">
          合計商品数: {products.length} / 
          合計個数: {products.reduce((sum, product) => sum + (product.quantity || 0), 0)}
        </Typography>
      </Box>
    </Paper>
  );
};