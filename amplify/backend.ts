import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';

import { PUTeventTest } from './functions/PUTeventTest/resource';
import { csvToDB } from './functions/csvToDB/resource';

import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
	auth,
	data,
	storage,
	PUTeventTest,
	csvToDB
});

// S3バケットへのアクセス権限ポリシー
const s3AccessPolicy = new PolicyStatement({
	actions: ["s3:GetObject", "s3:PutObject", "s3:ListBucket"],
	resources: [
		backend.storage.resources.bucket.bucketArn, // バケット自体
		`${backend.storage.resources.bucket.bucketArn}/*`, // バケット内のオブジェクト
	],
});

// DynamoDBへのアクセス権限ポリシーを追加
const dynamoDBAccessPolicy = new PolicyStatement({
	actions: [
		"dynamodb:PutItem",
		"dynamodb:GetItem",
		"dynamodb:UpdateItem",
		"dynamodb:DeleteItem",
		"dynamodb:Query",
		"dynamodb:Scan",
		"dynamodb:BatchWriteItem",
		"dynamodb:Put"
	],
	resources: [
		backend.data.resources.tables["Order"].tableArn,
		`${backend.data.resources.tables["Order"].tableArn}/index/*`,
		backend.data.resources.tables["ImportWorkStatus"].tableArn,
		`${backend.data.resources.tables["ImportWorkStatus"].tableArn}/index/*`
	],
});

// CDK後処理で循環依存を回避
backend.addOutput({
	custom: {
		bucketName: backend.storage.resources.bucket.bucketName,
	},
});

// Lambda実行ロールに両方のポリシーを追加
backend.csvToDB.resources.lambda.addToRolePolicy(s3AccessPolicy);
backend.csvToDB.resources.lambda.addToRolePolicy(dynamoDBAccessPolicy);

//S3のバケット名を環境変数に追加
backend.csvToDB.addEnvironment("STORAGE_BUCKET_NAME", backend.storage.resources.bucket.bucketName);

// Lambda関数にDynamoDBテーブル名を環境変数として追加
backend.csvToDB.addEnvironment(
	'AMPLIFY_DATA_ORDER_TABLE_NAME',
	backend.data.resources.tables["Order"].tableName,
);
backend.csvToDB.addEnvironment(
	'AMPLIFY_DATA_IMPORTWORKSTATUS_TABLE_NAME',
	backend.data.resources.tables["ImportWorkStatus"].tableName,
);

//PUTeventTest用のイベント設定
backend.storage.resources.bucket.addEventNotification(
	EventType.OBJECT_CREATED_PUT,
	new LambdaDestination(backend.PUTeventTest.resources.lambda),
	{
		prefix:'excel-files/'
	}
);
//csvToDB用のイベント設定
backend.storage.resources.bucket.addEventNotification(
	EventType.OBJECT_CREATED_PUT,
	new LambdaDestination(backend.csvToDB.resources.lambda),
	{
		prefix:'csv-files/',
		suffix:'.csv'
	}
);