import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../amplify/data/resource";

const client = generateClient<Schema>();

type CompleteState = '未完了' | '中之島完了' | '作業完了';

type DataWithStoreTc = {
    storeTc?: string | null;
    [key: string]: any;
};

export const filterByCompleteFlag = async (
    date: string,
    departmentId: string,
    data: DataWithStoreTc[]
): Promise<DataWithStoreTc[]> => {
  try {
    const result = await client.models.CompleteFlag.get({ date, departmentId });
    const completeState = result?.data?.completeState as CompleteState;

    let filtered = data;

    switch (completeState) {
      case "中之島完了":
      filtered = data.filter((item) => item.storeTc !== "中之島");
      break;
      case "作業完了":
      filtered = data.filter((item) => item.storeTc === "中之島");
      break;
      case "未完了":
      default:
        filtered = data;
        break;
    }
        // 並び替え：中之島 → その他、storeId 昇順
    const sorted = filtered.slice().sort((a, b) => {
      const isA_Nakanoshima = a.storeTc === "中之島";
      const isB_Nakanoshima = b.storeTc === "中之島";

      if (isA_Nakanoshima && !isB_Nakanoshima) return -1;
      if (!isA_Nakanoshima && isB_Nakanoshima) return 1;

      // storeId が存在する場合のみ昇順比較（null や undefined を考慮）
      return (a.storeId ?? "").localeCompare(b.storeId ?? "");
    });

    return sorted;
  } catch (err) {
    console.error("CompleteFlag fetch error:", err);
    return [];
  }
};
