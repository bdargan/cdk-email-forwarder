import { SESClient, SendEmailCommand, SendEmailCommandInput, SendEmailRequest, Destination } from '@aws-sdk/client-ses'
//@aws-sdk/client-s3-node, is deprecated!
import { GetObjectCommand, GetObjectCommandOutput, GetObjectOutput, S3 } from '@aws-sdk/client-s3'
import { Readable } from 'node:stream'
import { WriteStream } from 'node:fs'

const region = process.env.REGION ?? 'us-west-2'
const client = new SESClient({ region })
const s3Client = new S3({ region })

const forwardTo = process.env.FORWARD_TO ?? 'brett.dargan@gmail.com'
const bucketName = process.env.BUCKET ?? 'specify-bucket-env-vars'
const keyPrefix = process.env.KEY_PREFIX ?? 'specify-key-prefix'
const plusDomain = process.env.PLUS_DOMAIN === 'true' ?? true

// domains, receiver address
// const forwardMapping
// raw/html
// attachments
// plus support
// shortcode

const getEmail = (record: any, plusDomain: boolean) => {
  if (plusDomain) {
    const parts = forwardTo.split('@')
    const domain = parts[1]
    return `${parts[0]}+@${domain}`
  }
  return forwardTo
}
const sendMessage = async (record: any, body: Blob | ReadableStream | string) => {
  const email = getEmail(record, plusDomain)
  const destination: Destination = {
    ToAddresses: [email]
  }
  const source = record?.mail?.source ?? 'unknown-source'
  const params: SendEmailCommandInput = {
    Source: source,
    ReplyToAddresses: [source],
    Destination: destination,
    Message: body ?? 'empty message'
  }
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
        console.log('resp.Body instanceof ', typeof resp.Body)
        if (resp.Body instanceof Readable) {
          const writeable = new WriteStream()
          resp.Body.pipe(writeable)
          const body = await writeable.toString()
          return sendMessage(record, body)
        } else {
          console.log('resp.Body type unhandled')
        }
      })
    })
  )
}

export const handler = async (event: any, context: any) => {
  console.log('forwarder event', JSON.stringify(event, null, 2))
  return handleEvent(event)
}
