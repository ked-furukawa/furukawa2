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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

// 各画面のimport
import FinalCheck from "./pages/FinalCheck";
import TestComponent from "./pages/TestComponent.tsx";
import BoxQuantityInput from "./pages/BoxQuantityInput.tsx";
import SortingCheckScreen from "./pages/SortingCheckScreen.tsx";
import StoreDoubleCheckList from "./pages/StoreDoubleCheckList.tsx";
// import ExcelUpload from "./pages/ExcelUpload.tsx";

const drawerWidth = 240;

const pageList = [//- key:stateで使う識別子 - component: 実際に表示する React コンポーネント
  // { key: 'ExcelUpload', label: 'エクセルアップロード', component: <ExcelUpload /> },
  { key: 'FinalCheck', label: '最終確認', component: <FinalCheck /> },
  { key: 'BoxQuantityInput', label: '仕分け箱数入力', component: <BoxQuantityInput /> },
  { key: 'SortingCheckScreen', label: '仕分け前商品数確認', component: <SortingCheckScreen /> },
  { key: 'StoreDoubleCheckList', label: 'ダブルチェック', component: <StoreDoubleCheckList /> },
  { key: 'Test', label: 'テスト画面', component: <TestComponent /> },
  
  // { key: 'C', label: 'C画面', component: <CComponent /> },
];

const App = () => {
  const [view, setView] = useState('FinalCheck'); // 初期画面の指定
  const [drawerOpen, setDrawerOpen] = useState(false); // サイドバーの開閉状態

  const currentPage = pageList.find((p) => p.key === view);

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
          top: 20,      // 被り防止でスペース増加
          left: 20,     // 被り防止でスペース増加
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

      {/* サイドバー */}
      <Drawer disableScrollLock
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            paddingTop: 2,
          },
        }}
      >
        {/* サイドバー上部の戻るボタン */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1 }}>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        {/* メニューリスト */}
        <List>
          {pageList.map((page) => (
            <ListItem key={page.key} disablePadding>
              <ListItemButton
                selected={view === page.key}
                onClick={() => {
                  setView(page.key);
                  if (window.innerWidth < 600) {
                    setDrawerOpen(false);
                  }
                }}
                sx={{
                  py: 2, // 上下パディング 2 = 16px
                  pl: 3, // 左パディング 3 = 24px
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
