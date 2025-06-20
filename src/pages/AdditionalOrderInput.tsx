import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,  
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  SelectChangeEvent,
  CircularProgress,
  Autocomplete,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { generateClient } from 'aws-amplify/data';
// import { fetchUserAttributes } from 'aws-amplify/auth';
import type { Schema } from "../../amplify/data/resource";
import { useParams } from 'react-router-dom';
import { formatDateToJST } from '../components/utils/formatDateToJST';

// Amplify クライアントの初期化
const client = generateClient<Schema>();

/**
 * 店舗情報の型定義
 */
interface Store {
  id: string;
  storeId: string;
  storeName: string;
  storeTc: string; // 送り先情報（中之島/上越）
}

/**
 * 商品マスタの型定義
 */
interface Product {
  productId: string;
  productName: string;
  formalName?: string;
  category?: string;
  departmentId?: string; // 担当部門ID
}

/**
 * 部門情報の型定義
 */
interface Department {
  id: string;
  name: string;
}

/**
 * 注文アイテムの型定義
 */
interface OrderItem {
  id: string;
  storeTc: string;
  itemId: string;
  itemName: string;
  orderCount: number;
  departmentId?: string; 
}

/**
 * 新しい空の注文アイテムを作成する関数
 * @param storeTc 送り先（デフォルトは中之島）
 * @returns 空の注文アイテム
 */
const createEmptyOrderItem = (storeTc: string = '中之島', departmentId: string = ''): OrderItem => ({
  id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  storeTc,
  itemId: '',
  itemName: '',
  orderCount: 0,
  departmentId
});

/**
 * 追加注文入力ページコンポーネント
 * 送り先選択 → 店舗選択 → 商品情報入力の流れで注文を作成
 */
const AdditionalOrderInput: React.FC = () => {
  // =========== 状態管理 ===========
  // 店舗関連
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedDestination, setSelectedDestination] = useState<string>('');
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<string>('');

  // 部門関連
  const [departments, setDepartments] = useState<Department[]>([
    { id: 'all', name: '全部門' } // デフォルト値
  ]);
  const [userDepartment, setUserDepartment] = useState<Department | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');

  // 商品マスタ関連
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // 注文アイテム
  const [orderItems, setOrderItems] = useState<OrderItem[]>([createEmptyOrderItem()]);

  // UI状態
  const [loading, setLoading] = useState<boolean>(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [snackbar, setSnackbar] = useState<{ 
    open: boolean; 
    message: string; 
    severity: 'success' | 'error' 
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const {departmentId} = useParams();

  // =========== データ取得関数 ===========
  
  /**
   * 店舗データの取得関数
   */
  const fetchStores = async () => {
    try {
      const { data } = await client.models.Order.list();
      
      // 店舗データを抽出して重複を排除
      const storeMap = new Map<string, Store>();
      
      data.forEach(order => {
        if (order.storeId && order.storeName && order.storeTc && !storeMap.has(order.storeId)) {
          storeMap.set(order.storeId, {
            id: order.storeId,
            storeId: order.storeId,
            storeName: order.storeName,
            storeTc: order.storeTc
          });
        }
      });
      
      return Array.from(storeMap.values());
    } catch (error) {
      console.error('店舗情報の取得に失敗しました:', error);
      return [];
    }
  };
  
  /**
   * 商品マスタの取得関数
   */
  const fetchProducts = async () => {
    try {
      // 注文データから商品情報を抽出
      const { data } = await client.models.Order.list();
      const productMap = new Map<string, Product>();
      
      data.forEach(order => {
        if (order.itemId && order.itemName && !productMap.has(order.itemId)) {
          productMap.set(order.itemId, {
            productId: order.itemId,
            productName: order.itemName,
            formalName: order.itemFormalName || '',
            departmentId: order.departmentId
          });
        }
      });
      
      return Array.from(productMap.values());
    } catch (error) {
      console.error('商品情報の取得に失敗しました:', error);
      return [];
    }
  };
  
  /**
   * 部門情報を取得する関数
   */
  const fetchDepartments = async () => {
    try {
      // 注文データから部門情報を抽出
      const { data } = await client.models.Order.list();
      const departmentMap = new Map<string, Department>();
      
      // デフォルト部門を追加
      departmentMap.set('all', { id: 'all', name: '全部門' });
      
      data.forEach(order => {
        if (order.departmentId && order.departmentName && !departmentMap.has(order.departmentId)) {
          departmentMap.set(order.departmentId, {
            id: order.departmentId,
            name: order.departmentName
          });
        }
      });
      
      return Array.from(departmentMap.values());
    } catch (error) {
      console.error('部門情報の取得に失敗しました:', error);
      return [{ id: 'all', name: '全部門' }]; // デフォルト値を返す
    }
  };

  // =========== 副作用 ===========

  /**
   * 初期ロード時にユーザー情報を取得
   */
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        console.log('departmentId',departmentId)
        
        if (departmentId) {
          // 部門情報が取得できるまで待機
          const dept = departments.find(d => d.id === departmentId);
          if (dept) {
            setUserDepartment(dept);
            setSelectedDepartment(dept.id);
          } else {
            // 部門情報がまだ取得できていない場合は、IDだけ設定
            setUserDepartment({ id: departmentId, name: departmentId });
            setSelectedDepartment(departmentId);
          }
        }
      } catch (error) {
        console.error('ユーザー情報の取得に失敗しました:', error);
      }
    };

    fetchUserInfo();
  }, [departments]);

  /**
   * 初期ロード時に店舗データ、商品マスタ、部門情報を取得
   */
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // 店舗データ、商品マスタ、部門情報を並列で取得
        const [storesData, productsData, departmentsData] = await Promise.all([
          fetchStores(),
          fetchProducts(),
          fetchDepartments()
        ]);
        
        setStores(storesData);
        setProducts(productsData);
        setDepartments(departmentsData);
        
        // 初期フィルタリングは部門選択後に行うため、ここでは全商品をセット
        setFilteredProducts(productsData);
        
      } catch (error) {
        console.error('データの取得に失敗しました:', error);
        setSnackbar({
          open: true,
          message: 'データの取得に失敗しました',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  /**
   * 送り先選択時に店舗をフィルタリング
   */
  useEffect(() => {
    if (selectedDestination) {
      const filtered = stores.filter(store => store.storeTc === selectedDestination);
      setFilteredStores(filtered);
      
      // 選択中の店舗が新しいフィルタに含まれていない場合はリセット
      const currentStoreExists = filtered.some(store => store.storeId === selectedStore);
      if (!currentStoreExists) {
        setSelectedStore('');
      }
    } else {
      setFilteredStores([]);
      setSelectedStore('');
    }
  }, [selectedDestination, stores, selectedStore]);

  /**
   * 店舗選択時に部門をデフォルト値にリセット
   */
  useEffect(() => {
    if (selectedStore) {
      // 店舗が変更されたら部門をデフォルト値にリセット
      if (userDepartment) {
        setSelectedDepartment(userDepartment.id);
      } else {
        setSelectedDepartment('all');
      }
    }
  }, [selectedStore, userDepartment]);

  /**
   * 部門選択時に商品をフィルタリング
   */
  useEffect(() => {
    if (selectedDepartment === 'all') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => 
        !product.departmentId || product.departmentId === selectedDepartment
      );
      setFilteredProducts(filtered);
    }
  }, [selectedDepartment, products]);

  // =========== イベントハンドラ ===========

  /**
   * 部門選択の変更ハンドラ
   */
  const handleDepartmentChange = (event: SelectChangeEvent<string>) => {
    const newDepartment = event.target.value;
    setSelectedDepartment(newDepartment);

    // 部門が変更されたら、注文アイテムの部門も一括更新
    setOrderItems(items => 
      items.map(item => ({
        ...item,
        departmentId: newDepartment === 'all' ? '' : newDepartment
      }))
    );
  };

  /**
   * 送り先選択の変更ハンドラ
   */
  const handleDestinationChange = (event: SelectChangeEvent<string>) => {
    const newDestination = event.target.value;
    setSelectedDestination(newDestination);

    // 送り先が変更されたら、注文アイテムの送り先も一括更新
    setOrderItems(items => 
      items.map(item => ({
        ...item,
        storeTc: newDestination
      }))
    );
  };

  /**
   * 店舗選択の変更ハンドラ
   */
  const handleStoreChange = (event: SelectChangeEvent<string>) => {
    setSelectedStore(event.target.value);
  };

  /**
   * 商品選択の変更ハンドラ
   */
  const handleProductSelect = (index: number, product: Product | null) => {
    if (!product) return;
    
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      itemId: product.productId,
      itemName: product.productName,
      departmentId: product.departmentId || (selectedDepartment === 'all' ? '' : selectedDepartment)
    };
    setOrderItems(updatedItems);
  };

  /**
   * 注文アイテムの変更ハンドラ
   */
  const handleOrderItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    setOrderItems(updatedItems);
  };

  /**
   * 新しい行の追加
   */
  const handleAddRow = () => {
    const departmentId = selectedDepartment === 'all' ? '' : selectedDepartment;
    setOrderItems([...orderItems, createEmptyOrderItem(selectedDestination, departmentId)]);
  };

  /**
   * 行の削除
   */
  const handleDeleteRow = (index: number) => {
    if (orderItems.length > 1) {
      const updatedItems = orderItems.filter((_, i) => i !== index);
      setOrderItems(updatedItems);
    } else {
      setSnackbar({
        open: true,
        message: '少なくとも1つの商品が必要です',
        severity: 'error'
      });
    }
  };

  /**
   * フォームのリセット
   */
  const handleReset = () => {
    setSelectedStore('');
    const departmentId = selectedDepartment === 'all' ? '' : selectedDepartment;
    setOrderItems([createEmptyOrderItem(selectedDestination, departmentId)]);
  };

  /**
   * 保存ダイアログを開く
   */
  const handleOpenSaveDialog = () => {
    // 入力検証
    const isValid = validateForm();
    if (isValid) {
      setSaveDialogOpen(true);
    }
  };

  /**
   * フォームの検証
   */
  const validateForm = (): boolean => {
    if (!selectedDestination) {
      setSnackbar({
        open: true,
        message: '送り先を選択してください',
        severity: 'error'
      });
      return false;
    }

    if (!selectedStore) {
      setSnackbar({
        open: true,
        message: '店舗を選択してください',
        severity: 'error'
      });
      return false;
    }

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];
      if (!item.itemId || !item.itemName || item.orderCount <= 0) {
        setSnackbar({
          open: true,
          message: `行 ${i + 1} に未入力または無効な値があります`,
          severity: 'error'
        });
        return false;
      }
    }

    return true;
  };

  /**
   * 注文の保存
   */
  const handleSaveOrder = async () => {
    try {
      setLoading(true);
      setSaveDialogOpen(false);

      const selectedStoreObj = stores.find(store => store.storeId === selectedStore);
      if (!selectedStoreObj) {
        throw new Error('選択された店舗が見つかりません');
      }

      // 選択された部門の名前を取得
      const selectedDeptObj = departments.find(dept => dept.id === selectedDepartment);
      const departmentName = selectedDeptObj?.name || '追加注文';

      const date = formatDateToJST(new Date);
      const timestamp = Date.now();
      const importId = `additional-${timestamp}`; // 追加注文用のユニークID

      // 一括で保存するためのPromise配列
      const savePromises = orderItems.map(item => 
        client.models.Order.create({
          importId: importId, // タイムスタンプベースのユニークID
          date: date,
          storeId: selectedStoreObj.storeId,
          storeName: selectedStoreObj.storeName,
          storeTc: selectedDestination,
          itemId: item.itemId,
          itemName: item.itemName,
          itemCount: item.orderCount,
          departmentId: item.departmentId || (selectedDepartment === 'all' ? 'additional' : selectedDepartment),
          departmentName: departmentName, // 部門名を追加
          status: 'PENDING' // 初期ステータス
        })
      );

      // すべての保存処理を並列実行
      await Promise.all(savePromises);

      // 保存成功後の処理
      setSnackbar({
        open: true,
        message: '追加注文が正常に保存されました',
        severity: 'success'
      });

      // フォームをリセット
      handleReset();
    } catch (error) {
      console.error('注文の保存に失敗しました:', error);
      
      // エラーメッセージをより詳細に
      let errorMessage = '注文の保存に失敗しました';
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * スナックバーを閉じる
   */
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // =========== レンダリング ===========
  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h4" component="h1">
          追加注文入力
        </Typography>
        
        {userDepartment && (
          <Chip 
            label={`部門: ${userDepartment.name}`} 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '1rem', py: 0.5, px: 1 }}
          />
        )}
      </Box>

      {/* 送り先と店舗選択セクション */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* 送り先、店舗選択、部門選択を横並びに配置 */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
          {/* 送り先選択 */}
          <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' } }}>
            <InputLabel id="destination-select-label">送り先</InputLabel>
            <Select
              labelId="destination-select-label"
              id="destination-select"
              value={selectedDestination}
              label="送り先"
              onChange={handleDestinationChange}
              disabled={loading}
            >
              <MenuItem value="中之島">中之島</MenuItem>
              <MenuItem value="上越">上越</MenuItem>
            </Select>
          </FormControl>

          {/* 店舗選択 */}
          <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' } }} disabled={!selectedDestination}>
            <InputLabel id="store-select-label">店舗選択</InputLabel>
            <Select
              labelId="store-select-label"
              id="store-select"
              value={selectedStore}
              label="店舗選択"
              onChange={handleStoreChange}
              disabled={loading || !selectedDestination}
            >
              {filteredStores.map((store) => (
                <MenuItem key={store.id} value={store.storeId}>
                  {store.storeId} - {store.storeName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* 部門選択 */}
          <FormControl sx={{ flex: 1, minWidth: { xs: '100%', sm: '30%' } }} disabled={!selectedStore}>
            <InputLabel id="department-select-label">部門選択</InputLabel>
            <Select
              labelId="department-select-label"
              id="department-select"
              value={selectedDepartment}
              label="部門選択"
              onChange={handleDepartmentChange}
              disabled={loading || !selectedStore}
              startAdornment={<FilterListIcon sx={{ mr: 1, color: 'action.active' }} />}
            >
              {departments.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* 商品入力テーブル */}
        <TableContainer component={Paper} sx={{ mb: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="65%">商品</TableCell>
                <TableCell width="20%">商品数</TableCell>
                <TableCell width="15%">操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orderItems.map((item, index) => (
                <TableRow key={item.id}>
                  {/* 商品選択 - Autocompleteを使用 */}
                  <TableCell>
                    <Autocomplete
                      options={filteredProducts}
                      getOptionLabel={(option) => `${option.productId}: ${option.productName}`}
                      isOptionEqualToValue={(option, value) => option.productId === value.productId}
                      value={item.itemId ? filteredProducts.find(p => p.productId === item.itemId) || null : null}
                      onChange={(_, newValue) => handleProductSelect(index, newValue)}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          size="small"
                          placeholder="商品を選択"
                          fullWidth
                        />
                      )}
                      disabled={loading}
                    />
                  </TableCell>
                  
                  {/* 商品数入力 - 数値入力に最適化 */}
                  <TableCell>
                    <TextField
                      size="small"
                      type="number"
                      value={item.orderCount === 0 ? '' : item.orderCount}
                      onChange={(e) => handleOrderItemChange(index, 'orderCount', parseInt(e.target.value) || 0)}
                      fullWidth
                      inputProps={{ 
                        min: 0,
                        inputMode: 'numeric',
                        style: { fontFamily: 'monospace' } // 数値入力に適したフォント
                      }}
                      disabled={loading}
                    />
                  </TableCell>
                  
                  {/* 行の削除ボタン */}
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteRow(index)}
                      disabled={orderItems.length === 1 || loading}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* アクションボタン */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={handleAddRow}
            disabled={loading || !selectedStore}
          >
            行を追加
          </Button>
          <Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={loading}
              sx={{ mr: 1 }}
            >
              リセット
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleOpenSaveDialog}
              disabled={loading}
            >
              保存
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* 入力履歴セクション */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          入力履歴
        </Typography>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant="body1" color="text.secondary">
            履歴機能は現在開発中です。今後のアップデートをお待ちください。
          </Typography>
        </Box>
      </Paper>

      {/* 保存確認ダイアログ */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
      >
        <DialogTitle>確認</DialogTitle>
        <DialogContent>
          <DialogContentText>
            入力内容を保存しますか？
          </DialogContentText>
          <Box mt={2}>
            <Typography variant="body2" color="text.secondary">
              部門: {departments.find(d => d.id === selectedDepartment)?.name || selectedDepartment}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              送り先: {selectedDestination}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              店舗: {stores.find(s => s.storeId === selectedStore)?.storeName || selectedStore}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              商品数: {orderItems.length}点
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleSaveOrder} variant="contained">
            保存
          </Button>
        </DialogActions>
      </Dialog>

      {/* ローディングインジケーター */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 9999,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* スナックバー通知 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdditionalOrderInput;