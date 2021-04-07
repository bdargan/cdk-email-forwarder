import { StackProps } from '@aws-cdk/core'
export interface ForwarderStageProps extends StackProps {
  domainNames: string[]
  bucketName: string
  keyPrefix: string
  forwardTo: string
  notifications?: {
    email: string
    enabled: string
  }
}
