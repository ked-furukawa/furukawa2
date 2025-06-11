import type { Handler } from 'aws-lambda';
import { env } from '$amplify/env/csv-to-DB'
import type { Schema } from '../../data/resource';
import { generateClient } from 'aws-amplify/data';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
// import { S3Event } from 'aws-lambda';

import csv from 'csv-parser';

// AWS クライアントの初期化
const s3Client = new S3Client({ region: 'ap-northeast-1' });
const dynamoClient = new DynamoDBClient({ region: 'ap-northeast-1' });

import { alignmentToDepartmentId } from '../../../src/components/utils/alignmentToDepartmentId';

interface Order {//Orderテーブル用型定義
    importId:string;
    date:string;
    storeId:string;
    storeName:string;
    storeTc:string;
    itemId:string;
    itemName:string;
    itemFormalName:string;
    itemCount:number;
    departmentId:string;
    departmentName:string;
}
interface ImportWorkStatus {//ImportWorkStatusテーブル用型定義
    date:string;
    departmentId:string;
    importId:string;
}

export const handler: Handler = async (event, context) => {
try {
    const { s3Key, routeCode, routeName, startDate } = event.arguments;
    console.log("s3Key", s3Key);
    console.log("routeCode", routeCode);
    console.log("routeName", routeName);
    console.log("startDate", startDate);

    //S3からeventファイルを取得
    try {
        const s3Client = new S3Client({ region: env.AWS_REGION || 'ap-northeast-1' });
        // S3からオブジェクトを取得する
        const bucketName = process.env.STORAGE_BUCKET_NAME || "";
        console.log("bucketName", bucketName);
        
        const params = { Bucket: bucketName, Key: s3Key };
        const s3Object = await s3Client.send(new GetObjectCommand(params));
        const csvData = s3Object.Body;
        if (!csvData) {
            throw new Error('ファイルの内容が空です');
        }
        console.log('csvData',csvData)
    
    } catch (err) {
        console.error('ファイル処理エラー:', err);
        throw err;
    }

    // データベースに保存
    try {
        const dbClient = generateClient<Schema>();
        

    const {data: existingData} = await dbClient.models.Order.get({
        importId: "",
        date: "",
        storeId: "",
        itemId: ""
    });
    } catch (err) {
        console.error('DB保存エラー:', err);
        throw err;
    }

    return { success: true, message: "Excel processed successfully." };

    } catch (error) {
    console.error('全体的なエラー:', error);
    return { success: false, message: error instanceof Error ? error.message : String(error) };
    }
};