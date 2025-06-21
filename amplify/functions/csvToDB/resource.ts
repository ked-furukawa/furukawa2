import { defineFunction } from '@aws-amplify/backend';

export const csvToDB = defineFunction({
    // optionally specify a name for the Function (defaults to directory name)
    name: 'csv-to-db',
    // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts',
    // 3 minute timeout
    timeoutSeconds: 60,
  // resourceGroupNameを使用して循環依存を解決
    resourceGroupName: 'storage'
});