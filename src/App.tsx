import { useState } from "react";
import { Box, Button, Drawer, List, ListItem, ListItemButton, ListItemText, Toolbar, AppBar, Typography } from '@mui/material';

//各画面のimport
import FinalCheck from "./pages/FinalCheck"
import TestComponent from "./pages/TestComponent.tsx"
import BoxQuantityInput from "./pages/BoxQuantityInput.tsx";
import SortingCheckScreen from "./pages/SortingCheckScreen.tsx"
import ProductDetailScreen from "./pages/ProductDetailScreen.tsx";
import ExcelUpload from "./pages/ExcelUpload.tsx"

const pageList = [//- key:stateで使う識別子 - component: 実際に表示する React コンポーネント
  { key: 'ExcelUpload', label: 'エクセルアップロード', component: <ExcelUpload /> },
  { key: 'FinalCheck', label: '最終確認', component: <FinalCheck /> },
  { key: 'Test', label: 'テスト画面', component: <TestComponent /> },
  { key: 'BoxQuantityInput', label: '仕分け箱数入力', component: <BoxQuantityInput /> },
  { key: 'SortingCheckScreen', label: '仕分け前商品数確認', component: <SortingCheckScreen /> },  
  { key: 'ProductDetailScreen', label: '商品詳細', component: <ProductDetailScreen /> },  
  // { key: 'C', label: 'C画面', component: <CComponent /> },
];

const App = () => {
  const [view, setView] = useState('ExcelUpload'); // 初期画面の指定
  const [drawerOpen, setDrawerOpen] = useState(false); //サイドバーの状態

  // ✅ 今選択されているページ情報を取得
  const currentPage = pageList.find((p) => p.key === view);

  const toggleDrawer = (open: boolean) => () => { //サイドバー用のトグル
    setDrawerOpen(open);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      {/* AppBarの左上にメニュー開閉ボタン */}
      <AppBar position="fixed">
        <Toolbar>
        <Button
          variant="contained" 
          color="secondary"
          onClick={toggleDrawer(true)}
          sx={{ mr: 2 }}
        >
          メニュー
        </Button>
          <Typography variant="h6" noWrap component="div">
            {currentPage?.label || 'ページが見つかりません'}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* サイドバーのDrawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={toggleDrawer(false)}
          onKeyDown={toggleDrawer(false)}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', p: 1 }}>
          <Button
            variant="contained" 
            color="secondary"
            onClick={toggleDrawer(true)}
            sx={{ mr: 2 }}
          >
            閉じる
          </Button>
          </Box>
          <List>
            {pageList.map((page) => (
              <ListItem key={page.key} disablePadding sx={{ borderBottom: 'none', boxShadow: 'none'  }}>
                <ListItemButton
                  sx={{ borderBottom: 'none' }}
                  selected={view === page.key}
                  onClick={() => setView(page.key)}
                >
                  <ListItemText primary={page.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>


      {/* 🔸 現在のページのコンポーネントを表示 */}
      <Box>
      <main>
        {currentPage?.component || <p>ページが見つかりません</p>}
      </main>
    </Box>
    </Box>
  );

};
export default App;

