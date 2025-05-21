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
  Skeleton,
  Alert,
  Box
} from '@mui/material';
import { Product } from '../types';

// コンポーネントのProps型定義
interface ProductListProps {
  products: Product[];
  selectedProductId: string | null;
  onProductSelect: (productId: string) => void;
  loading?: boolean;
  error?: string | null;
}

/**
 * 商品リストを表形式で表示するコンポーネント
 */
export const ProductList: React.FC<ProductListProps> = ({
  products,
  selectedProductId,
  onProductSelect,
  loading = false,
  error = null
}) => {
  // エラーがある場合はエラーメッセージを表示
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
      <TableContainer>
        <Table>
          <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox" width="10%">選択</TableCell>
              <TableCell width="60%">商品名</TableCell>
              <TableCell align="right" width="30%">個数</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // ローディング中のスケルトン表示
              Array(5).fill(0).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell padding="checkbox">
                    <Skeleton variant="rectangular" width={20} height={20} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell align="right">
                    <Skeleton variant="text" width={40} />
                  </TableCell>
                </TableRow>
              ))
            ) : products.length > 0 ? (
              // 商品リストの表示
              products.map((product) => (
                <TableRow 
                  key={product.id}
                  hover
                  selected={selectedProductId === product.id}
                  onClick={() => onProductSelect(product.id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox 
                      checked={selectedProductId === product.id}
                      onChange={() => onProductSelect(product.id)}
                      color="primary"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1">{product.name}</Typography>
                    {product.description && (
                      <Typography variant="body2" color="text.secondary">
                        {product.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography 
                      variant="body1" 
                      fontWeight={selectedProductId === product.id ? 'bold' : 'regular'}
                    >
                      {product.quantity}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              // 商品がない場合のメッセージ
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    商品がありません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* テーブル下部のサマリー情報 */}
      {!loading && products.length > 0 && (
        <Box p={2} bgcolor="#f5f5f5">
          <Typography variant="body2" align="right">
            合計商品数: {products.length} / 
            合計個数: {products.reduce((sum, product) => sum + product.quantity, 0)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};