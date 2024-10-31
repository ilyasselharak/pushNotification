const express = require("express");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");

const app = express();
app.use(bodyParser.json());

let expo = new Expo();

app.post("/send-notification", async (req, res) => {
    const { pushTokens, message } = req.body;
    console.log(pushTokens)

    // Validate request
    if (!Array.isArray(pushTokens) || !message) {
        return res.status(400).send({ error: "Invalid request format" });
    }

    let messages = [];
    for (let token of pushTokens) {
        if (!Expo.isExpoPushToken(token)) {
            console.error(`Push token ${token} is not a valid Expo push token`);
            continue;
        }

        messages.push({
            to: token,
            sound: "default",
            body: message,
            data: { message }
        });
    }

    let chunks = expo.chunkPushNotifications(messages);
    let tickets = [];

    try {
        for (let chunk of chunks) {
            let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
            tickets.push(...ticketChunk);
        }
        res.send({ tickets });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Error sending notifications" });
    }
});

app.listen(3000, () => {
    console.log("Push notification server running on port 3000");
});
