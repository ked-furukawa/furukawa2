import { defineFunction } from '@aws-amplify/backend';
import { data } from '../../data/resource';
import { storage } from '../../storage/resource';
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export const csvToDB = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'csv-to-db',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',
    // 1 minute timeout
    timeoutSeconds: 180,
});