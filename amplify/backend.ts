import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { PUTeventTest } from './functions/PUTeventTest/resource';

import { EventType } from 'aws-cdk-lib/aws-s3';
import { LambdaDestination } from 'aws-cdk-lib/aws-s3-notifications';

const backend = defineBackend({
	auth,
	data,
	storage,
	PUTeventTest
});

backend.storage.resources.bucket.addEventNotification(
	EventType.OBJECT_CREATED_PUT,
	new LambdaDestination(backend.PUTeventTest.resources.lambda),
);
