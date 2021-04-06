import * as cdk from '@aws-cdk/core'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'

export interface EmailBucketProps extends cdk.StackProps {
  bucketName: string
  expiryDays?: number
  prefix?: string
}

export class EmailBucket extends cdk.Construct {
  readonly bucket: s3.Bucket
  readonly expiryDays: number
  constructor(scope: cdk.Construct, id: string, props: EmailBucketProps) {
    super(scope, id)
    const bucketName = props.bucketName
    const prefix = props.prefix ?? 'email/'
    const expiry = props.expiryDays ?? 30
    const removalPolicy = cdk.RemovalPolicy.DESTROY
    const duration = cdk.Duration.days(expiry)

    const bucket = new s3.Bucket(this, `Bkt${bucketName}`, {
      bucketName,
      autoDeleteObjects: true,
      publicReadAccess: false,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      enforceSSL: true
    })
    bucket.addLifecycleRule({
      id: 'expire30',
      expiration: duration,
      enabled: true,
      prefix
    })

    const { account } = props?.env ?? { account: null }
    const sesServicePrincipal = new iam.ServicePrincipal('ses.amazonaws.com').withConditions({
      StringEquals: { 'aws:Referer': account }
    })
    bucket.grantWrite(sesServicePrincipal)

    this.bucket = bucket
    this.expiryDays = expiry
  }
}
