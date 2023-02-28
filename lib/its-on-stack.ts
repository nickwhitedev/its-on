import * as cdk from 'aws-cdk-lib';
import { Stack, StackProps } from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {Construct} from 'constructs';

export class ItsOnStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
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
    const items = api.root.addResource('items')
    items.addMethod('GET', new apigateway.LambdaIntegration(handler));

    // Define your CodePipeline

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'ItsOnPipeline', {
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipelineActions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'nickpale',
              repo: 'its-on',
              oauthToken: secretsmanager.Secret.fromSecretNameV2(this, 'ItsOnGitHubSecret', 'ItsOnGitHubSecret').secretValue,
              output: sourceOutput,
              branch: 'main',
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipelineActions.CodeBuildAction({
              actionName: 'Build',
              input: sourceOutput,
              outputs: [buildOutput],
              project: new codebuild.Project(this, 'ItsOnBuild', {
                buildSpec: codebuild.BuildSpec.fromObject({
                  version: '0.2',
                  phases: {
                    install: {
                      commands: [
                        'npm install',
                      ],
                      'runtime-versions': {
                        nodejs: 'latest',
                      }
                    },
                    build: {
                      commands: [
                        'npm run build',
                        'npx cdk synth ItsOnStack',
                      ],
                    },
                  },
                  artifacts: {
                    'base-directory': 'cdk.out',
                    files: ['ItsOnStack.template.json'],
                  },
                }),
              }),
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipelineActions.CloudFormationCreateUpdateStackAction({
              actionName: 'Deploy',
              stackName: 'ItsOnStack',
              templatePath: buildOutput.atPath('ItsOnStack.template.json'),
              adminPermissions: true,
            }),
          ],
        },
      ],
    });
  }
}
