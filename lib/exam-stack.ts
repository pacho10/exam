import * as cdk from 'aws-cdk-lib';
import {AttributeType, BillingMode, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import {Construct} from 'constructs';
import {Bucket, EventType} from "aws-cdk-lib/aws-s3";
import {Subscription, SubscriptionProtocol, Topic} from "aws-cdk-lib/aws-sns";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";
import {Architecture, FilterCriteria, FilterRule, Runtime, StartingPosition} from "aws-cdk-lib/aws-lambda";
import {LambdaDestination} from "aws-cdk-lib/aws-s3-notifications";
import {DynamoEventSource} from "aws-cdk-lib/aws-lambda-event-sources";

export class ExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const notificationTopic = new Topic(this, "notificationTopic", {
      topicName: 'notificationTopic'
    })

    new Subscription(this, 'notificationSubscription', {
      topic: notificationTopic,
      protocol: SubscriptionProtocol.EMAIL,
      endpoint: 'pmpetkov1983@gmail.com'
    })

    const metadataTable = new Table(this, 'metadataTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      sortKey: {
        name: 'FileExtension',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      timeToLiveAttribute: 'ttl'
    })

    const fileStorage = new Bucket(this, 'fileStorage', {
    })

    const processFunction = new NodejsFunction(this, 'processFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: `${__dirname}/../src/processFunction.ts`,
      architecture: Architecture.ARM_64,
      environment: {
        TABLE_NAME: metadataTable.tableName,
        EMAIL_ADDRESS: 'hristo.zhelev@yahoo.com',
        TOPIC_ARN: notificationTopic.topicArn
      }
    })

    fileStorage.grantRead(processFunction);
    fileStorage.addEventNotification(EventType.OBJECT_CREATED, new LambdaDestination(processFunction))

    metadataTable.grantReadWriteData(processFunction)
    notificationTopic.grantPublish(processFunction)

    const dbNotificationFunction = new NodejsFunction(this, 'dbNotificationFunction', {
      runtime: Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: `${__dirname}/../src/notificationFunction.ts`,
      architecture: Architecture.ARM_64,
      environment: {
        TOPIC_ARN: notificationTopic.topicArn
      }
    })

    dbNotificationFunction.addEventSource(new DynamoEventSource(metadataTable, {
      startingPosition: StartingPosition.LATEST,
      filters: [
        FilterCriteria.filter({
          eventName: FilterRule.isEqual('INSERT')
        })
      ]
    }))

    notificationTopic.grantPublish(dbNotificationFunction)
    metadataTable.grantReadWriteData(dbNotificationFunction)
  }
}
