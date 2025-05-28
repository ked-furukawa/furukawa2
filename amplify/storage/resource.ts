import { defineFunction, defineStorage } from '@aws-amplify/backend';


export const storage = defineStorage({
    name: "kimura-bucket",
        
    triggers: {
        onUpload: defineFunction({
        entry: './on-upload-handler.ts'
        })
    },


    access: (allow) => ({
        "excel-files/*": [
        allow.guest.to(["read", "write"]),
        ],
    }),
});