import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, Typography } from '@mui/material';
import SortingCheckScreen from './components/SortingCheckScreen';
import ProductDetailScreen from './components/ProductDetailScreen';
import './App.css';

function App() {
  return (
    <Container maxWidth="sm" sx={{ py: 2 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" align="center" gutterBottom>
          惣菜店舗管理アプリ
        </Typography>
      </Box>
      
      <Routes>
        {/* デフォルトルート - 仕分け確認画面にリダイレクト */}
        <Route path="/" element={<Navigate to="/sorting-check" replace />} />
        
        {/* 仕分け確認画面 */}
        <Route path="/sorting-check" element={<SortingCheckScreen />} />
        
        {/* 商品詳細画面 */}
        <Route path="/product-detail/:productId" element={<ProductDetailScreen />} />
        
        {/* 次の工程画面（仮） */}
        <Route path="/next-process" element={
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>次の工程</Typography>
            <Typography>この画面は開発中です</Typography>
          </Box>
        } />
        
        {/* 404ページ */}
        <Route path="*" element={
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h5" gutterBottom>ページが見つかりません</Typography>
          </Box>
        } />
      </Routes>
    </Container>
  );
}

export default App;