import { useMemo, useState } from "react";
import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
// import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';

import FinalCheck from "./FinalCheck";
import TestComponent from "./TestComponent.tsx";
import BoxQuantityInput from "./BoxQuantityInput.tsx";
import SortingCheckScreen from "./SortingCheckScreen.tsx";
import StoreDoubleCheckList from "./StoreDoubleCheckList.tsx";
import AdditionalOrderInput from "./AdditionalOrderInput.tsx";
import ExcelUpload from "./ExcelUpload.tsx";


import { useParams } from "react-router-dom";

const drawerWidth = 240;

const pageList: {
        key: string;
        label: string;
        component: (props: { navigateTo: (key: string) => void }) => JSX.Element;
    }[] = [
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
        label: "ダブルチェック",
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
    ];

const App = () => {
    const {departmentId}=useParams();
    const initialView = departmentId === 'office' ? 'FinalCheck' : 'SortingCheckScreen'; 
    const [view, setView] = useState(initialView);
    const [drawerOpen, setDrawerOpen] = useState(false);


    const filteredPages = useMemo(() => {
        if (departmentId === 'office') {
        return pageList.filter(p => ['Test', 'FinalCheck', 'AdditionalOrderInput'].includes(p.key));
        }
        return pageList.filter(p => p.key !== 'FinalCheck'|| 'AdditionalOrderInput');
    }, [departmentId]);

  const navigateTo = (key: string) => {
    setView(key);
  };

  const currentPage = filteredPages.find((p) => p.key === view);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
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
            
          </Drawer>

          <Box component="main" sx={{ flexGrow: 1 }}>
            {currentPage && currentPage.component({ navigateTo })}
          </Box>
        </Box>
      )
};

export default App;
