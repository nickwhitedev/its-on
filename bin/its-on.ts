#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ItsOnStack } from '../lib/its-on-stack';
import { ItsOnPipelineStack } from '../lib/its-on-pipeline-stack';

const app = new cdk.App();
new ItsOnStack(app, 'ItsOnStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});
new ItsOnPipelineStack(app, 'ItsOnPipelineStack');

app.synth();