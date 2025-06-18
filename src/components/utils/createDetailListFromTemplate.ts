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

export function createDetailListFromTemplate(workbook:ExcelJS.Workbook, detailData:DetailData[], tabValue:number) {
    console.log(workbook.worksheets)
    // suffix を tabValue でマッピング
    const suffixMap: Record<number, string> = {
        0: "センター",
        1: "",
        2: "第2",
    };

    const suffix = suffixMap[tabValue];
    if (!suffix) {
        throw new Error(`未対応の tabValue: ${tabValue}`);
    }

    // 各シート名を構築
    const sheetNames = {
        A: `中之島①${suffix}`,
        B: `上越①${suffix}`,
        E: tabValue === 0
        ? "上越訓練センター（手で数入力して下さい）"
        : "上越訓練センター",
    };
    
    const sheetA = workbook.getWorksheet(sheetNames.A);
    if (!sheetA) {
        throw new Error(`シートが見つかりません: ${sheetNames.A}`);
    }

    const sheetB = workbook.getWorksheet(sheetNames.B);
    if (!sheetB) {
        throw new Error(`シートが見つかりません: ${sheetNames.B}`);
    }
    const sheetE = workbook.getWorksheet(sheetNames.E);
    if (!sheetE) {
        throw new Error(`シートが見つかりません: ${sheetNames.E}`);
    }

    // シートごとにデータを分割
    // 中之島のデータを並び替え
    const nakanoshimaMain = detailData
    .filter(item => item.storeTc === '中之島' && item.storeId !== '089' && item.storeId !== '057')
    .sort((a, b) => Number(a.storeId) - Number(b.storeId));

    const nakanoshima89 = detailData
    .filter(item => item.storeTc === '中之島' && item.storeId === '089');

    const nakanoshima057 = detailData
    .filter(item => item.storeTc === '中之島' && item.storeId === '057');

    const dataA = [...nakanoshimaMain, ...nakanoshima89, ...nakanoshima057];

    // 上越のデータはそのまま昇順ソート
    const dataB = detailData
    .filter(item => item.storeTc === '上越')
    .sort((a, b) => Number(a.storeId) - Number(b.storeId));

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
