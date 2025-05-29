import { useState } from "react";
import { 
  Box, 
  Drawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText 
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';

// 各画面のimport
import FinalCheck from "./pages/FinalCheck"
import TestComponent from "./pages/TestComponent.tsx"
import BoxQuantityInput from "./pages/BoxQuantityInput.tsx";
import SortingCheckScreen from "./pages/SortingCheckScreen.tsx"
import StoreDoubleCheckList from "./pages/StoreDoubleCheckList.tsx";
import ExcelUpload from "./pages/ExcelUpload.tsx"

const pageList = [//- key:stateで使う識別子 - component: 実際に表示する React コンポーネント
  { key: 'ExcelUpload', label: 'エクセルアップロード', component: <ExcelUpload /> },
  { key: 'FinalCheck', label: '最終確認', component: <FinalCheck /> },
  { key: 'Test', label: 'テスト画面', component: <TestComponent /> },
  { key: 'BoxQuantityInput', label: '仕分け箱数入力', component: <BoxQuantityInput /> },
  { key: 'SortingCheckScreen', label: '仕分け前商品数確認', component: <SortingCheckScreen /> },  
  { key: 'StoreDoubleCheckList', label: 'ダブルチェック', component: <StoreDoubleCheckList /> },
  // { key: 'C', label: 'C画面', component: <CComponent /> },
];

const App = () => {
  const [view, setView] = useState('ExcelUpload'); // 初期画面の指定
  const [drawerOpen, setDrawerOpen] = useState(false); // サイドバーの開閉状態

  // ✅ 今選択されているページ情報を取得
  const currentPage = pageList.find((p) => p.key === view);

  // サイドバーの開閉を制御する関数
  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex' }}>
      {/* メニューを開くボタン */}
      <IconButton
        color="primary"
        aria-label="open menu"
        onClick={toggleDrawer}
        sx={{
          position: 'fixed',
          top: 10,
          left: 10,
          zIndex: 1300,
          backgroundColor: 'white',
          boxShadow: 1,
          '&:hover': {
            backgroundColor: '#e3f2fd',
          }
        }}
      >
        <MenuIcon />
      </IconButton>

      {/* 折りたたみ可能なサイドバー */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            paddingTop: 2,
          },
        }}
      >


        {/* メニューリスト */}
        <List>
          {pageList.map((page) => (
            <ListItem key={page.key} disablePadding>
              <ListItemButton
                selected={view === page.key}
                onClick={() => {
                  setView(page.key);
                  // スマホなど小さい画面では選択後にメニューを閉じる
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                sx={{
                  borderLeft: view === page.key ? '4px solid #1976d2' : '4px solid transparent',
                  '&:hover': {
                    backgroundColor: '#e3f2fd',
                  }
                }}
              >
                <ListItemText primary={page.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* メインコンテンツ */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {currentPage?.component || <p>ページが見つかりません</p>}
      </Box>
    </Box>
  );
};
export default App;