const express = require("express");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");

const app = express();
app.use(bodyParser.json());

let expo = new Expo();
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to the Push Notification Server!</h1>
        <p>Use the form below to send a notification.</p>
        <form method="POST" action="/send-notification">
            <label for="pushToken">Expo Push Token:</label><br>
            <input type="text" id="pushToken" name="pushToken" required><br><br>
            <label for="message">Message:</label><br>
            <input type="text" id="message" name="message" required><br><br>
            <input type="submit" value="Send Notification">
        </form>
    `);
});
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
    console.log("Push notification server running on port https://localhost:3000");
});
