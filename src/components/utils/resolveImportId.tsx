import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();


export const resolveImportId = async (
    date: string,
    departmentId: string
): Promise<string | null> => {
    try {
        const { data } = await client.models.ImportWorkStatus.list({
        filter: {
            date: { eq: date },
            departmentId: { eq: departmentId },
    },
});

    if (!data || data.length === 0) return null;

    // ① IN_PROGRESS があればそれを返す
    const inProgress = data.find((record) => record.status === "IN_PROGRESS");
    if (inProgress) return inProgress.importId;

    // ② PENDING の中から createdAt の新しい順に並び替え
    const pendingList = data
        .filter((record) => record.status === "PENDING")
        .sort(
            (a, b) =>
            new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
        );

    return pendingList.length > 0 ? pendingList[0].importId : null;
    } catch (error) {
    console.error("importIdの取得中にエラーが発生しました:", error);
    return null;
    }
};
//以下使用例

// import { useEffect, useState } from "react";
// import { getLatestImportId } from "@/utils/getLatestImportId";

// const ExampleComponent = () => {
//   const [importId, setImportId] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchImportId = async () => {
//       const id = await getLatestImportId("20250609", "souzai2");
//       setImportId(id);
//     };

//     fetchImportId();
//   }, []);

//   return <div>importId: {importId ?? "取得できませんでした"}</div>;
// };

