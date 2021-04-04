import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert'
import * as cdk from '@aws-cdk/core'
import * as CdkEmailForwarder from '../lib/cdk-email-forwarder-stack'

test('Empty Stack', () => {
  const app = new cdk.App()
  // WHEN
  const domainNames: string[] = []
  const bucketName = ''
  const forwardTo = ''
  const stack = new CdkEmailForwarder.CdkEmailForwarderStack(app, 'MyTestStack', { stage: 'dev' })
  // THEN
  expectCDK(stack).to(
    matchTemplate(
      {
        Resources: {}
      },
      MatchStyle.EXACT
    )
  )
})
