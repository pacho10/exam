import {DynamoDBClient, PutItemCommand} from "@aws-sdk/client-dynamodb";
import {PublishCommand, SNSClient} from "@aws-sdk/client-sns";
import {v4} from "uuid";

const snsClient = new SNSClient({});
const dynamoClient = new DynamoDBClient({});

export const handler = async (event: any) => {
    const tableName = process.env.TABLE_NAME;
    const topicArn = process.env.TOPIC_ARN;
    const ttl = Math.floor(Date.now() / 1000) + 5 * 60;

    console.log(event.Records[0].s3)

    const allowedFileExtensions = ['jpg', 'pdf', 'png'];
    const fileExtension = event.Records[0].s3.object.key.split('.').pop();
    const size = event.Records[0].s3.object.size;

    console.log('File extension: ' + fileExtension)

    if (allowedFileExtensions.includes(fileExtension)) {
        await dynamoClient.send(new PutItemCommand({
            TableName: tableName,
            Item: {
                id: {
                    S: v4()
                },
                FileExtension: {
                    S: fileExtension
                },
                Size: {
                    N: size.toString()
                },
                UploadDate: {
                    S: new Date(Date.now()).toISOString()
                },
                ttl: {
                    N: ttl.toString()
                }
            }
        }))
    } else {
        await snsClient.send(new PublishCommand({
            TopicArn: topicArn,
            Message: `Invalid file extension: ${fileExtension}`
        }))

        console.log('Notification sent')
    }

    return {
        stausCode: 200,
        body: 'Hi from lambda'
    }
}