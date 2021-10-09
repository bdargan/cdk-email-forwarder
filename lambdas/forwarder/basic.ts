import {
  SESv2,
  SendEmailCommand,
  SendEmailCommandInput,
  SendEmailRequest,
  Destination,
  EmailContent,
  SESv2Client
} from '@aws-sdk/client-sesv2'

import { SES } from 'aws-sdk'
import { GetObjectCommand, GetObjectCommandOutput, GetObjectOutput, S3 } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

const region = process.env.REGION ?? 'us-west-2'
const client = new SESv2({ region })
const legacySes = new SES({ region })
const s3Client = new S3({ region })

const forwardTo = process.env.FORWARD_TO ?? 'brett.dargan@gmail.com'
const sender = process.env.SENDER ?? 'brett.dargan@gmail.com' //verified
const bucketName = process.env.BUCKET ?? 'specify-bucket-env-vars'
const keyPrefix = process.env.KEY_PREFIX ?? 'specify-key-prefix'
const plusDomain = process.env.PLUS_DOMAIN === 'true' ?? true

interface EmailData {
  record: any
  body: string
  emailData?: any
  destinations?: string[]
  source?: string
}

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

const sendMessagev2 = async (data: EmailData) => {
  const { record, body } = data
  console.log('sendMessage', JSON.stringify(record, null, 2))
  const mail = record?.ses?.mail
  const email = getEmail(mail, plusDomain)
  const subject = mail?.commonHeaders?.subject ?? 'subject?'
  const source = mail?.source ?? 'unknown-source'

  const destination: Destination = {
    ToAddresses: [email]
  }
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

  console.log('sendEmail params', params)
  const command = new SendEmailCommand(params)

  return client.send(command)
}

const sendMessage = async (data: EmailData) => {
  console.log('sendMessage called', JSON.stringify(data.body, null, 2))
  const params = {
    Destinations: data?.destinations,
    Source: data?.source,
    RawMessage: {
      Data: data?.emailData
    }
  }

  return legacySes.sendRawEmail(params).promise()
}

const getMessage = async (record: any): Promise<EmailData> => {
  const messageId = record?.ses?.mail?.messageId ?? 'invalid messageId'
  const key = `${keyPrefix}/${messageId}`
  const params = {
    Bucket: bucketName,
    Key: key
  }
  console.log('getObject params', params)

  const getContent = new GetObjectCommand(params)

  return s3Client.send(getContent).then(async (resp: GetObjectCommandOutput) => {
    var body = ''
    if (resp.Body instanceof Readable) {
      for await (const chunk of resp.Body) {
        body += chunk
      }
    }
    return { record, body }
  })
}

const createMessage = async (data: EmailData): Promise<EmailData> => {
  const { record, body } = data
  const emailData = body
  const mail = record?.ses?.mail

  var match = emailData.match(/^((?:.+\r?\n)*)(\r?\n(?:.*\s+)*)/m)
  var header = match && match[1] ? match[1] : emailData
  var _body = match && match[2] ? match[2] : ''

  const email = getEmail(mail, plusDomain)

  const destinations = [email]
  // const originalRecipient = origEmailKey.replace(/\+.*?@/, '@')
  //   // Add "Reply-To:" with the "From" address if it doesn't already exists
  // if (!/^reply-to:[\t ]?/im.test(header)) {
  //   match = header.match(/^from:[\t ]?(.*(?:\r?\n\s+.*)*\r?\n)/im)
  //   var from = match && match[1] ? match[1] : ''
  //   if (from) {
  //     header = header + 'Reply-To: ' + from
  //     console.log('Added Reply-To address of: ' + from)
  //   } else {
  //     console.log('Reply-To address not added because From address was not ' + 'properly extracted.')
  //   }
  // }

  const subject = mail?.commonHeaders?.subject ?? 'subject?'
  const source = mail?.source ?? 'unknown-source'
  header = header.replace(/^from:[\t ]?(.*(?:\r?\n\s+.*)*)/gim, (match, from) => {
    var fromText = ''
    if (sender) {
      fromText = 'From: ' + from.replace(/<(.*)>/, '').trim() + ' <' + sender + '>'
    }
    //  else {
    //   fromText = 'From: ' + from.replace('<', 'at ').replace('>', '') + ' <' + originalRecipient + '>'
    // }
    return fromText
  })

  // Replace original 'To' header with a manually defined one
  if (forwardTo) {
    header = header.replace(/^to:[\t ]?(.*)/gim, () => 'To: ' + forwardTo)
  }

  header = header.replace(/^return-path:[\t ]?(.*)\r?\n/gim, '')
  header = header.replace(/^sender:[\t ]?(.*)\r?\n/gim, '')
  header = header.replace(/^message-id:[\t ]?(.*)\r?\n/gim, '')

  // Remove all DKIM-Signature headers to prevent triggering an
  // "InvalidParameterValue: Duplicate header 'DKIM-Signature'" error.
  header = header.replace(/^dkim-signature:[\t ]?.*\r?\n(\s+.*\r?\n)*/gim, '')

  //   data.emailData = header + body;
  //   return Promise.resolve(data);
  // }
  const updatedBody = header + '\r\n' + _body

  console.log('updated body', JSON.stringify(updatedBody, null, 2))
  return { record, body: updatedBody, destinations, source, emailData }
}

const handleRecord = async (record: any) => {
  return getMessage(record).then(createMessage).then(sendMessage)
}

export const handler = async (event: any, context: any) => {
  console.log('forwarder event', JSON.stringify(event, null, 2))
  if (!event.Records) {
    return
  }
  return Promise.all(event.Records.map(async (record: any) => await handleRecord(record)))
}
