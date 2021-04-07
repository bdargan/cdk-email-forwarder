import * as cdk from '@aws-cdk/core'
import * as sns from '@aws-cdk/aws-sns'
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions'
import { ForwarderStageProps } from './stage-props'

type ForwarderNotificationProps = ForwarderStageProps
export class ForwarderNotification extends cdk.Construct {
  readonly topic: sns.ITopic
  constructor(scope: cdk.Construct, id: string, props: ForwarderNotificationProps) {
    super(scope, id)
    this.topic = new sns.Topic(this, 'EmailNotif', {
      topicName: 'EmailForwarderNotifier'
    })

    if (props?.notifications?.enabled === 'true') {
      const email = props?.notifications?.email
      const subscription = new subscriptions.EmailSubscription(email)
      this.topic.addSubscription(subscription)
    }
  }
}
