import * as s3 from '@aws-cdk/aws-s3'
import * as ses from '@aws-cdk/aws-ses'
import * as actions from '@aws-cdk/aws-ses-actions'
import * as cdk from '@aws-cdk/core'
import * as lambda from '@aws-cdk/aws-lambda'
import * as sns from '@aws-cdk/aws-sns'
export interface ReceiverProps extends cdk.StackProps {
  bucket: s3.IBucket
  forwardTo: string
  keyPrefix: string
  fn: lambda.IFunction
  topic?: sns.ITopic
}

export class Receiver extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: ReceiverProps) {
    super(scope, id)

    const { bucket, fn, keyPrefix, topic } = props

    var s3Props: actions.S3Props = { bucket, objectKeyPrefix: `${keyPrefix}/`, topic }
    const receiptRuleSet = new ses.ReceiptRuleSet(scope, 'RuleSet', {
      rules: [
        {
          actions: [
            new actions.S3(s3Props),
            new actions.Lambda({
              function: fn
            })
          ]
        }
      ]
    })
  }
}
