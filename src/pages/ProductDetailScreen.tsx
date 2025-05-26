import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
 
// 仮の商品データ
const productData = {
  '1': { name: '唐揚げ', expectedCount: 15 },
  '2': { name: 'コロッケ', expectedCount: 20 },
  '3': { name: 'ポテトサラダ', expectedCount: 8 },
  '4': { name: '焼き鳥', expectedCount: 12 },
};
 
const ProductDetailScreen = () => {
  const { productId } = useParams<{ productId: string }>();
  const navigate = useNavigate();
 
  // 商品が存在しない場合の処理
  if (!productId || !productData[productId as keyof typeof productData]) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6">商品が見つかりません</Typography>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          戻る
        </Button>
      </Box>
    );
  }
 
  const product = productData[productId as keyof typeof productData];
 
  // 確認完了ボタンを押した時の処理
  const handleConfirm = () => {
    // ここで確認済みとしてマークする処理を実装
    // 例: API呼び出しやステート更新など
   
    // 前の画面に戻る
    navigate(-1);
  };
 
  return (
    <Box sx={{ maxWidth: 600, margin: '0 auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          {product.name}
        </Typography>
      </Box>
     
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <TableContainer>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell component="th" scope="row">食品名</TableCell>
                <TableCell>{product.name}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell component="th" scope="row">想定残数</TableCell>
                <TableCell>{product.expectedCount}個</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
       
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleConfirm}
          >
            確認完了
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
 
export default ProductDetailScreen;