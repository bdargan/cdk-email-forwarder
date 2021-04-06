import * as cdk from '@aws-cdk/core'
import { ForwarderLambda } from './forwarder-lambda'
import { VerifyDomainIdentity } from './domain-verification'
import { EmailBucket } from './email-bucket'
import { Receiver } from './receiver'
export interface CdkEmailForwarderStackProps extends cdk.StackProps {
  stage: string
}
export class CdkEmailForwarderStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: CdkEmailForwarderStackProps) {
    super(scope, id, props)

    const stageProps = this.node.tryGetContext(props?.stage)
    const { bucketName, domainNames, forwardTo } = stageProps

    const emailProps: any = Object.assign({}, props, { bucketName, expiryDays: 30 })
    const emailBucket = new EmailBucket(this, 'Email', emailProps)

    for (let domainName of domainNames) {
      const verifyDomainProps: any = Object.assign({}, props, {
        domainName: domainName
      })
      new VerifyDomainIdentity(this, `SES-${domainName}`, verifyDomainProps)
    }

    const forwarderFn = new ForwarderLambda(this, 'ForwarderLambda', props)
    // console.log('bucketArn', emailBucket.bucket.bucketArn)
    // console.log('lambdaArn', forwarderFn.lambda.functionArn)

    const receiverProps = Object.assign({}, props, { fn: forwarderFn.lambda, bucket: emailBucket.bucket, forwardTo })
    // const receiver = new Receiver(this, 'Receiver', receiverProps)
  }

  protected onValidate(): string[] {
    const errors: string[] = []
    const validRegions = ['us-east-1', 'us-west-2', 'eu-west-1']
    if (!validRegions.includes(this.region)) {
      errors.push(`incorrect region ${this.region}, ses receipt rules need to be in one of ${validRegions.join(', ')}`)
    }
    return errors
  }
}
