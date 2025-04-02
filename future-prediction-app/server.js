const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const config = require('./src/config');
const apiRoutes = require('./src/apiRoutes');
const dataCollector = require('./src/dataCollector');

// Initialize Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // HTTP request logger

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

// API routes
app.use('/api', apiRoutes);

// Catch-all route to return the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date()
  });
});

// Initialize data collection schedules
dataCollector.initializeSchedules();

// Start the server
const port = config.port;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log('Environment:', config.nodeEnv);
  console.log('Data collection intervals:', config.collectionIntervals);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Perform any necessary cleanup
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Perform any necessary cleanup
  process.exit(1);
});