import { generateClient } from "aws-amplify/data";
import type { Schema } from "../../../amplify/data/resource";

const client = generateClient<Schema>();

export const checkPendingImportId = async (
    date: string,
    departmentId: string
): Promise<boolean> => {
    try {
        const { data } = await client.models.ImportWorkStatus.list({
            filter: {
                date: { eq: date },
                departmentId: { eq: departmentId },
                importProgress: { eq: "PENDING" }
            },
        });

        return data && data.length > 0;
    } catch (error) {
        console.error("PENDING状態のImportIdチェック中にエラーが発生しました:", error);
        return false;
    }
}; 