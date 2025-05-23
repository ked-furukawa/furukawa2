import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";


const client = generateClient<Schema>();

function App() {
  const [orders, setOrders] = useState<Array<Schema["Order"]["type"]>>([]); //テーブルを変更したのでエラーが出ないような暫定対応、todoという変数をorderに変更してます

  useEffect(() => {
    client.models.Order.observeQuery().subscribe({
      next: ({items}) => {
        setOrders([...items]);
        console.log("受信したデータ:", items);
      }
    });
  }, []);

  function createOrder() { 
    // 0〜999の乱数を作って3桁のゼロパディングで文字列にする
    const randomId = Math.floor(Math.random() * 1000);
    const storeId = randomId.toString().padStart(3, '0');  // 例: "007", "123", "045"

    const randomCount = Math.floor(Math.random() * 10) + 1; // 1〜10 の整数
    client.models.Order.create({  //Todoのnewのボタンを押すとこの固定データがDBに書き込まれるようにしています
      storeId:storeId, //storeIdとorderCountを乱数にしてます
      date:'2025-05-22',
      itemId:"Order content",
      orderCount:randomCount
    });
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createOrder}>+ new</button> //orderデータを生成
      <ul>
        {orders.map((order) => ( //データの表示部分
          <li key={order.storeId}>
            storeId: {order.storeId}, itemId: {order.itemId}, count: {order.orderCount}
          </li>
        ))}
      </ul>
      <div>
        🥳 App successfully hosted. Try creating a new todo.
        <br />
        <a href="https://docs.amplify.aws/react/start/quickstart/#make-frontend-updates">
          Review next step of this tutorial.
        </a>
      </div>
    </main>
  );
}

export default App;//test
