require('dotenv').config()
const amqplib = require('amqplib')
const EmailService = require('./services/email')

const URL = process.env.CLOUDAMQP_URL || 'amqp://localhost'
const QUEUE = 'todo'

const username = process.env.EMAIL_USER
const password = process.env.EMAIL_PASSWORD
const service = EmailService(username, password)

async function main () {
  const client = await amqplib.connect(URL)
  const channel = await client.createChannel()
  await channel.assertQueue(QUEUE)
  channel.consume(QUEUE, (msg) => {
    const data = JSON.parse(msg.content)
    console.log('Received:', data)
    service.sendEmail(
      data.email,
      'Someone has shared a task with you!',
      `Hi ${data.email}, you have received a new task '${data.task}'!`
    ).then(() => {
      console.log(`Email sent to ${data.email}`)
      channel.ack(msg)
    }).catch((err) => {
      channel.nack(msg)
    })
  })
}

main().catch(err => {
  console.log(err)
})
