import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, Button } from "@mui/material";
import { generateClient } from "aws-amplify/data";
import type { Schema } from "../amplify/data/resource";

// 店舗集計データの型
interface StoreBoxSummary {
  storeId: string;
  storeName: string;
  storeTc: string;
  greenBoxes: number;
  redBoxes: number;
  blueBoxes: number;
  yellowBoxes: number;
}

export const App = () => {
  const [storeData, setStoreData] = useState<StoreBoxSummary[]>([]);
  const [dataVersion, setDataVersion] = useState<number>(1);
  const boxClient = generateClient<Schema>();

  // 固定のサンプルデータ
    const sampleData1 = [
      {
        storeId: '019',
        storeName: '内野店',
        storeTc: '中之島',
        color: 'green',
        boxCount: 20
      },
      {
        storeId: '019',
        storeName: '内野店',
        storeTc: '中之島',
        color: 'red',
        boxCount: 15
      },
      {
        storeId: '211',
        storeName: '東山店',
        storeTc: '上越',
        color: 'green',
        boxCount: 10
      }
    ];
    const sampleData2 = [
      {
        storeId: '111',
        storeName: '金沢店',
        storeTc: '中之島',
        color: 'green',
        boxCount: 100
      },
      {
        storeId: '112',
        storeName: '仙台店',
        storeTc: '中之島',
        color: 'red',
        boxCount: 15
      },
      {
        storeId: '711',
        storeName: '東山店',
        storeTc: '上越',
        color: 'green',
        boxCount: 10
      }
    ];

  const saveDataToDB = async (data: any[]) => { //DB保存用関数
  try {
    for (const item of data) {
      await boxClient.models.Box.create({
        storeId: item.storeId,
        storeName: item.storeName,
        storeTc: item.storeTc,
        date: new Date().toISOString().split('T')[0], // 今日の日付
        color: item.color,
        boxCount: item.boxCount,
        boxCreatedBy: 'system'
      });
    }
    return true;
  } catch (error) {
    console.error('DB登録エラー:', error);
    return false;
  }
};
// ボタンクリックハンドラーDB保存用
const handleSaveClick = async () => { //保存用関数にsampleData1か2を渡す
  const dataToSave = dataVersion === 1 ? sampleData1 : sampleData2;
  const success = await saveDataToDB(dataToSave);
  
  if (success) {
    // 成功時の処理
    console.log("保存に成功しました")
  }
};

  useEffect(() => {
    
    // データバージョンに基づいてデータを選択
    const dataToUse = dataVersion === 1 ? sampleData1 : sampleData2;
    
    // データ集計処理
    const aggregatedData = aggregateStoreData(dataToUse);
    setStoreData(aggregatedData);
  }, [dataVersion]);

    // ボタンハンドラー
  const handleToggle = () => {
  setDataVersion(prev => prev === 1 ? 2 : 1);
};

  // 店舗データの集計
  const aggregateStoreData = (boxes: any[]) => {
    const storeMap = new Map<string, StoreBoxSummary>();
    
    boxes.forEach(box => {
      if (!storeMap.has(box.storeId)) { 
        storeMap.set(box.storeId, {
          storeId: box.storeId,
          storeName: box.storeName || '',
          storeTc: box.storeTc || '',
          greenBoxes: 0,
          redBoxes: 0,
          blueBoxes: 0,
          yellowBoxes: 0
        });
      }
      
      const store = storeMap.get(box.storeId)!; //colorで分岐して各色の合計を計算
      if (box.color === 'green') {
        store.greenBoxes += box.boxCount;
      } else if (box.color === 'red') {
        store.redBoxes += box.boxCount;
      }else if (box.color === 'blue') {
        store.blueBoxes += box.boxCount;
      }else if (box.color === 'yellow') {
        store.yellowBoxes += box.boxCount;
      }
    });
    
    return Array.from(storeMap.values());
  };

  return (
    <div>
    <Box sx={{ width: '100%', p: 3 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        店舗別箱数一覧
      </Typography>
      
      <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
        <Table stickyHeader aria-label="店舗データテーブル">
          <TableHead>
            <TableRow> //表のヘッダー
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗番号</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>店舗名</TableCell>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>TC</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'success.light', color: 'white' }}>トートーbox</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'error.light', color: 'white' }}>トートーbox</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.light', color: 'white' }}>トートーbox</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'warning.light', color: 'white' }}>トートーbox</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>合計</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {storeData.map((store) => (
              <TableRow key={store.storeId} hover>
                <TableCell>{store.storeId}</TableCell>
                <TableCell>{store.storeName}</TableCell>
                <TableCell>{store.storeTc}</TableCell>
                <TableCell  //店舗IDごとの箱の合計
                  align="right"
                  sx={{ bgcolor: 'success.light', fontWeight: 'medium' }}
                >
                  {store.greenBoxes}
                </TableCell>
                <TableCell 
                  align="right"
                  sx={{ bgcolor: 'error.light', fontWeight: 'medium' }}
                >
                  {store.redBoxes}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ bgcolor: 'primary.light', fontWeight: 'medium' }}
                >
                  {store.blueBoxes}
                </TableCell>
                <TableCell 
                  align="right" 
                  sx={{ bgcolor: 'warning.light', fontWeight: 'medium' }}
                >
                  {store.yellowBoxes}
                </TableCell>
                <TableCell //店舗IDごとの全ての合計
                  align="right"
                  sx={{ fontWeight: 'bold' }}
                >
                  {store.greenBoxes + store.redBoxes + store.blueBoxes + store.yellowBoxes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
    <Box sx={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      padding: 2,
      display: 'flex',
      justifyContent: 'center',
      gap: 2,
      backgroundColor: 'background.paper',
      borderTop: 1,
      borderColor: 'divider',
      zIndex: 1100,
    }}>
      <Button variant="contained" color="primary" onClick={handleSaveClick}> //DB保存用関数を呼び出す
        保存
      </Button>
      <Button variant="contained" color="primary" onClick={handleToggle}> //表示されるデータを切り替え
        切り替え
      </Button>
      <Button variant="outlined" color="secondary">
        キャンセル
      </Button>
    </Box>
    </div>
  );
};


export default App;

// const client = generateClient<Schema>();

// function App() {
//   const [orders, setOrders] = useState<Array<Schema["Order"]["type"]>>([]); //テーブルを変更したのでエラーが出ないような暫定対応、todoという変数をorderに変更してます

//   useEffect(() => {
//     client.models.Order.observeQuery().subscribe({
//       next: ({items}) => {
//         setOrders([...items]);
//         console.log("受信したデータ:", items);
//       }
//     });
//   }, []);

//   function createOrder() { 
//     // 0〜999の乱数を作って3桁のゼロパディングで文字列にする
//     const randomId = Math.floor(Math.random() * 1000);
//     const storeId = randomId.toString().padStart(3, '0');  // 例: "007", "123", "045"

//     const randomCount = Math.floor(Math.random() * 10) + 1; // 1〜10 の整数
//     client.models.Order.create({  //Todoのnewのボタンを押すとこの固定データがDBに書き込まれるようにしています
//       storeId:storeId, //storeIdとorderCountを乱数にしてます
//       date:'2025-05-22',
//       itemId:"Order content",
//       orderCount:randomCount
//     });
//   }

//   return (
//     <main>
//       <h1>My todos</h1>
//       <button onClick={createOrder}>+ new</button> //orderデータを生成
//       <ul>
//         {orders.map((order) => ( //データの表示部分
//           <li key={order.storeId}>
//             storeId: {order.storeId}, itemId: {order.itemId}, count: {order.orderCount}
//           </li>
//         ))}
//       </ul>
//       <div>
//         🥳 App successfully hosted. Try creating a new todo.
//         <br />
//         <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
//           Review next step of this tutorial.
//         </a>
//       </div>
//     </main>
//   );
// }

// export default App;//test
