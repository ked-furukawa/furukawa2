import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Checkbox, 
  Button, 
  Paper,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fade,
  Backdrop,
  useMediaQuery,
  useTheme
} from '@mui/material';

// 商品データの型定義
interface Product {
  id: string;
  name: string;
  expectedCount: number;
  isChecked: boolean;
}

interface SortingCheckScreenProps {
  onProductClick?: (productId: string) => void;
  onComplete?: () => void;
}

const SortingCheckScreen: React.FC<SortingCheckScreenProps> = ({
  onProductClick = () => {},
  onComplete = () => {}
}) => {
  const theme = useTheme();
  const isLandscape = useMediaQuery('(orientation: landscape)');
  
  // 商品リストの状態 - 9個に増加
  const [products, setProducts] = useState<Product[]>([
    { id: '1', name: '唐揚げ', expectedCount: 15, isChecked: false },
    { id: '2', name: 'コロッケ', expectedCount: 20, isChecked: false },
    { id: '3', name: 'ポテトサラダ', expectedCount: 8, isChecked: false },
    { id: '4', name: '焼き鳥', expectedCount: 12, isChecked: false },
    { id: '5', name: 'エビフライ', expectedCount: 10, isChecked: false },
    { id: '6', name: '春巻き', expectedCount: 18, isChecked: false },
    { id: '7', name: 'メンチカツ', expectedCount: 14, isChecked: false },
    { id: '8', name: 'ハムカツ', expectedCount: 16, isChecked: false },
    { id: '9', name: 'チキンカツ', expectedCount: 12, isChecked: false }, // 9個目の商品を追加
  ]);
  
  // アラート表示のための状態
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

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
    // 親コンポーネントに通知
    onProductClick(productId);
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
      
      // 少し待ってから親コンポーネントに通知
      setTimeout(() => {
        setAlertOpen(false);
        setTimeout(() => {
          onComplete();
        }, 300); // フェードアウト後に遷移
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
      
      // エラーメッセージは自動で閉じる
      setTimeout(() => {
        setAlertOpen(false);
      }, 3000);
    }
  };

  // 合計商品数と合計個数を計算
  const totalProducts = products.length;
  const totalCount = products.reduce((sum, product) => sum + product.expectedCount, 0);
  const checkedCount = products.filter(product => product.isChecked).length;

  // フッターの高さを定義（レスポンシブ対応）
  const footerHeight = isLandscape ? 70 : 60;
  
  // ナビゲーションボタン用のスペースを確保（上部の余白）
  const navButtonHeight = isLandscape ? 60 : 50;

  return (
    <Box sx={{ 
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      pt: `${navButtonHeight}px`, // ナビゲーションボタン用の上部余白を追加
      pb: 0,
      px: 0,
      overflow: 'hidden' // はみ出しを防止
    }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 0, // 角丸を削除して画面いっぱいに
          overflow: 'hidden',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: `calc(100vh - ${navButtonHeight}px)` // ナビゲーションボタンの高さを引いた分
        }}
      >
        <TableContainer sx={{ 
          flex: 1,
          height: `calc(100vh - ${navButtonHeight + footerHeight}px)`, // ナビゲーションとフッターの高さを引いた分
          width: '100%',
          overflowY: 'auto',
          '& .MuiTableCell-root': {
            padding: isLandscape ? '12px 16px' : '10px 12px',
            fontSize: isLandscape ? '1.2rem' : '1.1rem'
          }
        }}>
          <Table stickyHeader size={isLandscape ? "medium" : "small"} sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '40%',
                  backgroundColor: theme.palette.primary.light,
                  color: 'white'
                }}>食品名</TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  width: '30%',
                  backgroundColor: theme.palette.primary.light,
                  color: 'white'
                }}>商品数</TableCell>
                <TableCell padding="checkbox" align="center" sx={{ 
                  fontWeight: 'bold', 
                  width: '30%',
                  backgroundColor: theme.palette.primary.light,
                  color: 'white'
                }}>確認</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => (
                <TableRow 
                  key={product.id}
                  hover
                  onClick={() => handleProductClick(product.id)}
                  selected={product.isChecked}
                  sx={{ 
                    cursor: 'pointer',
                    bgcolor: !product.isChecked ? 'rgba(255, 244, 229, 0.7)' : 'inherit',
                    '&:last-child td, &:last-child th': { border: 0 },
                    height: isLandscape ? '70px' : '60px'
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontSize: isLandscape ? '1.3rem' : '1.1rem' }}>
                    {product.name}
                  </TableCell>
                  <TableCell align="right" sx={{ fontSize: isLandscape ? '1.3rem' : '1.1rem' }}>
                    {product.expectedCount}
                  </TableCell>
                  <TableCell padding="checkbox" align="center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={product.isChecked}
                      onChange={() => handleCheckProduct(product.id)}
                      inputProps={{ 'aria-labelledby': `checkbox-${product.id}` }}
                      sx={{ 
                        '& .MuiSvgIcon-root': { 
                          fontSize: isLandscape ? 32 : 28 
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box 
          p={isLandscape ? 2 : 1.5} 
          bgcolor="#f5f5f5" 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            height: footerHeight,
            boxSizing: 'border-box'
          }}
        >
          <Typography variant={isLandscape ? "body1" : "body2"} align="left" sx={{ fontWeight: 'bold' }}>
            確認済: {checkedCount}/{totalProducts} 品目 (合計{totalCount}個)
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size={isLandscape ? "large" : "medium"}
            onClick={handleComplete}
            sx={{ 
              py: isLandscape ? 1.5 : 1,
              px: isLandscape ? 6 : 4,
              fontSize: isLandscape ? '1.2rem' : '1rem',
              minWidth: isLandscape ? '200px' : '150px'
            }}
          >
            確認完了
          </Button>
        </Box>
      </Paper>
      
      {/* 表の真ん中にアラートを表示 */}
      <Backdrop
        sx={{ 
          color: '#fff', 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }}
        open={alertOpen}
        onClick={() => setAlertOpen(false)}
      >
        <Fade in={alertOpen}>
          <Alert 
            severity={alertSeverity}
            onClose={() => setAlertOpen(false)}
            sx={{ 
              width: isLandscape ? '50%' : '80%',
              maxWidth: isLandscape ? '600px' : '400px',
              boxShadow: 6,
              fontSize: isLandscape ? '1.3rem' : '1.1rem',
              padding: isLandscape ? '16px 24px' : '12px 16px',
              '& .MuiAlert-message': {
                fontSize: isLandscape ? '1.2rem' : '1rem'
              },
              '& .MuiAlert-icon': {
                fontSize: isLandscape ? '2rem' : '1.5rem'
              }
            }}
          >
            {alertMessage}
          </Alert>
        </Fade>
      </Backdrop>
    </Box>
  );
};

export default SortingCheckScreen;