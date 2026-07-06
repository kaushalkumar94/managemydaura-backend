require("dotenv").config();

const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 3000;
// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;

// const client = twilio(accountSid, authToken);

// Enable CORS for all origins
app.use(cors());

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON requests
app.use(express.json());

// Import routes
const authRoutes = require("./routes/auth");
const visitRoutes = require("./routes/visit");
const workerRoutes = require("./routes/worker");
const smsRoutes = require("./routes/sms");
const scheduleRoutes = require("./routes/schedule");

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to the Node-Express App!");
});

// API routes
app.use("/api/auth", authRoutes);

// Protecting routes
app.use("/api/visits", visitRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/sms", smsRoutes);
app.use("/api/schedule", scheduleRoutes);

// Example API route
app.get("/api/data", (req, res) => {
  res.json({ message: "Hello, this is your data!" });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
