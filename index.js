'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios')
//const {google} = require('googleapis')
require('dotenv').config()

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
// about Express itself: https://expressjs.com/
const app = express();

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/webhook', line.middleware(config), async (req, res) => {


    Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result))
        .catch((err) => {
            console.error(err);
            res.status(500).end();
        });
});



// event handler
let equipment = '';
async function handleEvent(event) {

    if (event.type !== 'message') {

        const echo = { type: 'text', text: "Equipment No ไม่ถูกต้อง รบกวนส่่งใหม่ครับ" };

        // use reply API
        return client.replyMessage(event.replyToken, echo);
    }

    if (event.message.type === "text") {

        const userText = event.message.text;
        if (userText.startsWith("2000000") || userText.startsWith("R1")) {
            // ส่งโลเคชั่น
            equipment = userText
            handleLocation(event);
        } else {
            //return Promise.resolve(null);
            const echo = { type: 'text', text: "Equipment No ไม่ถูกต้อง รบกวนส่่งใหม่ครับ" };

            // use reply API
            return client.replyMessage(event.replyToken, echo);
        }
    } else if (event.message.type === "location") {

        let data = {
            equipment,
            latitude: event.message.latitude,
            longitude: event.message.longitude,
            address: event.message.address
        }

        if (equipment !== "") {

            postData(data)

            equipment = "";
            const echo = { type: 'text', text: "บันทึกข้อมูลเรียบร้อบ ขอบคุณครับ" };

            // use reply API
            return client.replyMessage(event.replyToken, echo);

        } else {
            //return Promise.resolve(null);
            const echo = { type: 'text', text: "คุณต้องส่ง Equipment No มาก่อนครับ" };

            // use reply API
            return client.replyMessage(event.replyToken, echo);
        }


    } else {
        //return Promise.resolve(null);
        const echo = { type: 'text', text: "Equipment No ไม่ถูกต้อง รบกวนส่่งใหม่ครับ" };

        // use reply API
        return client.replyMessage(event.replyToken, echo);
    }
}

// function read data
app.get('/customerdata', async (req, res) => {

    const data = await getAllData();
    res.send(JSON.stringify(data.data))
})

async function getAllData() {
    return await axios({
        url: `${process.env.CONNECT_URL}?action=getCustomerAddress`,
        method: 'get'
    })
}

// function post data

function postData(data) {
    let recorddata = {

        equipment: data.equipment,
        latitude: data.latitude,
        longitude: data.longitude,
        address: data.address


    }


    // Add one line to the sheet
    const url = `${process.env.CONNECT_URL}?action=addLocation`
    axios.post(url, recorddata).then(() => console.log("Success"))

}

async function handleLocation(event) {

    return await axios({
        method: "post",
        url: process.env.REPLY_URL,
        headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`
        },
        data: JSON.stringify({
            replyToken: event.replyToken,
            messages: [
                {
                    "type": "text",
                    "text": "กรุณากดปุ่ม ส่งโลเคชั่น เพื่อส่งโลเคชั่นครับ",
                    "quickReply": {
                        "items": [
                            {

                                "type": "action",
                                "action": {
                                    "type": "location",
                                    "label": "ส่งโลเคชั่น"
                                }
                            }
                        ]
                    }
                }
            ]
        })
    })

}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});