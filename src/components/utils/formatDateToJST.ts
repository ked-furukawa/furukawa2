export function formatDateToJST(date: Date): string {
    // JST に変換
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);

    const year = jstDate.getUTCFullYear();
    const month = String(jstDate.getUTCMonth() + 1).padStart(2, '0');
    const day = String(jstDate.getUTCDate()).padStart(2, '0');

    return `${year}${month}${day}`; // 例: '20250606'
}
