import React, { useState, useRef, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from "../../amplify/data/resource";


const client = generateClient<Schema>();

// 商品データの型定義（Orderモデルベース）
interface Product {
  id: string; // date-storeId-itemIdの組み合わせ
  name: string; // itemNameまたはitemName
  expectedCount: number; // orderCount
  isChecked: boolean; // ローカル状態で管理
  itemId: string;
  date: string;
  storeId: string;
  storeName?: string;
  resDeptName?: string;
}

interface SortingCheckScreenProps {
  onProductClick?: (productId: string) => void;
  onComplete?: () => void;
  targetDate?: string; // 対象日付（YYYY-MM-DD形式）
  targetStoreId?: string; // 対象店舗ID
    navigateTo: (pageKey: string) => void; // ← 追加
  //  fromPageA?: boolean;(to上越)
}


const SortingCheckScreen: React.FC<SortingCheckScreenProps> = ({
  onProductClick = () => {},
  onComplete = () => {},
  targetDate = '2025-06-02', 
  targetStoreId = '019', 
  navigateTo // 
}) => {
  const theme = useTheme();
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 商品リストの状態
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アラート表示のための状態
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  // DynamoDBからOrderデータを取得
  useEffect(() => {
    fetchProducts();
  }, [targetDate, targetStoreId]);

const fetchProducts = async () => {
  try {
    setLoading(true);
    setError(null);

    // 店舗IDは指定せず、日付のみで取得
    const { data } = await client.models.Order.list({
      filter: {
        date: { eq: targetDate }
      }
    });

    console.log(data);

    if (data) {
      // 商品名（itemFormalName）でグループ化して集計
      const groupedMap = new Map<string, Product>();

      for (const order of data) {
        const key = order.itemName || `商品ID: ${order.itemId}`;

        if (groupedMap.has(key)) {
          const existing = groupedMap.get(key)!;
          existing.expectedCount += order.orderCount || 0;
        } else {
          groupedMap.set(key, {
            id: key, // 固有IDでなくても今回は表示上問題なし
            name: key,
            expectedCount: order.orderCount || 0,
            isChecked: false,
            itemId: order.itemId,
            date: order.date,
            storeId: order.storeId,
            storeName: order.storeName ?? undefined,
            resDeptName: order.resDeptName ?? undefined
          });
        }
      }

      const formattedProducts: Product[] = Array.from(groupedMap.values());

      setProducts(formattedProducts);
      console.log(formattedProducts);
    }
  } catch (err) {
    console.error('注文データの取得に失敗しました:', err);
    setError('注文データの取得に失敗しました。再度お試しください。');
  } finally {
    setLoading(false);
  }
};



  // チェックボックスの状態を変更（ローカル状態のみ）
  const handleCheckProduct = (productId: string) => {
    setProducts(products.map(product =>
      product.id === productId
        ? { ...product, isChecked: !product.isChecked }
        : product
    ));
  };

  // 商品名をクリックして詳細画面に移動する関数
  const handleProductClick = (productId: string) => {
    onProductClick(productId);
  };

  // 完了ボタンを押したときの処理
  const handleComplete = () => {
    const allChecked = products.every(product => product.isChecked);

    if (allChecked) {
      setAlertMessage('確認完了しました！次の工程に進みます');
      setAlertSeverity('success');
      setAlertOpen(true);

      setTimeout(() => {
        onComplete();
      }, 1500);
    }
    else {
      const uncheckedProducts = products
        .filter(product => !product.isChecked)
        .map(product => product.name)
        .join('、');

      setAlertMessage(`${uncheckedProducts}の確認が完了していません`);
      setAlertSeverity('error');
      setAlertOpen(true);
      setTimeout(() => setAlertOpen(false), 3000);
    }
  };

  // データを再読み込みする関数
  const handleRefresh = () => {
    fetchProducts();
  };



  // 合計商品数と合計個数を計算
  const totalProducts = products.length;
  const totalCount = products.reduce((sum, product) => sum + product.expectedCount, 0);
  const checkedCount = products.filter(product => product.isChecked).length;

  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1280px)');

  // フッターの高さを定義（レスポンシブ対応）
  const headerFontSize = isTablet ? '1.3rem' : isLandscape ? '1.6rem' : '1.2rem';
  const cellFontSize = isTablet ? '1.2rem' : isLandscape ? '1.5rem' : '1rem';
  const rowHeight = isTablet ? '68px' : isLandscape ? '80px' : '64px';
  const navButtonHeight = isTablet ? 52 : isLandscape ? 60 : 50;


  // ローディング表示
  if (loading) {
    return (
      <Box sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2
      }}>
        <CircularProgress size={60} />
        <Typography variant="h6">注文データを読み込み中...</Typography>
      </Box>
    );
  }

  // エラー表示
  if (error) {
    return (
      <Box sx={{
        height: '100vh',
        width: '100vw',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 2,
        p: 3
      }}>
        <Alert severity="error" sx={{ mb: 2, fontSize: '1.2rem' }}>
          {error}
        </Alert>
        <Button 
          variant="contained" 
          size="large" 
          onClick={handleRefresh}
          sx={{ fontSize: '1.2rem', px: 4, py: 1.5 }}
        >
          再読み込み
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      pt: 0,
      pb: 0,
      px: 0
    }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 0,
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: `calc(100vh - ${navButtonHeight}px)`
        }}
      >

        <TableContainer
          ref={tableContainerRef}
          sx={{
            flexGrow: 1,
            maxHeight: `calc(100dvh - ${navButtonHeight + 64}px)`, // Adjust based on actual footer height
            overflowY: 'auto',
            width: '100%',
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
              <TableRow
                sx={{
                  height: isLandscape ? '120px' : '64px',
                }}
              >
                <TableCell
                  sx={{
                    fontWeight: 'bold',
                    width: '40%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: headerFontSize,
                    verticalAlign: 'bottom', 
                    paddingBottom: '12px', 
                  }}
                >
                  食品名
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 'bold',
                    width: '30%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: headerFontSize,
                    verticalAlign: 'bottom', 
                    paddingBottom: '12px',
                  }}
                >
                  商品数
                </TableCell>
                <TableCell
                  padding="checkbox"
                  align="center"
                  sx={{
                    fontWeight: 'bold',
                    width: '30%',
                    backgroundColor: theme.palette.primary.main,
                    color: 'white',
                    fontSize: headerFontSize,
                    verticalAlign: 'bottom', 
                    paddingBottom: '12px',
                  }}
                >
                  確認
                </TableCell>
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
                    // bgcolor: !product.isChecked ? 'rgba(255, 244, 229, 0.7)' : 'inherit',
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



        <Box
          p={isLandscape ? 2 : 1.5}
          //bgcolor="#f5f5f5"
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
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
            disabled={!products.every(product => product.isChecked)} // ✅ 追加
            sx={{
              py: isLandscape ? 1.5 : 1,
              px: isLandscape ? 6 : 4,
              fontSize: isLandscape ? '1.4rem' : '1.2rem',
              fontWeight: 'bold',
              minWidth: isLandscape ? '220px' : '180px',
              opacity: !products.every(p => p.isChecked) ? 0.5 : 1, // グレーアウト風見た目（任意）
              pointerEvents: !products.every(p => p.isChecked) ? 'none' : 'auto' // 任意
            }}
          >
            確認完了
          </Button>
        </Box>
      </Paper>
     
      {/* アラート表示 */}
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
      >
        <Fade in={alertOpen}>
          <Paper
            elevation={6}
            sx={{
              width: isTablet ? '80%' : isLandscape ? '60%' : '90%',
              maxWidth: 600,
              p: isLandscape ? 4 : 3,
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: isLandscape ? '1.6rem' : '1.3rem',
                fontWeight: 'bold',
                mb: 3
              }}
            >
              {alertMessage}
            </Typography>

            {alertSeverity === 'success' ? (
              <Box display="flex" justifyContent="center" gap={3} mt={2}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  onClick={() => setAlertOpen(false)}
                  sx={{ minWidth: 120, fontSize: '1rem', px: 3, py: 1 }}
                >
                  戻る
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  onClick={() => {
                    setAlertOpen(false);
                    navigateTo('BoxQuantityInput'); // 任意の画面キーへ遷移
                  }}
                  sx={{ minWidth: 140, fontSize: '1rem', px: 3, py: 1 }}
                >
                  仕分け作業へ
                </Button>
              </Box>
            ) : (
              <Button
                variant="contained"
                color="error"
                size="large"
                onClick={() => setAlertOpen(false)}
                sx={{ mt: 2, fontSize: '1rem', px: 3, py: 1 }}
              >
                閉じる
              </Button>
            )}
          </Paper>
        </Fade>
      </Backdrop>

    </Box>
  );
};

export default SortingCheckScreen;