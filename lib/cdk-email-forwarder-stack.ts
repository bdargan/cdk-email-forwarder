import * as cdk from '@aws-cdk/core'
import { ForwarderLambda } from './forwarder-lambda'
import { VerifyDomainIdentity } from './verify-domain-identity'
import { EmailBucket } from './email-bucket'
import { Receiver } from './receiver'
import { AddMXDNSRecord } from './domain-name-records'
import { ForwarderNotification } from './notification'
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

    const addMxRecord = (verifiedDomain: VerifyDomainIdentity) => {
      const { domainName, zone } = verifiedDomain
      const hostNames = [`inbound-smtp.${this.region}.amazonaws.com.`]
      const domainRecordProps = Object.assign({}, props, { zone, hostNames, domainName })
      new AddMXDNSRecord(this, `SES-DNS-${domainName}`, domainRecordProps)
    }

    for (let domainName of domainNames) {
      const verifyDomainProps: any = Object.assign({}, props, {
        domainName: domainName
      })
      const verifiedDomain = new VerifyDomainIdentity(this, `SES-${domainName}`, verifyDomainProps)
      addMxRecord(verifiedDomain)
    }

    const forwarderFn = new ForwarderLambda(this, 'ForwarderLambda', props)

    const notification = new ForwarderNotification(this, 'Notification', Object.assign({}, props, stageProps))
    const receiverProps = Object.assign({}, props, {
      fn: forwarderFn.lambda,
      bucket: emailBucket.bucket,
      forwardTo,
      topic: notification.topic
    })
    const receiver = new Receiver(this, 'Receiver', receiverProps)
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
