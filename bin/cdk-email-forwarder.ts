#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { CdkEmailForwarderStack } from '../lib/cdk-email-forwarder-stack'

const app = new cdk.App()
const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT || 'account?',
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION || 'region?'
}

const stage = process.env.STAGE || 'tmc'
console.log('env', env)

new CdkEmailForwarderStack(app, 'CdkEmailForwarderStack', { env, stage })

// rule-set stack must be deployed in us-east-1, us-west-2, eu-west-1
// including all aws resources (except for s3 buckets)
// https://github.com/aws/aws-cdk/issues/2584
