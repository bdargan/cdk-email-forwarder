# CDK SES Email Forwarder

Provide a stack that receives emails for a domain and forwards emails to *verified* addresses.

Email headers for From and Reply-To are modified when sent. Email attachments are supported (upto 10MB).

Email forwarding mapping can be managed in SSM for multiple domains.
## Stack creates
* S3 bucket *- for email body and attachments*
* SES Domain verification
* SSM for shared config
* Forwarder lambda
* S3 auto delete lambda
* Log retention lambda
## Use cases
* Email forwarding / aggregation

## Setup *WIP*

configure the stack in cdk.json.

Then configure the SSM key.

Update cdk.json to set context variables per stage:
```json

{"context":
  "stageName": {
    "domainNames": ["example.com", "example.net"],
    "forwardTo": "forwardto@destination.com",
    "bucketName": "email-forwarder",
    "notifications": {
      "email": "debug@destination.com",
      "enabled": "true"
      }
  }
}
```
cdk context

yarn
yarn build
yarn deploy

console.log the command to execute the ruleset
OR Enable the ses ruleset manually

Manually verify email notification address
Add new emails to forward to.

## Verifying new addresses
- Manual step via cli or console

## Verifying SNS notification address
Check your emails.
## Questions
1. DKIM
## Constraints (SES)

SES only allows sending email from addresses or domains that are verified. Since this script is meant to allow forwarding email from any sender, the message is modified to allow forwarding through SES and reflect the original sender. This script adds a Reply-To header with the original sender, but the From header is changed to display the original sender but to be sent from the original destination.

For example, if an email sent by Jane Example <jane@example.com> to info@example.com is processed by this script, the From and Reply-To headers will be set to:

From: Jane Example at jane@example.com <info@example.com>
Reply-To: jane@example.com
To override this behavior, set a verified fromEmail address (e.g., noreply@example.com) in the config object and the header will look like this.

From: Jane Example <noreply@example.com>
Reply-To: jane@example.com
SES only allows receiving email sent to addresses within verified domains. For more information, see: http://docs.aws.amazon.com/ses/latest/DeveloperGuide/verify-domains.html

SES only allows sending emails up to 10 MB in size (including attachments after encoding). See: https://docs.aws.amazon.com/ses/latest/DeveloperGuide/limits.html

Initially SES users are in a sandbox environment that has a number of limitations. See: http://docs.aws.amazon.com/ses/latest/DeveloperGuide/limits.html


## References
- https://github.com/arithmetric/aws-lambda-ses-forwarder
- https://nealalan.github.io/AWS-Email-Forwarder/
- https://github.com/seeebiii/ses-email-forwarding