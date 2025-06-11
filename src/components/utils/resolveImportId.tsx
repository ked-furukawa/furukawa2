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
    // createdAtベースのソートを、importIdベースに変更
    const pendingList = data
        .filter((record) => record.status === "PENDING")
        .sort(
            (a, b) =>
                b.importId.localeCompare(a.importId) // 文字列として降順（新しい順）
        );


    if (pendingList.length === 0) return null;

    const latestPending = pendingList[0]; //最新のもの
    const otherPendings = pendingList.slice(1); // 残り

    // ③ 最新のものを IN_PROGRESS に更新
    await client.models.ImportWorkStatus.update({
        date: latestPending.date,
        departmentId: latestPending.departmentId,
        importId: latestPending.importId,
        status: "IN_PROGRESS",
    });

    // ④ 他のPENDINGをすべて DONE に更新
    await Promise.all(
        otherPendings.map((record) =>
            client.models.ImportWorkStatus.update({
                date: record.date,
                departmentId: record.departmentId,
                importId: record.importId,
                status: "DONE",
            })
        )
    );

    return latestPending.importId;

    } catch (error) {
        console.error("importIdの取得・更新中にエラーが発生しました:", error);
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

