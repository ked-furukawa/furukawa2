import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";

import { useNavigate } from 'react-router-dom';
// import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import FinalCheck from "./FinalCheck";
import TestComponent from "./TestComponent.tsx";
import BoxQuantityInput from "./BoxQuantityInput.tsx";
import SortingCheckScreen from "./SortingCheckScreen.tsx";
import StoreDoubleCheckList from "./StoreDoubleCheckList.tsx";
import AdditionalOrderInput from "./AdditionalOrderInput.tsx";
import ExcelUpload from "./ExcelUpload.tsx";
import SpecialSorting from "./SpecialSorting.tsx";
import StartSorting from "./StartSorting.tsx";


import { useParams } from "react-router-dom";

const drawerWidth = 240;

const pageList: {
        key: string;
        label: string;
        component: (props: { navigateTo: (key: string) => void }) => JSX.Element;
    }[] = [
        {
        key: 'StartSorting',
        label: '仕分け作業開始',
        component: (props) => <StartSorting {...props} />,
        },
        {
        key: "Test",
        label: "テスト画面",
        component: () => <TestComponent />,
        },
        {
        key: "ExcelUpload",
        label: "S3テスト用",
        component: () => <ExcelUpload />,
        },
        {
        key: "SortingCheckScreen",
        label: "仕分け前商品数確認",
        component: (props) => <SortingCheckScreen {...props} />,
        },
        {
        key: "BoxQuantityInput",
        label: "仕分け箱数入力",
        component: (props) => <BoxQuantityInput {...props} />,
        },
        {
        key: "StoreDoubleCheckList",
        label: "箱数ダブルチェック",
        component: () => <StoreDoubleCheckList />,
        },
        {
        key: "FinalCheck",
        label: "最終確認",
        component: () => <FinalCheck />,
        },
        {
        key: 'AdditionalOrderInput',
        label: '追加注文',
        component: () => <AdditionalOrderInput />,
        },
        {
        key: 'SpecialSorting',
        label: '仕分け箱数入力(特殊注文用)',
        component: (props) => <SpecialSorting {...props} />,
        },
    ];

const App = () => {
  const navigate = useNavigate();
  const {departmentId}=useParams();

    const initialView = useMemo(() => {//初期表示画面
    if (departmentId === 'office') {
      return 'FinalCheck';
    }
    return 'StartSorting';
  }, [departmentId]);
    const [view, setView] = useState(initialView);
    const [drawerOpen, setDrawerOpen] = useState(false);


    const filteredPages = useMemo(() => {
      // 特定部門に応じた表示許可マップ
      const departmentAccessMap: Record<string, string[]> = {
        office: ['FinalCheck'],
        honsyabuturyu: ['SortingCheckScreen', 'SpecialSorting', 'StartSorting'],
        kakou2: ['SortingCheckScreen', 'SpecialSorting', 'StartSorting'],
        seiniku: ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        kakou1: ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        '1souzai': ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        '2souzai': ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        '3souzai': ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        namashitsu1: ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
        namashitsu2: ['BoxQuantityInput', 'SortingCheckScreen', 'StoreDoubleCheckList', 'StartSorting'],
      };

      // フルアクセス部門
      const fullAccessDepartments = ['kurosawa', 'sakurai', 'furukawa'];

      // 表示許可されているキーを構築
      let allowedKeys: string[] = [];

      if (departmentId && fullAccessDepartments.includes(departmentId)) {
        // フルアクセスならすべて表示（'Test'含む）
        return pageList;
      }

      if (departmentId && departmentAccessMap[departmentId]) {
        allowedKeys = [...departmentAccessMap[departmentId]];
      }

      return pageList.filter(page => allowedKeys.includes(page.key));
    }, [departmentId]);


    const navigateTo = (key: string) => {
      setView(key);
    };

    const currentPage = filteredPages.find((p) => p.key === view);

    const toggleDrawer = () => {
      setDrawerOpen(!drawerOpen);
    };

    const goHome = () => {
      navigate('/');
    };


  return (
        <Box sx={{ minHeight: "100vh", display: "flex" }}>
          <IconButton
            color="primary"
            aria-label="open menu"
            onClick={toggleDrawer}
            sx={{
              position: "fixed",
              top: 20,
              left: 20,
              zIndex: 1300,
              backgroundColor: "white",
              boxShadow: 1,
              "&:hover": {
                backgroundColor: "#e3f2fd",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* サイドバー */}
          <Drawer
            disableScrollLock
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              "& .MuiDrawer-paper": {
                width: drawerWidth,
                boxSizing: "border-box",
                paddingTop: 2,
              },
            }}
          >
            {/* <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', px: 1 }}>
          <IconButton onClick={toggleDrawer}>
            <ChevronLeftIcon />
          </IconButton>
        </Box> */}

            <List sx={{ mt: 6 }}>
              {filteredPages.map((page) => (
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
                      py: 2,
                      pl: 3,
                      borderLeft:
                        view === page.key
                          ? "4px solid #1976d2"
                          : "4px solid transparent",
                      "&:hover": {
                        backgroundColor: "#e3f2fd",
                      },
                    }}
                  >
                    <ListItemText primary={page.label} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Box mt={2}>
                <Button variant="outlined" color="primary" fullWidth onClick={goHome}>
                トップページに戻る
                </Button>
            </Box>
          </Drawer>

          <Box component="main" sx={{ flexGrow: 1 }}>
            {currentPage && currentPage.component({ navigateTo })}
          </Box>
        </Box>
      )
};

export default App;
