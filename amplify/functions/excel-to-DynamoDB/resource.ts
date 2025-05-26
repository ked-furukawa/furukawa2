import { defineFunction } from '@aws-amplify/backend';

export const sayHello = defineFunction({
  name: 'excel-to-DynamoDB', // 関数の名前を指定（省略時はディレクトリ名が使われる）
  entry: './handler.ts' // ハンドラのパスを指定（省略時は "./handler.ts" が使われる）
});