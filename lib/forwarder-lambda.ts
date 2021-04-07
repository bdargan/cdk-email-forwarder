import * as nodejs from '@aws-cdk/aws-lambda-nodejs'
import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { Duration } from '@aws-cdk/core'
import { ForwarderStageProps } from './stage-props'

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
        BUCKET: bucketName
      },
      bundling: {
        sourceMap: true
      }
    })
    this.lambda = fn
  }
}
