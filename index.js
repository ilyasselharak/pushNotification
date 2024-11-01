const express = require("express");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");
let storedToken = '';
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

let expo = new Expo();

// Home route with form
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to the Push Notification Server! ${storedToken || 'No token stored yet.'}</h1>
       <p>Stored Expo Push Token: ${storedToken || 'No token stored yet.'}</p>
        <form method="POST" action="/send-notification">
            <label for="pushToken">Expo Push Token:</label><br>
            <input type="text" id="pushToken" name="pushToken" required><br><br>
            <label for="message">Message:</label><br>
            <input type="text" id="message" name="message" required><br><br>
            <input type="submit" value="Send Notification">
        </form>
    `);
});
app.post("/storetoken", (req, res) => {
    const { token } = req.body;
    if (token && Expo.isExpoPushToken(token)) {
        storedToken = token; // Store the token
        res.status(200).send({ message: "Token stored successfully." });
    } else {
        res.status(400).send({ error: "Invalid Expo push token." });
    }
});
// Send notification route
app.post("/send-notification", async (req, res) => {
    const pushToken = req.body.pushToken; // Get the push token from the request body
    const message = req.body.message; // Get the message from the request body

    // Check if the push token is valid
    if (!Expo.isExpoPushToken(pushToken)) {
        return res.status(400).send({ error: "Invalid Expo push token" });
    }

    let messages = [{
        to: pushToken,
        sound: "default",
        body: message,
        data: { message }
    }];

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

// Set the port to the Render environment variable if available
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Push notification server running on port ${PORT}`);
});