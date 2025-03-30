// Import required modules
const express = require('express');
const app = express();
const port = 3000;

// Middleware to parse URL-encoded requests
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const visitRoutes = require('./routes/visit');
const workerRoutes = require('./routes/worker');
const smsRoutes = require('./routes/sms');

// Middleware to parse JSON requests
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('Welcome to the Node-Express App!');
});

// API routes
app.use('/api/auth', authRoutes);

// Protecting routes
app.use('/api/visits', visitRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/sms', smsRoutes);

// Example API route
app.get('/api/data', (req, res) => {
  res.json({ message: 'Hello, this is your data!' });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});