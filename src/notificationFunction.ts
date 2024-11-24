import {PublishCommand, SNSClient} from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});

export const handler = async (event: any) => {
    const topicArn = process.env.TOPIC_ARN;

    console.log(event.Records[0].dynamodb)
    const fileExtension = event.Records[0].dynamodb.NewImage.FileExtension.S;
    const size = event.Records[0].dynamodb.NewImage.Size.N;
    const uploadDate = event.Records[0].dynamodb.NewImage.UploadDate.S;

    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
            "fileExtension": fileExtension,
            "size": size,
            "uploadDate": uploadDate
        })
    }))

    console.log('Notification sent')

    return {
        stausCode: 200,
        body: 'Hi from lambda'
    }
}