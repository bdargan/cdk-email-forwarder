#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from '@aws-cdk/core'
import { CdkEmailForwarderStack } from '../lib/cdk-email-forwarder-stack'

const app = new cdk.App()
const env = {
  account: process.env.CDK_DEPLOY_ACCOUNT || process.env.CDK_DEFAULT_ACCOUNT || process.env.AWS_ACCOUNT,
  region: process.env.CDK_DEPLOY_REGION || process.env.CDK_DEFAULT_REGION || process.env.AWS_REGION
}

const stage = process.env.STAGE || 'tmc'
console.log('env', env)

new CdkEmailForwarderStack(app, 'CdkEmailForwarderStack', { env, stage })
