import * as cdk from '@aws-cdk/core'
import * as iam from '@aws-cdk/aws-iam'
import * as ses from '@aws-cdk/aws-ses'

import { ForwarderLambda } from './forwarder-lambda'
import { VerifyDomainIdentity } from './domain-verification'
import { EmailBucket } from './email-bucket'
import { Session } from 'inspector'
export class CdkEmailForwarderStack extends cdk.Stack {
  readonly domainName: string
  readonly bucketName: string

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const domain = this.node.tryGetContext('domain')
    const bucketName: string = this.node.tryGetContext('bucketName') ?? `emailforwarder.${domain}`

    // const { account } = props?.env ?? { account: null }
    // const sesServicePrincipal = new iam.ServicePrincipal('ses.amazonaws.com').withConditions({
    //   StringEquals: { 'aws:Referer': account }
    // })

    const emailProps: any = Object.assign({}, props, { bucketName, expiryDays: 30 })
    const emailBucket = new EmailBucket(this, 'Email', emailProps)

    const verifyDomainIdentity = new VerifyDomainIdentity(this, 'SES')

    const forwarderFn = new ForwarderLambda(this, domain, {})
    this.domainName = domain
    this.bucketName = bucketName
  }

  protected onValidate(): string[] {
    const errors: string[] = []
    if (!this.domainName) {
      errors.push('context variable "domain" is required')
    }
    // if (!this.bucketName) {
    //   errors.push('context variable "bucketName" is required')
    // }

    return errors
  }
}
