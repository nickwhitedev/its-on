import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import {Construct} from 'constructs';

export class ItsOnStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table
    const table = new dynamodb.Table(this, 'ItsOnTable', {
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'its-on-table',
    });

    // Create a Lambda function
    const handler = new lambda.Function(this, 'ItsOnFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset('./lambda'),
      handler: 'index.handler',
      environment: {
        TABLE_NAME: table.tableName,
        PRIMARY_KEY: 'itemId',
      },
    });

    // Grant the Lambda function permissions to access the DynamoDB table
    table.grantReadWriteData(handler);

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, 'ItsOnApi', {
      restApiName: 'ItsOn API',
      description: 'API for Its On',
    });

    // Create a resource and method for the API
    const items = api.root.addResource('items');
    items.addMethod('GET', new apigateway.LambdaIntegration(handler));
  }
}
