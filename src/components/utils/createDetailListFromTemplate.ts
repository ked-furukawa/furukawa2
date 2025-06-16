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
    const sheetE = workbook.getWorksheet("上越訓練センター（手で数入力して下さい）")
    if (!sheetE) {
        throw new Error('上越訓練センター用のシートが見つかりません');
    }

    // シートごとにデータを分割
    const dataA = detailData.filter(item => item.storeTc === '中之島');
    const dataB = detailData.filter(item => item.storeTc === '上越');

    const startRow = 14;//開始行
    const maxRow = 41;
    const maxPerColumn = maxRow - startRow + 1; // 28件ずつで折り返し

    // 折り返し用の列定義（列番号）
    const columnBlocks = [
        { storeId: 'A', storeName: 'B', green: 'D', red: 'F', blue: 'H', orange: 'J' },
        { storeId: 'M', storeName: 'N', green: 'P', red: 'R', blue: 'T', orange: 'V' },
        { storeId: 'Y', storeName: 'Z', green: 'AB', red: 'AD', blue: 'AF', orange: 'AH' },
        // 必要に応じて追加
    ];
    //折り返し用の関数
    function colLetterToNumber(letter: string): number {
    let num = 0;
    for (let i = 0; i < letter.length; i++) {
        num *= 26;
        num += letter.charCodeAt(i) - 64;
    }
    return num;
    }

    // シートAに書き込み
dataA.forEach((item, index) => {
    const columnBlockIndex = Math.floor(index / maxPerColumn);
    const rowInBlock = index % maxPerColumn;
    const currentCols = columnBlocks[columnBlockIndex];

    const row = sheetA.getRow(startRow + rowInBlock);
    row.getCell(colLetterToNumber(currentCols.storeId)).value = item.storeId;
    row.getCell(colLetterToNumber(currentCols.storeName)).value = item.storeName;
    row.getCell(colLetterToNumber(currentCols.green)).value = item.greenBoxes;
    row.getCell(colLetterToNumber(currentCols.red)).value = item.redBoxes;
    row.getCell(colLetterToNumber(currentCols.blue)).value = item.blueBoxes;
    row.getCell(colLetterToNumber(currentCols.orange)).value = item.orangeBoxes;
    row.commit();
    });

    // シートBに書き込み
    dataB.forEach((item, index) => {
        const columnBlockIndex = Math.floor(index / maxPerColumn);
        const rowInBlock = index % maxPerColumn;
        const currentCols = columnBlocks[columnBlockIndex];

        const row = sheetB.getRow(startRow + rowInBlock);
        row.getCell(colLetterToNumber(currentCols.storeId)).value = item.storeId;
        row.getCell(colLetterToNumber(currentCols.storeName)).value = item.storeName;
        row.getCell(colLetterToNumber(currentCols.green)).value = item.greenBoxes;
        row.getCell(colLetterToNumber(currentCols.red)).value = item.redBoxes;
        row.getCell(colLetterToNumber(currentCols.blue)).value = item.blueBoxes;
        row.getCell(colLetterToNumber(currentCols.orange)).value = item.orangeBoxes;
        row.commit();
        const row3 = sheetE.getRow(startRow + rowInBlock);
        row3.getCell(colLetterToNumber(currentCols.storeId)).value = item.storeId;
        row3.getCell(colLetterToNumber(currentCols.storeName)).value = item.storeName;
        row3.commit();
    });
}
