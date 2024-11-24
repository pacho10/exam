import * as cdk from 'aws-cdk-lib';
import {AttributeType, BillingMode, StreamViewType, Table} from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import {Bucket} from "aws-cdk-lib/aws-s3";

export class ExamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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

    const fileStorage = new Bucket(this, 'fileStorage', {})
  }
}
