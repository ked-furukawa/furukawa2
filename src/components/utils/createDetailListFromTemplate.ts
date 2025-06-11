import ExcelJS from 'exceljs';

interface DetailData {
    date: string,
    storeId: string;
    storeName: string;
    storeTc: string;
    greenBoxes: number;
    redBoxes: number;
    blueBoxes: number;
    yellowBoxes: number;
}

export function createDetailListFromTemplate(workbook:ExcelJS.Workbook, detailData:DetailData[]) {
    console.log(workbook.worksheets)
    
    // 取引先によって書き込むシートを切り替え（例: 'A社'なら1枚目、'B社'なら2枚目）
    const sheetA = workbook.getWorksheet("中之島①センター");
    if (!sheetA) {
        throw new Error('中之島用のシートが見つかりません');
    }
    const sheetB = workbook.getWorksheet("上越①センター");
    if (!sheetB) {
        throw new Error('上越用のシートが見つかりません');
    }

    // シートごとにデータを分割
    const dataA = detailData.filter(item => item.storeTc === '中之島');
    const dataB = detailData.filter(item => item.storeTc === '上越');

    const startRow = 14;//開始行

    // シートAに書き込み
    dataA.forEach((item, i) => {
        const row = sheetA.getRow(startRow + i);
        row.getCell('A').value = item.storeId;
        row.getCell('B').value = item.storeName;
        row.getCell('D').value = item.greenBoxes;
        row.getCell('F').value = item.redBoxes;
        row.getCell('H').value = item.blueBoxes;
        row.getCell('J').value = item.yellowBoxes;
        row.commit();
    });

    // シートBに書き込み
    dataB.forEach((item, i) => {
        const row = sheetB.getRow(startRow + i);
        row.getCell('A').value = item.storeId;
        row.getCell('B').value = item.storeName;
        row.getCell('D').value = item.greenBoxes;
        row.getCell('F').value = item.redBoxes;
        row.getCell('H').value = item.blueBoxes;
        row.getCell('J').value = item.yellowBoxes;
        row.commit();
    });
}
