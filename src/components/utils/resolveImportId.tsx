import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

// 返り値の型定義
type ImportResult = {
    importId: string;
    importProgress: string | null;
    sortingPhase: string | null;
} | null;

export const resolveImportId = async (
    date: string,
    departmentId: string
): Promise<ImportResult> => {
    try {
        const { data } = await client.models.ImportWorkStatus.list({
        filter: {
            date: { eq: date },
            departmentId: { eq: departmentId },
    },
});

    if (!data || data.length === 0) return null;

    // ① IN_PROGRESS があればそれを返す
    const inProgress = data.find((record) => record.importProgress === "IN_PROGRESS");
    if (inProgress) return {
            importId: inProgress.importId,
            importProgress: inProgress.importProgress,
            sortingPhase: inProgress.sortingPhase
        };

    // ② PENDING の中から createdAt の新しい順に並び替え
    // createdAtベースのソートを、importIdベースに変更
    const pendingList = data
        .filter((record) => record.importProgress === "PENDING")
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
        importProgress: "IN_PROGRESS",
    });

    // ④ 他のPENDINGをすべて DONE に更新
    await Promise.all(
        otherPendings.map((record) =>
            client.models.ImportWorkStatus.update({
                date: record.date,
                departmentId: record.departmentId,
                importId: record.importId,
                importProgress: "DONE",
            })
        )
    );

    return {
            importId: latestPending.importId,
            importProgress: latestPending.importProgress,
            sortingPhase: latestPending.sortingPhase
        };


    } catch (error) {
        console.error("importIdの取得・更新中にエラーが発生しました:", error);
        return null;
    }
};
//以下使用例
    // useEffect(() => {
    //     const fetchImportInfo = async () => {
    //         try {
    //             const result = await resolveImportId(date, departmentId);
    //             setImportInfo(result);

    //             if (result) {
    //                 console.log(`インポート情報取得成功: ${result.importId}`);
    //             } else {
    //                 console.log('該当するインポート情報なし');
    //             }
    //         } catch (err) {
    //             setError('インポート情報の取得に失敗しました');
    //             console.error('Error fetching import info:', err);
    //         } finally {
    //             setLoading(false);
    //         }
    //     };

    //     fetchImportInfo();
    // }, [date, departmentId]); // date, departmentIdが変更されたら再実行


