import {
  SESv2,
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailRequest,
  Destination,
  EmailContent
} from '@aws-sdk/client-sesv2'

import { GetObjectCommand, GetObjectCommandOutput, GetObjectOutput, S3 } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

const region = process.env.REGION ?? 'us-west-2'
const client = new SESv2({ region })
const s3Client = new S3({ region })

const forwardTo = process.env.FORWARD_TO ?? 'brett.dargan@gmail.com'
const sender = process.env.SENDER ?? 'brett.dargan@gmail.com'
const bucketName = process.env.BUCKET ?? 'specify-bucket-env-vars'
const keyPrefix = process.env.KEY_PREFIX ?? 'specify-key-prefix'
const plusDomain = process.env.PLUS_DOMAIN === 'true' ?? true

const getEmail = (mail: any, plusDomain: boolean) => {
  if (plusDomain) {
    const toParts = forwardTo.split('@')
    const domain = toParts[1]
    const destination = mail?.destination ?? 'unknown-source'
    const destParts = destination.split('@')
    return `${toParts[0]}+${destParts[1]}@${domain}`
  }
  return forwardTo
}
const sendMessage = async (record: any, body: string) => {
  console.log('sendMessage', JSON.stringify(record, null, 2))
  const mail = record?.ses?.mail
  const email = getEmail(mail, plusDomain)
  const subject = mail?.commonHeaders?.subject ?? 'subject?'
  const destination: Destination = {
    ToAddresses: [email]
  }
  const source = mail?.source ?? 'unknown-source'
  const params: SendEmailCommandInput = {
    FromEmailAddress: sender,
    ReplyToAddresses: [source],
    Destination: destination,
    Content: {
      Simple: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: {
          Text: { Data: body, Charset: 'UTF-8' }
        }
      }
    }
  }
  // const params: SendEmailCommandInput = {
  //   // Source: source,
  //   ReplyToAddresses: [source],
  //   Destination: destination,
  //   Message: body ?? 'empty message'
  // }

  console.log('sendEmail params', params)
  const command = new SendEmailCommand(params)

  return client.send(command)
}

const handleEvent = async (event: any) => {
  if (!event.Records) {
    return
  }
  return Promise.all(
    event.Records.map(async (record: any) => {
      const messageId = record?.ses?.mail?.messageId ?? 'invalid messageId'
      const key = `${keyPrefix}/${messageId}`
      const params = {
        Bucket: bucketName,
        Key: key
      }
      console.log('getObject params', params)
      const getContent = new GetObjectCommand(params)

      return s3Client.send(getContent).then(async (resp: GetObjectCommandOutput) => {
        if (resp.Body instanceof Readable) {
          var body = ''
          for await (const chunk of resp.Body) {
            body += chunk
          }
          console.log('body is', body)
          return sendMessage(record, body)
        } else {
          console.log('resp.Body type unhandled')
          return sendMessage(record, 'type unknown')
        }
      })
    })
  )
}

export const handler = async (event: any, context: any) => {
  console.log('forwarder event', JSON.stringify(event, null, 2))
  return handleEvent(event)
}
