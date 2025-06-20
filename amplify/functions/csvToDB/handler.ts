import type { Handler } from 'aws-lambda';
// import { env } from '$amplify/env/csv-to-DB'

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

import csv from 'csvtojson';
import { Readable } from 'stream';

// AWS クライアントの初期化
const dynamodbClient = new DynamoDBClient({region: 'ap-northeast-1',});
// ここで、↑で初期化したDynamoDBClientを用いてDynamoDBDocumentClientを初期化
const docClient = DynamoDBDocumentClient.from(dynamodbClient);

import { alignmentToDepartmentId } from './utils/alignmentToDepartmentId';
import { formatDateToJST } from './utils/formatDateToJST'


const columnMapping: { [csvKey: string] : string} = {
    '商品ＣＤ':'itemId',
    '商品名漢字':'itemFormalName',
    '商品呼称':'itemName',
    '発注数':'itemCount',
    '店名漢字':'storeName',
    '店ＣＤ':'storeId'
}


// S3オブジェクトのBody（ReadableStream）→ 文字列に変換
async function streamToString(stream: Readable): Promise<string> {
    const chunks: Uint8Array[] = [];
    for await (const chunk of stream) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks).toString('utf-8');
}

const date = formatDateToJST(new Date);
const importId = getFormattedTimestamp();

const REGION = process.env.AWS_REGION || 'ap-northeast-1';
const TABLES = {
    order: process.env.AMPLIFY_DATA_ORDER_TABLE_NAME || 'Order',
    importWorkStatus: process.env.AMPLIFY_DATA_IMPORTWORKSTATUS_TABLE_NAME || 'ImportWorkStatus'
};

// マッピング変換
function mapCsvToDynamoItem(csvRow: { [key: string]: string }): Record<string, any> {
    const item: Record<string, any> = {};

    // 必要なCSVの列だけをマッピング（無駄な列は無視）
    for (const [csvKey, dynamoKey] of Object.entries(columnMapping)) {
        if (csvKey === '発注数') {
            const value = Number(csvRow[csvKey]);
            item[dynamoKey] = isNaN(value) ? 0 : value;
        } else if (csvKey === '店ＣＤ') {
            const originalStoreId = csvRow['店ＣＤ']; //3桁になるように0埋め
            const paddedStoreId = originalStoreId.padStart(3, '0');
            item[dynamoKey] = paddedStoreId;
        } else {
            item[dynamoKey] = csvRow[csvKey];
        }
    }

    // CSVに存在しない項目をここで追加
    item.importId = importId;
    item.date = date;
    item.__typename = 'Order';
    item.status = 'PENDING';
    item.createdAt = new Date().toISOString();
    item.updatedAt = item.createdAt;

    const tcType = csvRow['納品先'];

    if (tcType === '071') {
        item.storeTc = '中之島'
    } else if (tcType === '271') {
        item.storeTc = '上越';
    }

    const deptType = csvRow['並び順'];
    item.departmentId = alignmentToDepartmentId(Number(deptType));

    //  テーブル定義に合わせた“複合キー”をここで生成
    item['date#storeId#itemId'] = `${item.date}#${item.storeId}#${item.itemId}`;
    item['departmentId#importId'] = `${item.departmentId}#${item.importId}`;
    item['storeId#itemId'] = `${item.storeId}#${item.itemId}`;

    return item;
}

function getFormattedTimestamp(): string {//importId作成用
    const utc = new Date();
    // JSTの時差（UTC+9時間）をミリ秒で加算
    const now = new Date(utc.getTime() + 9 * 60 * 60 * 1000);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月は0始まりなので+1
    const day = String(now.getDate()).padStart(2, '0');

    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}${month}${day}_${hours}${minutes}${seconds}`;//YYYYMMDD_hhmmss形式
}

export const handler: Handler = async (event) => {

try {
    // S3イベントからバケット名とオブジェクトキーを取得
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    console.log(`Processing image from bucket: ${bucket}, key: ${key}`);

    //S3からeventファイルを取得
        const s3Client = new S3Client(REGION);
        
        const params = { Bucket: bucket, Key: key };
        const s3Object = await s3Client.send(new GetObjectCommand(params));
        const csvData = s3Object.Body;
        if (!csvData) {
            throw new Error('ファイルの内容が空です');
        }
        // console.log('csvData',csvData)

        // CSVデータを文字列に変換
        const csvText = await streamToString(s3Object.Body as Readable);
        const cleanedCsvText = csvText.replace(/^\uFEFF/, ''); // 先頭のBOM削除
        console.log('CSV Text (first 300 chars):', csvText.slice(0, 300));
        if (!csvText.trim()) {
            throw new Error('CSVデータが空です');
        } // 動作確認用一部だけ表示

        // JSONへ変換
        let jsonArray;
        try {
            jsonArray = await csv({ ignoreEmpty: true,checkType: false,trim: true }).fromString(cleanedCsvText);
        } catch (parseErr) {
            console.error('CSV to JSON 変換失敗:', parseErr);
            throw new Error('CSVパース失敗');
        }
        if (!Array.isArray(jsonArray)) {
        throw new Error('CSVのパース結果が配列ではありません');
        }
        console.log('jsonArray:', jsonArray);
        console.log('typeof jsonArray:', typeof jsonArray);
        console.log('isArray:', Array.isArray(jsonArray));

        try {
            console.log('tablename',TABLES.order)
            const departmentIdSet = new Set<string>();
            for (const [index,row] of jsonArray.entries()) {//Order登録
                const storeId = row['店ＣＤ'];
                // 店ＣＤが空ならスキップ
                if (!storeId || storeId.trim() === '') {
                    console.warn(`Skipping row ${index + 1} due to missing 店ＣＤ:`, row);
                    continue;
                }

                const item = mapCsvToDynamoItem(row);
                departmentIdSet.add(item.departmentId);
                // console.log(`Processing item ${index + 1}:`, JSON.stringify(item));

                const params = {
                    TableName: TABLES.order,
                    Item: item
                };
                const command = new PutCommand(params);

                await docClient.send(command);
            }
            for (const departmentId of departmentIdSet) {//ImportWorkStatus登録
            console.log('Processing for importId:', importId);
                const item: Record<string, any> = {};
                    item.importId = importId;
                    item.date = date;
                    item.__typename = 'ImportWorkStatus';
                    item.createdAt = new Date().toISOString();
                    item.updatedAt = item.createdAt;
                    item.departmentId = departmentId;
                    item.importProgress = 'PENDING';
                    item.sortingPhase = 'PENDING';
                item['departmentId#importId'] = `${item.departmentId}#${item.importId}`

                const params = {
                    TableName: TABLES.importWorkStatus,
                    Item: item
                }
                const command = new PutCommand(params);
                await docClient.send(command);
            
            };
        } catch (err) {
            console.error('DynamoDB write error:', err); // エラーの中身を記録
            return {
                statusCode: 500,
                body: JSON.stringify({
                    message: 'some error happened',
                }),
            };
            }

    return { success: true, message: "csvTojsonTodynamo processed successfully." };

    } catch (error) {
    console.error('全体的なエラー:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
};