import { OrderData } from "../../types";


export const groupOrdersByTcAndStore = (
  orders: OrderData[]
): { [storeTc: string]: { [storeId: string]: OrderData[] } } => {
  const result: { [storeTc: string]: { [storeId: string]: OrderData[] } } = {};

  for (const order of orders) {
    const { storeTc, storeId } = order;

    // storeTcが未登録なら初期化
    if (!result[storeTc]) {
      result[storeTc] = {};
    }

    // storeIdが未登録なら初期化
    if (!result[storeTc][storeId]) {
      result[storeTc][storeId] = [];
    }

    // 該当storeIdにOrderを追加
    result[storeTc][storeId].push(order);
  }

  return result;
};

