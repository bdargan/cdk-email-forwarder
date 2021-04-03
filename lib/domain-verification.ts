import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from '@aws-cdk/custom-resources'
import * as cdk from '@aws-cdk/core'
import * as route53 from '@aws-cdk/aws-route53'
import * as logs from '@aws-cdk/aws-logs'
import * as iam from '@aws-cdk/aws-iam'
export interface VerifyDomainIdentityProps {
  service?: string //SES
}

export class VerifyDomainIdentity extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props?: VerifyDomainIdentityProps) {
    super(scope, id)

    const domain = this.node.tryGetContext('domain') ?? 'no-context-variable'
    console.log('VerifyDomainIdentity', domain)

    const service = props?.service ?? 'SES'

    const role = new iam.Role(this, 'VerifyDomainIdentityRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    })
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ['*'],
        actions: [
          'ses:GetIdentityVerificationAttributes',
          'ses:GetIdentityDkimAttributes',
          'ses:SetIdentityDkimEnabled',
          'ses:VerifyDomainIdentity',
          'ses:VerifyDomainDkim',
          'ses:ListIdentities',
          'ses:DeleteIdentity'
        ]
      })
    )

    const verifyDomainIdentity = new AwsCustomResource(this, 'VerifyDomainIdentity', {
      onCreate: {
        service,
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domain
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken') // Use the token returned by the call as physical id
      },
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
      role,
      logRetention: logs.RetentionDays.ONE_WEEK
    })

    const zone = route53.PublicHostedZone.fromLookup(this, 'Zone', { domainName: domain })

    const recordName = `_amazon${service.toLowerCase()}.${domain}`
    new route53.TxtRecord(this, `${service}VerificationRecord`, {
      zone,
      recordName,
      values: [verifyDomainIdentity.getResponseField('VerificationToken')]
    })
  }
}
