import { useEffect, useState } from "react";
import type { Schema } from "../amplify/data/resource";
import { generateClient } from "aws-amplify/data";


const client = generateClient<Schema>();

function App() {
  const [todos, setTodos] = useState<Array<Schema["Order"]["type"]>>([]);

  useEffect(() => {
    client.models.Order.observeQuery().subscribe({
      next: (Order) => setTodos([...Order.items]),
    });
  }, []);

  function createOrder() {
    client.models.Order.create({ 
      storeId:'019',
      date:'2025-05-22',
      itemId:"Order content",
      orderCount:3
    });
  }

  return (
    <main>
      <h1>My todos</h1>
      <button onClick={createOrder}>+ new</button>
      <ul>
        {todos.map((order) => (
          <li key={order.storeId}>{order.storeName}</li>
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
