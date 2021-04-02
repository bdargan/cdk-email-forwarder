import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as actions from '@aws-cdk/aws-ses-actions'
import * as iam from '@aws-cdk/aws-iam'
import { ForwarderLambda } from './forwarder-lambda'
export class CdkEmailForwarderStack extends cdk.Stack {
  readonly domainName: string
  readonly bucketName: string

  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const { account } = props?.env ?? { account: null }

    const domain = this.node.tryGetContext('domain')
    const bucketName: string = this.node.tryGetContext('bucketName') ?? `forwarder.${domain}`

    const removalPolicy = cdk.RemovalPolicy.DESTROY

    const duration = cdk.Duration.days(30)
    const bucket = new s3.Bucket(this, `Bkt${bucketName}`, {
      bucketName,
      autoDeleteObjects: true,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      removalPolicy,
      enforceSSL: true
    })
    // bucket.addLifecycleRule({
    //   id: 'expire90',
    //   expiration: duration,
    //   enabled: true,
    //   prefix: 'mail/'
    // })

    const sesServicePrincipal = new iam.ServicePrincipal('ses.amazonaws.com').withConditions({
      StringEquals: { 'aws:Referer': account }
    })
    bucket.grantWrite(sesServicePrincipal)
    // const resource = `${bucketName}/*`

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
