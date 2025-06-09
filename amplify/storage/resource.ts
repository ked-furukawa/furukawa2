import { defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
    name: "kimura-bucket",

    access: (allow) => ({
        "excel-files/*": [
        allow.authenticated.to(["read", "write"]),
        ],
    }),
});