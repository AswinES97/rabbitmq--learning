const express = require('express')
const amqp = require('amqplib')

const app = express()
app.use(express.json())

let ch1, conn, queue

// rabbitmq config
(async () => {
    queue = "ticket-srv-queue"
    try {
        const amqpServer = 'amqp://localhost'
        conn = await amqp.connect(amqpServer)
        ch1 = await conn.createChannel();
        await ch1.assertQueue(queue)

    } catch (error) {
        console.log("rabbitmq conn error: ", error);
    }
})()

// promise for consuming
const consumeMessage = (ch1) =>
    new Promise((resolve) => {
        ch1.consume(queue, (data) => {
            ch1.ack(data);
            resolve(data.content.toString());
        });
    });

// route
app.post('/', async (req, res) => {
    console.log('herer');
    const { msg } = req.body
    let responseMsg

    // Producing to order queue as buffer data
    try {
        ch1.sendToQueue(
            "order-srv-queue",
            Buffer.from(
                JSON.stringify({ msg })
            )
        );
    } catch (error) {
        console.error('Error sending message to order-srv-queue:', error);
    }

    // Consuming the ticket queue and parsing to object 
    await consumeMessage(ch1).then(data => {
        responseMsg = JSON.parse(data)
    })


    return res.json({
        msg: responseMsg.msg
    })
})

app.listen(3000, () => {
    console.log('app listning on port 3000!');
})