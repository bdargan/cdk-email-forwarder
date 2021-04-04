import * as cdk from '@aws-cdk/core'

import { ForwarderLambda } from './forwarder-lambda'
import { VerifyDomainIdentity } from './domain-verification'
import { EmailBucket } from './email-bucket'

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
  }

  protected onValidate(): string[] {
    const errors: string[] = []
    return errors
  }
}
