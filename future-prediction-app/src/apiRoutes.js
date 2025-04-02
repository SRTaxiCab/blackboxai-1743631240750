const express = require('express');
const router = express.Router();
const dataCollector = require('./dataCollector');
const predictionEngine = require('./predictionEngine');
const timeline = require('./timeline');

// Middleware to handle async errors
const asyncHandler = fn => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Trigger data collection
router.post('/collect', asyncHandler(async (req, res) => {
  const newsData = await dataCollector.collectNewsData();
  const socialData = await dataCollector.collectSocialData();

  res.json({
    status: 'success',
    collected: {
      news: newsData.length,
      social: socialData.length
    },
    timestamp: new Date()
  });
}));

// Get collected data
router.get('/data', asyncHandler(async (req, res) => {
  const { source, startDate, endDate } = req.query;
  
  const data = dataCollector.getData({
    source,
    startDate,
    endDate
  });

  res.json({
    status: 'success',
    data,
    count: data.length,
    timestamp: new Date()
  });
}));

// Generate predictions
router.post('/predict', asyncHandler(async (req, res) => {
  const predictions = await predictionEngine.generatePredictions();

  res.json({
    status: 'success',
    predictions,
    count: predictions.length,
    timestamp: new Date()
  });
}));

// Get current predictions
router.get('/predictions', asyncHandler(async (req, res) => {
  const { topic, minConfidence, dateRange } = req.query;
  
  const predictions = predictionEngine.getPredictions({
    topic,
    minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
    dateRange: dateRange ? JSON.parse(dateRange) : undefined
  });

  res.json({
    status: 'success',
    predictions,
    count: predictions.length,
    timestamp: new Date()
  });
}));

// Update timeline
router.post('/timeline/update', asyncHandler(async (req, res) => {
  const events = await timeline.updateTimeline();

  res.json({
    status: 'success',
    eventsCount: events.length,
    timestamp: new Date()
  });
}));

// Get timeline events
router.get('/timeline', asyncHandler(async (req, res) => {
  const {
    startDate,
    endDate,
    type,
    tags,
    minRelevance,
    minConfidence,
    sortOrder
  } = req.query;

  const events = timeline.getEvents({
    startDate,
    endDate,
    type,
    tags: tags ? tags.split(',') : undefined,
    minRelevance: minRelevance ? parseInt(minRelevance) : undefined,
    minConfidence: minConfidence ? parseFloat(minConfidence) : undefined,
    sortOrder
  });

  res.json({
    status: 'success',
    events,
    count: events.length,
    timestamp: new Date()
  });
}));

// Get timeline statistics
router.get('/timeline/stats', asyncHandler(async (req, res) => {
  const stats = timeline.getStatistics();

  res.json({
    status: 'success',
    statistics: stats,
    timestamp: new Date()
  });
}));

// Error handling middleware
router.use((err, req, res, next) => {
  console.error('API Error:', err);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    timestamp: new Date()
  });
});

module.exports = router;