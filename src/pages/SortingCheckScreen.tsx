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

import ProductStoresModal from '../components/ProductStoresModal'; //逆引きモーダル


const client= generateClient<Schema>();

import { resolveImportId } from "../components/utils/resolveImportId";
import { useParams } from 'react-router-dom';
import { formatDateToJST } from '../components/utils/formatDateToJST';


// 商品データの型定義（Orderモデルベース）
interface Product {
  date:string;

  itemId: string; //itemId
  itemName: string; // itemName
  itemFormalName: string;
  itemCounts: number; // itemCountの合計値
  isChecked: boolean; // ローカル状態で管理

  departmentId:string; //担当部門ID
}

interface SortingCheckScreenProps {
  onProductClick?: (productId: string) => void;
  onComplete?: () => void;
  targetDate?: string; // 対象日付（YYYY-MM-DD形式）
  targetStoreId?: string; // 対象店舗ID
  navigateTo: (pageKey: string) => void; // ← 追加
  //    A?: boolean;(to上越)
}

const SortingCheckScreen: React.FC<SortingCheckScreenProps> = ({
  onProductClick = () => {},
  onComplete = () => {},
  navigateTo // 
}) => {
  const theme = useTheme();
  const isPortrait = useMediaQuery('(orientation: portrait)');
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // 商品リストの状態
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // アラート表示のための状態
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error'>('success');

  // モーダル用の状態を追加
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [rawOrderData, setRawOrderData] = useState<any[]>([]); // 生の注文データを保存

  const [hasNakanoShimaPending, setHasNakanoShimaPending] = useState(false);// 中之島が完了してるかのフラグ 
  const [hasAnyPending, setHasAnyPending] = useState<boolean>(false);

  const {departmentId} = useParams();

  // const date="20250609" //テスト用固定日付
  const date = formatDateToJST(new Date);

const loadProducts = async () => {
  setLoading(true);
  setError(null);
  setProducts([]);

  try {
        console.log('departmentId:',departmentId)
    if (!departmentId) {
      setError("ユーザー情報が取得できませんでした");
      setLoading(false);
      return;
    }

    const resolvedImportId = await resolveImportId(date, departmentId);
    if (!resolvedImportId) {
      setError("データが取得できませんでした");
      setLoading(false);
      return;
    }
    console.log("importResult",resolvedImportId)

    const result = await client.models.Order.listOrdersByDeptAndImport({
      date,
      departmentIdImportId: {
        eq: {
          departmentId,
          importId: resolvedImportId.importId,
        },
        
      },
      
    },
    {
    limit: 1000  // 最大1000件取得
  }); 
    
    const rawOrders = result.data; //加工前の注文データ
    console.log("rawOrders",rawOrders)

    const productMap: { [itemId: string]: Product } = {};

    // PENDINGのデータがあるかチェック
  const pendingOrders = rawOrders.filter(o => o.status === "PENDING");
  setHasAnyPending(pendingOrders.length > 0);
    // 中之島が完了してるかチェック
  const hasNakano = pendingOrders.some(o => o.storeTc === "中之島");
  setHasNakanoShimaPending(hasNakano);

    result.data.forEach(order => {
      const count = order.status === 'PENDING' ? (order.itemCount ?? 0) : 0;
      if (!productMap[order.itemId]) {
        productMap[order.itemId] = {
          date:date,
          itemId: order.itemId,
          itemName: order.itemName ?? "",
          itemFormalName: order.itemFormalName ?? "",
          itemCounts: 0,
          isChecked: false,
          departmentId: order.departmentId ?? "",
        };
      }
      productMap[order.itemId].itemCounts += count;
    });

      setRawOrderData(rawOrders) //モーダルに渡す用
      console.log("test",rawOrderData)

    setProducts(Object.values(productMap));
  } catch (err) {
    setError("データ取得中に問題が発生しました。ネットワークを確認するか、再読み込みしてください。");
  } finally{
    setLoading(false); // 読み込み完了
  }
};

useEffect(() => {
  loadProducts();

}, [date]);




  // チェックボックスの状態を変更（ローカル状態のみ）
  const handleCheckProduct = (productId: string) => {
    setProducts(products.map(product =>
      product.itemId === productId
        ? { ...product, isChecked: !product.isChecked }
        : product
    ));
  };

  // 商品クリックハンドラを修正
  const handleProductClick = (productId: string) => {
    const product = products.find(p => p.itemId === productId);
    if (product) {
      setSelectedProduct(product);
      setModalOpen(true);
    }
    // 既存のonProductClick呼び出しは残しておく（互換性のため）
    onProductClick(productId);
  };

  // モーダルを閉じる関数を追加
  const handleCloseModal = () => {
    setModalOpen(false);
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
        .map(product => product.itemName)
        .join('、');

      setAlertMessage(`${uncheckedProducts}の確認が完了していません`);
      setAlertSeverity('error');
      setAlertOpen(true);
      setTimeout(() => setAlertOpen(false), 3000);
    }
  };

  // データを再読み込みする関数
  const handleRefresh = () => {
    loadProducts();
  };



  // 合計商品数と合計個数を計算
  const totalProducts = products.length;
  const totalCount = products.reduce((sum, product) => sum + product.itemCounts, 0);
  const checkedCount = products.filter(product => product.isChecked).length;

  
  // フッターの高さを定義（レスポンシブ対応）
  const headerFontSize = isPortrait ? '1.4rem' : '1.2rem';
  const cellFontSize = isPortrait ? '1.3rem' : '1rem';
  const rowHeight = isPortrait ? '72px' : '64px';
  const navButtonHeight = isPortrait ? 56 : 50;

  let destination='BoxQuantityInput'
  if(departmentId==='kakou2' || departmentId==='honsyabuturyu'){
    destination='SpecialSorting'
  }



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
    <Box display="flex" flexDirection="column" height="100vh" sx={{ px:-1000}}>
      {!hasAnyPending ? (
    <Typography>本日の注文はすべて完了しています</Typography>
    ) : (
      <>
        <Box
          sx={{
            p: 0.5,
            textAlign: 'center',
            backgroundColor: hasNakanoShimaPending ?  '#ffebee' : '#e8f5e9',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: 'bold',
              fontSize: isPortrait ? '1.6rem' : '1.4rem',
              color: hasNakanoShimaPending ? 'error.main' : 'primary.main',
            }}
          >
            {hasNakanoShimaPending
              ? '仕分け作業前確認':'上越センター前確認'
              }
          </Typography>
        </Box>

      <Paper
        elevation={3}
        sx={{
          borderRadius: 0,
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          width: '%',
          height: `calc(100vh - ${navButtonHeight+80}px)`
        }}
      >

        <TableContainer
          ref={tableContainerRef}
          sx={{
            flex: 1,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            width: '100%',

          }}
        >
          <Table stickyHeader size="medium" sx={{ width: '100%' }}>
            <TableHead>
              <TableRow
                sx={{
                  height: isPortrait ? '80px' : '64px',
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
                  key={product.itemId}
                  hover
                  // onClick={() => handleProductClick(product.id)}
                  selected={product.isChecked}
                  sx={{
                    cursor: 'default',// カーソルをデフォルトに変更（行全体はクリック可能に見せない）
                    // bgcolor: !product.isChecked ? 'rgba(255, 244, 229, 0.7)' : 'inherit',
                    '&:last-child td, &:last-child th': { border: 0 },
                    height: 
                    rowHeight,
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
                    <Box
                      component="span"
                      onClick={() => handleProductClick(product.itemId)}
                      sx={{
                        cursor: 'pointer',
                        borderBottom: '1px solid',
                        borderColor: 'text.primary',
                        display: 'inline-block',
                        paddingBottom: '1px', // 下線とテキストの間に少し余白を追加
                      }}
                    >
                      {product.itemName || product.itemFormalName || `商品ID: ${product.itemId}`}
                    </Box>
                    {/* 社内呼称がある場合のみ正式名称をキャプションとして表示 */}
                    {product.itemName && product.itemFormalName && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: '0.85rem' // キャプションも大きく
                        }}
                      >
                        {product.itemFormalName}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      fontSize: cellFontSize,
                      fontWeight: 'bold'
                    }}
                  >
                    {product.itemCounts}
                  </TableCell>
                  <TableCell padding="checkbox" align="center" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={product.isChecked}
                      onChange={() => handleCheckProduct(product.itemId)}
                      inputProps={{ 'aria-labelledby': `checkbox-${product.itemId}` }}
                      sx={{
                        '& .MuiSvgIcon-root': {
                          fontSize: isPortrait ? 40 : 32
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
          p={isPortrait ? 2 : 1.5}
          //bgcolor="#f5f5f5"
          sx={{
            position: 'sticky', 
            backgroundColor: 'white',
            borderTop: '1px solid #ccc',
            p: isPortrait ? 2 : 1.5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 1000
          }}
        >
          <Typography
            variant={isPortrait ? "h6" : "subtitle1"}
            align="left"
            sx={{
              fontWeight: 'bold',
              fontSize: isPortrait ? '1.4rem' : '1.2rem'
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
              py: isPortrait ? 1.5 : 1,
              px: isPortrait ? 6 : 4,
              fontSize: isPortrait ? '1.4rem' : '1.2rem',
              fontWeight: 'bold',
              minWidth: isPortrait ? '220px' : '180px',
              opacity: !products.every(p => p.isChecked) ? 0.5 : 1, // グレーアウト風見た目（任意）
              pointerEvents: !products.every(p => p.isChecked) ? 'none' : 'auto' // 任意
            }}
          >
            確認完了
          </Button>
        </Box>
      </Paper>
      </>
          )}
    
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
            width: '90%',
            maxWidth: 480,
            p: isPortrait ? 4 : 3,
            textAlign: 'center',
            borderRadius: 2
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: isPortrait ? '1.6rem' : '1.3rem',
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
                    navigateTo(destination); // 任意の画面キーへ遷移
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

{/* モーダルの追加 */}
      <ProductStoresModal
        open={modalOpen}
        onClose={handleCloseModal}
        product={selectedProduct}
        allOrders={rawOrderData}
      />
      
    </Box>
  );
};

export default SortingCheckScreen;