export interface ForwarderStageProps {
  domainNames: string[]
  bucketName: string
  keyPrefix: string
  forwardTo: string
  notifications?: {
    email: string
    enabled: string
  }
}
