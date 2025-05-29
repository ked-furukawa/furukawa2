import { defineBackend } from '@aws-amplify/backend';
import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { excelToDB } from './functions/excelToDB/resource';

defineBackend({
  auth,
  data,
  storage,
  excelToDB
});
