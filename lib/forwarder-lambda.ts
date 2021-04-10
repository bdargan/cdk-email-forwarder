import * as nodejs from '@aws-cdk/aws-lambda-nodejs'
import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { Duration } from '@aws-cdk/core'
import { ForwarderStageProps } from './stage-props'
import { Effect, Grant } from '@aws-cdk/aws-iam'

export class ForwarderLambda extends cdk.Construct {
  readonly lambda: nodejs.NodejsFunction
  constructor(scope: cdk.Construct, id: string, props: ForwarderStageProps) {
    super(scope, id)
    const { forwardTo, bucketName, keyPrefix } = props
    const fnName = `SESForwarder`

    const fnBasicExecPolicy = iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
    const role = new iam.Role(this, `${fnName}Role`, {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [fnBasicExecPolicy]
    })

    const timeout = Duration.minutes(2)
    const fn = new nodejs.NodejsFunction(this, fnName, {
      entry: './lambdas/forwarder/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_14_X,
      role,
      timeout,
      environment: {
        FORWARD_TO: forwardTo,
        KEY_PREFIX: keyPrefix,
        BUCKET_PREFIX: keyPrefix,
        BUCKET: bucketName,
        BUCKET_NAME: bucketName,
        EMAIL_MAPPING_SSM_KEY: `/ses-email-forwarding/${bucketName}-rule/mapping`,
        FROM_EMAIL: forwardTo
      },
      bundling: {
        sourceMap: true
      }
    })
    this.lambda = fn

    const { region, account } = props.env ?? { region: 'us-west-2', account: 'none' }
    const allIdentities = `arn:aws:ses:${region}:${account}:identity/*`
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ses:SendEmail', 'ses:SendRawEmail'],
        resources: [allIdentities]
      })
    )
    const forwarderParameters = `arn:aws:ssm:${region}:${account}:parameter/ses-email-forwarding/*`
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['ssm:GetParameter'],
        resources: [forwarderParameters]
      })
    )
  }
}
