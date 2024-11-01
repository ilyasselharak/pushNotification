const express = require("express");
const bodyParser = require("body-parser");
const { Expo } = require("expo-server-sdk");
const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = 'https://miiwcyhgsuvthmhxlfzd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1paXdjeWhnc3V2dGhtaHhsZnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA0NTkzNjAsImV4cCI6MjA0NjAzNTM2MH0.dsDqKt41pJm3STbrFi4dt_LCB9LH2Yd3s7PcLUzYnx4';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const app = express();
app.use(bodyParser.json());
let expo = new Expo();

// Home route with form
app.get("/", (req, res) => {
    res.send(`
        <h1>Welcome to the Push Notification Server! </h1>
       <p>Stored Expo Push Token: </p>
        <form method="POST" action="/send-notification">
            <label for="pushToken">Expo Push Token:</label><br>
            <input type="text" id="pushToken" name="pushToken" required><br><br>
            <label for="message">Message:</label><br>
            <input type="text" id="message" name="message" required><br><br>
            <input type="submit" value="Send Notification">
        </form>
    `);
});

app.post("/send-notifications", async (req, res) => {
    const message = req.body.message;

    try {
        // Fetch all tokens from Supabase
        const { data: tokens, error } = await supabase.from('expo_tokens').select('token');
        if (error) throw error;

        const messages = tokens.map(({ token }) => ({
            to: token,
            sound: 'default',
            body: message,
            data: { message },
        }));

        const chunks = expo.chunkPushNotifications(messages);
        const tickets = [];

        for (let chunk of chunks) {
            try {
                const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                tickets.push(...ticketChunk);
            } catch (error) {
                console.error("Error sending notification chunk:", error);
            }
        }

        res.status(200).send({ tickets });
    } catch (error) {
        console.error("Error fetching tokens or sending notifications:", error);
        res.status(500).send({ error: "Failed to send notifications" });
    }
});
// Set the port to the Render environment variable if available
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Push notification server running on port ${PORT}`);
});