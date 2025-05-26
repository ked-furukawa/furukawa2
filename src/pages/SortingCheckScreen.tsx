import  { useState } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  Button, 
  Paper,
  Snackbar,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

// 商品データの型定義
interface Product {
  id: string;
  name: string;
  expectedCount: number;
  isChecked: boolean;
}

const SortingCheckScreen = () => {
  // 商品リストの状態
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: '唐揚げ', expectedCount: 15, isChecked: false },
    { id: '2', name: 'コロッケ', expectedCount: 20, isChecked: false },
    { id: '3', name: 'ポテトサラダ', expectedCount: 8, isChecked: false },
    { id: '4', name: '焼き鳥', expectedCount: 12, isChecked: false },
  ]);
  
  // アラート表示のための状態
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');
  
  const navigate = useNavigate();

  // チェックボックスの状態を変更する関数
  const handleCheckProduct = (productId: string) => {
    setProducts(products.map(product => 
      product.id === productId 
        ? { ...product, isChecked: !product.isChecked } 
        : product
    ));
  };

  // 商品名をクリックして詳細画面に移動する関数
  const handleProductClick = (productId: string) => {
    // 商品詳細画面に遷移
    navigate(`/product-detail/${productId}`);
  };

  // 完了ボタンを押したときの処理
  const handleComplete = () => {
    // すべての商品がチェックされているか確認
    const allChecked = products.every(product => product.isChecked);
    
    if (allChecked) {
      // 成功メッセージを表示
      setAlertMessage('確認完了しました！次の工程に進みます');
      setAlertSeverity('success');
      setAlertOpen(true);
      
      // 少し待ってから次の画面に遷移
      setTimeout(() => {
        navigate('/next-process');
      }, 1500);
    } else {
      // 未チェックの商品名を取得
      const uncheckedProducts = products
        .filter(product => !product.isChecked)
        .map(product => product.name)
        .join('、');
      
      // エラーメッセージを表示
      setAlertMessage(`${uncheckedProducts}の確認が完了していません`);
      setAlertSeverity('error');
      setAlertOpen(true);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', p: 2 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        仕分け確認
      </Typography>
      
      <Paper elevation={3} sx={{ p: 2, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>食品名</TableCell>
                <TableCell align="right">想定商品数</TableCell>
                <TableCell align="center">確認</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id}
                  hover
                  onClick={() => handleProductClick(product.id)}
                  sx={{ 
                    cursor: 'pointer',
                    '&:last-child td, &:last-child th': { border: 0 }
                  }}
                >
                  <TableCell component="th" scope="row">
                    {product.name}
                  </TableCell>
                  <TableCell align="right">{product.expectedCount}</TableCell>
                  <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={product.isChecked}
                      onChange={() => handleCheckProduct(product.id)}
                      inputProps={{ 'aria-labelledby': `checkbox-${product.id}` }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="contained" 
          color="primary" 
          size="large"
          onClick={handleComplete}
        >
          確認完了
        </Button>
      </Box>
      
      {/* アラート表示 */}
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default SortingCheckScreen;