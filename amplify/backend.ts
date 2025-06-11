import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { aws_dynamodb, aws_iam } from "aws-cdk-lib";

import { PUTeventTest } from './functions/PUTeventTest/resource';
import { csvToDB } from './functions/csvToDB/resource';

import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

const backend = defineBackend({
	auth,
	data,
	storage,
	PUTeventTest,
	csvToDB
});
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

// S3へのアクセス権
const s3AccessPolicy = new aws_iam.PolicyStatement({
	actions: ["s3:GetObject", "s3:PutObject", "dynamodb:PutObject"],
	resources: [
		backend.storage.resources.bucket.bucketArn, // バケット自体
		`${backend.storage.resources.bucket.bucketArn}/*`, // バケット内のオブジェクト
	],
});
// Lambda関数に環境変数とS3へのアクセス権を設定
const csvToDBFunc = backend.csvToDB.resources.lambda;
csvToDBFunc.addToRolePolicy(s3AccessPolicy);