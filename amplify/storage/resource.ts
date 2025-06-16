import { defineStorage } from '@aws-amplify/backend';
import { csvToDB } from '../functions/csvToDB/resource';

export const storage = defineStorage({
    name: "kimura-bucket",

    access: (allow) => ({
        "excel-files/*": [
            allow.authenticated.to(["read", "write"]),
        ],
        "csv-files/*": [
            allow.resource(csvToDB).to(['delete','read','write'])
        ]
    }),
});