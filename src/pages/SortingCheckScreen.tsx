import React, { useState, useRef } from 'react';
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
  useTheme,
  IconButton
} from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

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
  const tableContainerRef = useRef<HTMLDivElement>(null);
  
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

  // スクロール操作のための関数
  const scrollUp = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ top: -200, behavior: 'smooth' });
    }
  };

  const scrollDown = () => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollBy({ top: 200, behavior: 'smooth' });
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

  // フォントサイズを大きく設定
  const headerFontSize = isLandscape ? '1.6rem' : '1.4rem';
  const cellFontSize = isLandscape ? '1.5rem' : '1.3rem';
  const rowHeight = isLandscape ? '80px' : '70px';

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
        {/* スクロールボタン（上） */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          backgroundColor: theme.palette.grey[100],
          borderBottom: `1px solid ${theme.palette.grey[300]}`
        }}>
          <IconButton 
            onClick={scrollUp} 
            size="large" 
            sx={{ 
              width: '100%', 
              borderRadius: 0,
              py: 0.5
            }}
          >
            <KeyboardArrowUpIcon fontSize="large" />
          </IconButton>
        </Box>

        <TableContainer 
          ref={tableContainerRef}
          sx={{ 
            flex: 1,
            height: `calc(100vh - ${navButtonHeight + footerHeight + 80}px)`, // ナビゲーション、フッター、スクロールボタンの高さを引いた分
            width: '100%',
            overflowY: 'auto',
            '& .MuiTableCell-root': {
              padding: isLandscape ? '16px 20px' : '14px 16px',
            },
            '&::-webkit-scrollbar': {
              width: '12px'
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: theme.palette.grey[100]
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.primary.light,
              borderRadius: '6px',
              border: `2px solid ${theme.palette.grey[100]}`
            }
          }}
        >
          <Table stickyHeader size="medium" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ 
                  fontWeight: 'bold', 
                  width: '40%',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: headerFontSize
                }}>食品名</TableCell>
                <TableCell align="right" sx={{ 
                  fontWeight: 'bold', 
                  width: '30%',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: headerFontSize
                }}>商品数</TableCell>
                <TableCell padding="checkbox" align="center" sx={{ 
                  fontWeight: 'bold', 
                  width: '30%',
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  fontSize: headerFontSize
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
                    height: rowHeight,
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.12)'
                    },
                    '&.Mui-selected:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.2)'
                    }
                  }}
                >
                  <TableCell 
                    component="th" 
                    scope="row" 
                    sx={{ 
                      fontSize: cellFontSize,
                      fontWeight: 'bold'
                    }}
                  >
                    {product.name}
                  </TableCell>
                  <TableCell 
                    align="right" 
                    sx={{ 
                      fontSize: cellFontSize,
                      fontWeight: 'bold'
                    }}
                  >
                    {product.expectedCount}
                  </TableCell>
                  <TableCell padding="checkbox" align="center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={product.isChecked}
                      onChange={() => handleCheckProduct(product.id)}
                      inputProps={{ 'aria-labelledby': `checkbox-${product.id}` }}
                      sx={{ 
                        '& .MuiSvgIcon-root': { 
                          fontSize: isLandscape ? 40 : 36 
                        },
                        color: theme.palette.primary.main,
                        '&.Mui-checked': {
                          color: theme.palette.primary.dark
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* スクロールボタン（下） */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          backgroundColor: theme.palette.grey[100],
          borderTop: `1px solid ${theme.palette.grey[300]}`
        }}>
          <IconButton 
            onClick={scrollDown} 
            size="large" 
            sx={{ 
              width: '100%', 
              borderRadius: 0,
              py: 0.5
            }}
          >
            <KeyboardArrowDownIcon fontSize="large" />
          </IconButton>
        </Box>

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
          <Typography 
            variant={isLandscape ? "h6" : "subtitle1"} 
            align="left" 
            sx={{ 
              fontWeight: 'bold',
              fontSize: isLandscape ? '1.4rem' : '1.2rem'
            }}
          >
            確認済: {checkedCount}/{totalProducts} 品目 (合計{totalCount}個)
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={handleComplete}
            sx={{ 
              py: isLandscape ? 1.5 : 1,
              px: isLandscape ? 6 : 4,
              fontSize: isLandscape ? '1.4rem' : '1.2rem',
              fontWeight: 'bold',
              minWidth: isLandscape ? '220px' : '180px'
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
              width: isLandscape ? '60%' : '85%',
              maxWidth: isLandscape ? '700px' : '500px',
              boxShadow: 6,
              fontSize: isLandscape ? '1.5rem' : '1.3rem',
              padding: isLandscape ? '20px 28px' : '16px 20px',
              '& .MuiAlert-message': {
                fontSize: isLandscape ? '1.4rem' : '1.2rem',
                fontWeight: 'bold'
              },
              '& .MuiAlert-icon': {
                fontSize: isLandscape ? '2.2rem' : '1.8rem'
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