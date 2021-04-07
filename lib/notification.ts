import * as cdk from '@aws-cdk/core'
import * as sns from '@aws-cdk/aws-sns'
import * as subscriptions from '@aws-cdk/aws-sns-subscriptions'

export interface ForwarderNotificationInput {
  email: string
  enabled: string
}
export interface ForwarderNotificationProps extends cdk.StackProps {
  notifications: ForwarderNotificationInput
}

export class ForwarderNotification extends cdk.Construct {
  readonly topic: sns.ITopic
  constructor(scope: cdk.Construct, id: string, props: ForwarderNotificationProps) {
    super(scope, id)
    console.log(props)
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
