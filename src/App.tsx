import { useState } from "react";
import { Button, Box } from '@mui/material';

//各画面のimport
import FinalCheck from "./pages/FinalCheck"
import Test from "./pages/TestComponent.tsx"
import BoxQuantityInput from "./pages/BoxQuantityInput.tsx";
import SortingCheckScreen from "./pages/SortingCheckScreen.tsx"
import ProductDetailScreen from "./pages/ProductDetailScreen.tsx";
import ExcelUpload  from "./pages/Excelupload.tsx";

const pageList = [//- key:stateで使う識別子 - component: 実際に表示する React コンポーネント
  { key: 'ExcelUpload', label: 'エクセルアップロード', component: <ExcelUpload /> },
  { key: 'FinalCheck', label: '最終確認', component: <FinalCheck /> },
  { key: 'Test', label: 'テスト画面', component: <Test /> },
  { key: 'BoxQuantityInput', label: '仕分け箱数入力', component: <BoxQuantityInput /> },
  { key: 'SortingCheckScreen', label: '仕分け前商品数確認', component: <SortingCheckScreen /> },  
  { key: 'ProductDetailScreen', label: '商品詳細', component: <ProductDetailScreen /> },  
  // { key: 'C', label: 'C画面', component: <CComponent /> },
];

const App = () => {
  const [view, setView] = useState('FinalCheck'); // 初期画面の指定

  // ✅ 今選択されているページ情報を取得
  const currentPage = pageList.find((p) => p.key === view);

  return (
    <Box sx={{ minHeight: '100vh' }}>
    <div>
      {/* 🔸 ページ切り替えボタンを自動生成 */}
      <nav>
        <Box sx={{ position: 'fixed', top: 10, left: 10, zIndex:1300 }}>
        {pageList.map((page) => (
          <Button
          sx={{border: '2px solid #1976d2', //切り替えボタンのスタイル設定
                borderRadius: '4px',
                color: '#1976d2',
                backgroundColor: 'transparent', 
                '&:hover': { // ホバー時の設定
                  backgroundColor: '#e3f2fd',
                  borderColor: '#115293',
          }}}
            key={page.key}
            // 🔁 押されたボタンの key を state にセット
            onClick={() => setView(page.key)} 
          >
            {page.label}
          </Button>
        ))}
        </Box>
      </nav>

      {/* 🔸 現在のページのコンポーネントを表示 */}
      <main>
        {currentPage?.component || <p>ページが見つかりません</p>}
      </main>
    </div>
    </Box>
  );

};

export default App;

