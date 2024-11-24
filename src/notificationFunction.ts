import {PublishCommand, SNSClient} from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});

export const handler = async (event: any) => {
    const topicArn = process.env.TOPIC_ARN;

    console.log(event)

    await snsClient.send(new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify({
            "fileExtension": "jpg",
            "size": 1024,
            "uploadDate": new Date(Date.now()).toISOString()
        })
    }))

    console.log('Notification sent')

    return {
        stausCode: 200,
        body: 'Hi from lambda'
    }
}