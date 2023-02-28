import * as cdk from 'aws-cdk-lib';
import { App, Stack, StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';


export class ItsOnStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create a DynamoDB table
    const table = new dynamodb.Table(this, 'ItsOnTable', {
      partitionKey: { name: 'itemId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      tableName: 'its-on-table',
    });

    // Create a Lambda function
    const handler = new lambda.Function(this, 'ItsOnFunction', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('lambda'),
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
    const items = api.root.addResource('items'); // update me
    const getItemIntegration = new apigateway.LambdaIntegration(handler);
    items.addMethod('GET', getItemIntegration); // update me

    // Output the API endpoint URL
    new cdk.CfnOutput(this, 'ItsOnApiUrl', {
      value: api.url,
    });
  }
}
