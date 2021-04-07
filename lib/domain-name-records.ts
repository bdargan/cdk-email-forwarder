import * as cdk from '@aws-cdk/core'
import * as route53 from '@aws-cdk/aws-route53'
import { IHostedZone } from '@aws-cdk/aws-route53'

export interface AddMXDNSRecordProps {
  domainName: string
  hostNames: string[]
  zone: IHostedZone
}

export class AddMXDNSRecord extends cdk.Construct {
  readonly domainName: string
  readonly zone: IHostedZone
  constructor(scope: cdk.Construct, id: string, props: AddMXDNSRecordProps) {
    super(scope, id)

    const { zone, hostNames } = props
    for (let hostName of hostNames) {
      new route53.MxRecord(this, `MX`, {
        zone,
        recordName: `${zone.zoneName}.`,
        values: [
          {
            priority: 10,
            hostName
          }
        ]
      })
    }
  }
}
