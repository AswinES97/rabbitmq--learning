const express = require('express')
const amqp = require('amqplib')

const app = express()

let conn,ch1, msg, queue

// rabbitmq config
async function connectToRabbitMQ() {
    queue = 'order-srv-queue'
    try {
        const amqpServer = 'amqp://localhost'
        conn = await amqp.connect(amqpServer)
        ch1 = await conn.createChannel();
        await ch1.assertQueue(queue)
        
    } catch (error) {
        console.log("rabbitmq conn error: ", error);
    }
}
// handling consuming and sending
connectToRabbitMQ().then(() => {

    ch1.consume('order-srv-queue', async(data) => {
        console.log('consumed from order-srv');

        msg = JSON.parse(data.content)
        ch1.ack(data)
        const conn2 = await conn.createChannel()
        try {
            conn2.sendToQueue("ticket-srv-queue",
                Buffer.from(
                    JSON.stringify({ msg: 'got msg' })
                    ))
        } catch (error) {
            console.error('Error sending msg from to ticket-srv-queue',error);
        }
    })

})

app.listen(3001, () => {
    console.log('app listning on port 3001!');
})