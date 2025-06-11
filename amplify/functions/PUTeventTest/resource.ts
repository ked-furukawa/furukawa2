import { defineFunction } from '@aws-amplify/backend';

export const PUTeventTest = defineFunction({
  // optionally specify a name for the Function (defaults to directory name)
    name: 'PUTevent-test',
  // optionally specify a path to your handler (defaults to "./handler.ts")
    entry: './handler.ts'
});