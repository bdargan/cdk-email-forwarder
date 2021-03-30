#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { CdkEmailForwarderStack } from '../lib/cdk-email-forwarder-stack';

const app = new cdk.App();
new CdkEmailForwarderStack(app, 'CdkEmailForwarderStack');
