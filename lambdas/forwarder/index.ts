import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses'
import { send } from 'process'

const region = process.env.REGION ?? 'us-west-2'
const forwardTo = process.env.EMAIL ?? 'brett.dargan@gmail.com'
const client = new SESClient({ region })

// domains, receiver address
// const forwardMapping
// raw/html
// attachments
// plus support
// shortcode

export const handler = async (event: any, context: any) => {
  console.log('forwarder event', JSON.stringify(event, null, 2))

  // const params: SendEmailCommandInput = {
  //   Source: '',
  //   Destination: destination,
  //   Message: ''
  // }
  // const command = new SendEmailCommand(params)
  // return send(command)
  //   .then((data) => {})
  //   .catch((err) => {
  //     console.error(err)
  //     throw err
  //   })
  // }
}
