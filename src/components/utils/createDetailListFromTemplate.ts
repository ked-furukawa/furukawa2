import ExcelJS from 'exceljs';

interface DetailData {
    date: string,
    storeId: string;
    storeName: string;
    storeTc: string;
    greenBoxes: number;
    redBoxes: number;
    blueBoxes: number;
    orangeBoxes: number;
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
    const sheetC = workbook.getWorksheet("中之島青果①センター")
    if (!sheetC) {
        throw new Error('中之島青果用のシートが見つかりません');
    }
    const sheetD = workbook.getWorksheet("上越青果①センター")
    if (!sheetD) {
        throw new Error('上越青果用のシートが見つかりません');
    }
    const sheetE = workbook.getWorksheet("上越訓練センター（手で数入力して下さい）")
    if (!sheetE) {
        throw new Error('上越訓練センター用のシートが見つかりません');
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
        row.getCell('J').value = item.orangeBoxes;
        row.commit();
        const row2 = sheetC.getRow(startRow + i);
        row2.getCell('A').value = item.storeId;
        row2.getCell('B').value = item.storeName;
        row2.getCell('E').value = 0;
        row2.commit();
    });

    // シートBに書き込み
    dataB.forEach((item, i) => {
        const row = sheetB.getRow(startRow + i);
        row.getCell('A').value = item.storeId;
        row.getCell('B').value = item.storeName;
        row.getCell('D').value = item.greenBoxes;
        row.getCell('F').value = item.redBoxes;
        row.getCell('H').value = item.blueBoxes;
        row.getCell('J').value = item.orangeBoxes;
        row.commit();
        const row2 = sheetD.getRow(startRow + i);
        row2.getCell('A').value = item.storeId;
        row2.getCell('B').value = item.storeName;
        row2.getCell('E').value = 0;
        row2.commit();
        const row3 = sheetD.getRow(startRow + i);
        row3.getCell('A').value = item.storeId;
        row3.getCell('B').value = item.storeName;
        row3.commit();
    });
}
