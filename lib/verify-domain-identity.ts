import { AwsCustomResource, AwsCustomResourcePolicy, PhysicalResourceId } from '@aws-cdk/custom-resources'
import * as cdk from '@aws-cdk/core'
import * as route53 from '@aws-cdk/aws-route53'
import * as logs from '@aws-cdk/aws-logs'
import * as iam from '@aws-cdk/aws-iam'
import { IHostedZone } from '@aws-cdk/aws-route53'
export interface VerifyDomainIdentityProps {
  service?: string //SES
  domainName: string
}

export class VerifyDomainIdentity extends cdk.Construct {
  readonly domainName: string
  readonly zone: IHostedZone
  constructor(scope: cdk.Construct, id: string, props: VerifyDomainIdentityProps) {
    super(scope, id)

    const domainName = props.domainName
    this.domainName = props.domainName

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

    const prefix = `verifyDomainIdentity ${domainName}`

    // console.debug(prefix, 'start')
    const verifyDomainIdentity = new AwsCustomResource(this, 'VerifyDomainIdentity', {
      onCreate: {
        service,
        action: 'verifyDomainIdentity',
        parameters: {
          Domain: domainName
        },
        physicalResourceId: PhysicalResourceId.fromResponse('VerificationToken') // Use the token returned by the call as physical id
      },
      timeout: cdk.Duration.minutes(15),
      policy: AwsCustomResourcePolicy.fromSdkCalls({ resources: AwsCustomResourcePolicy.ANY_RESOURCE }),
      role,
      logRetention: logs.RetentionDays.ONE_WEEK
    })

    // console.debug(prefix, 'lookup zone')
    const zone = route53.PublicHostedZone.fromLookup(this, `Zone`, { domainName })
    // const zone = route53.HostedZone.fromHostedZoneAttributes(this, `Zone`, { zoneName: domainName }))
    this.zone = zone

    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: [`arn:${cdk.Stack.of(verifyDomainIdentity).partition}:route53:::hostedzone/${zone.hostedZoneId}`],
        actions: ['route53:GetChange', 'route53:changeResourceRecordSets']
      })
    )

    const recordName = `_amazon${service.toLowerCase()}.${domainName}`
    const verificationToken = verifyDomainIdentity.getResponseField('VerificationToken')
    new route53.TxtRecord(this, `${service}VerificationRecord`, {
      zone,
      recordName,
      values: [verificationToken]
    })
    // console.debug(prefix, 'txt record added')

    //Q: are any more steps needed? https://github.com/mooyoul/aws-cdk-ses-domain-identity/blob/master/lambda-packages/dns-validated-domain-identity-handler/src/verifier.ts
  }

  onValidate(): string[] {
    const errors: string[] = []
    var normalizedZoneName = this.zone?.zoneName
    // console.log('normalizedZoneName', normalizedZoneName)

    if (normalizedZoneName.endsWith('.')) {
      normalizedZoneName = normalizedZoneName.substring(0, normalizedZoneName.length - 1)
    }

    if (
      !cdk.Token.isUnresolved(normalizedZoneName) &&
      this.domainName !== normalizedZoneName &&
      !this.domainName.endsWith('.' + normalizedZoneName)
    ) {
      errors.push(`DNS zone ${normalizedZoneName} is not authoritative for SES identity domain name ${this.domainName}`)
    }
    return errors
  }
}
