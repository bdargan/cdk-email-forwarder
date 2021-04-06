import * as s3 from '@aws-cdk/aws-s3'
import * as ses from '@aws-cdk/aws-ses'
import * as actions from '@aws-cdk/aws-ses-actions'
import * as cdk from '@aws-cdk/core'
import * as sns from '@aws-cdk/aws-sns'
import * as iam from '@aws-cdk/aws-iam'
import * as lambda from '@aws-cdk/aws-lambda'
import { IPrincipal } from '@aws-cdk/aws-iam'

export interface ReceiverProps extends cdk.StackProps {
  bucket: s3.IBucket
  forwardTo: string
  fn: lambda.IFunction
}

export class Receiver extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ReceiverProps) {
    super(scope, id)

    const { bucket, fn } = props

    // const sesServicePrincipal = new iam.ServicePrincipal('ses.amazonaws.com').withConditions({
    //   StringEquals: { 'aws:Referer': props?.env?.account }
    // })
    // bucket.grantWrite(sesServicePrincipal)
    const receiptRuleSet = new ses.ReceiptRuleSet(scope, 'RuleSet', {
      rules: [
        {
          actions: [
            new actions.S3({
              bucket,
              objectKeyPrefix: 'emails/'
            }),
            new actions.Lambda({
              function: fn
            })
          ]
        }
      ]
    })
  }
}
