import { Stack, StackProps } from 'aws-cdk-lib';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipelineActions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import {Construct} from 'constructs';

export class ItsOnPipelineStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
                        'npm run cdk synth',
                      ],
                      'runtime-versions': {
                        nodejs: 'latest',
                      }
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
    })
  }
}