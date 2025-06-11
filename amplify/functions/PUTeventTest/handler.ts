import type { Handler } from 'aws-lambda';
import { alignmentToDepartmentId } from '../../../src/components/utils/alignmentToDepartmentId';

export const handler: Handler = async (event, context) => {
  // your function code goes here
    const objectKeys = event.Records.map((record:any) => record.s3.object.key);
    console.log(`あいうえお-Upload handler invoked for objects [${objectKeys.join(', ')}]`);
    const result=alignmentToDepartmentId(6084);
    console.log("result",result);
};