const config = require('./config');
const dataCollector = require('./dataCollector');
const predictionEngine = require('./predictionEngine');

class Timeline {
  constructor() {
    this.events = [];
    this.lastUpdate = null;
  }

  // Update timeline with new data and predictions
  async updateTimeline() {
    try {
      // Get historical data
      const historicalData = dataCollector.getData({
        startDate: this.getHistoricalStartDate(),
        endDate: new Date()
      });

      // Get predictions
      const predictions = predictionEngine.getPredictions();

      // Convert data to timeline events
      const historicalEvents = this.convertDataToEvents(historicalData);
      const predictionEvents = this.convertPredictionsToEvents(predictions);

      // Merge and sort all events
      this.events = [...historicalEvents, ...predictionEvents].sort((a, b) => 
        new Date(a.date) - new Date(b.date)
      );

      this.lastUpdate = new Date();
      return this.events;
    } catch (error) {
      console.error('Error updating timeline:', error);
      throw error;
    }
  }

  // Calculate start date for historical data
  getHistoricalStartDate() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - config.analysis.timelineWindow.past);
    return startDate;
  }

  // Convert collected data to timeline events
  convertDataToEvents(data) {
    return data.map(item => ({
      id: this.generateEventId(),
      type: 'historical',
      date: new Date(item.publishedAt || item.createdAt),
      source: item.source,
      title: item.title || this.generateEventTitle(item),
      description: item.description || item.content,
      sentiment: item.sentiment,
      metrics: item.metrics || {},
      relevance: this.calculateEventRelevance(item),
      tags: this.generateEventTags(item),
      links: this.extractLinks(item)
    }));
  }

  // Convert predictions to timeline events
  convertPredictionsToEvents(predictions) {
    return predictions.map(prediction => ({
      id: this.generateEventId(),
      type: 'prediction',
      date: new Date(prediction.predictedDate),
      topic: prediction.topic,
      title: this.generatePredictionTitle(prediction),
      description: prediction.details.summary,
      confidence: prediction.confidence,
      trend: prediction.trend,
      implications: prediction.details.implications,
      analysis: prediction.details.analysis,
      metadata: prediction.metadata,
      tags: this.generatePredictionTags(prediction)
    }));
  }

  // Generate unique event ID
  generateEventId() {
    return 'evt_' + Math.random().toString(36).substr(2, 9);
  }

  // Generate title for data events
  generateEventTitle(item) {
    if (item.source === 'twitter') {
      return `Tweet: ${item.content.substring(0, 50)}...`;
    } else if (item.source === 'reddit') {
      return `Reddit Post: ${item.title}`;
    } else {
      return `News: ${item.description ? item.description.substring(0, 50) + '...' : 'No description'}`;
    }
  }

  // Generate title for prediction events
  generatePredictionTitle(prediction) {
    const strength = prediction.trend.strength > 7 ? 'Strong' : 
                    prediction.trend.strength > 4 ? 'Moderate' : 'Mild';
    
    return `${strength} ${prediction.trend.direction} trend predicted in ${prediction.topic}`;
  }

  // Calculate relevance score for events
  calculateEventRelevance(item) {
    let score = 0;

    // Factor in engagement metrics if available
    if (item.metrics) {
      if (item.metrics.likes) score += Math.min(item.metrics.likes / 1000, 5);
      if (item.metrics.shares) score += Math.min(item.metrics.shares / 500, 5);
      if (item.metrics.comments) score += Math.min(item.metrics.comments / 100, 5);
    }

    // Factor in sentiment strength
    if (item.sentiment) {
      score += Math.abs(item.sentiment.score) * 2;
    }

    // Normalize score to 0-100
    return Math.min(Math.round(score * 10), 100);
  }

  // Generate tags for historical events
  generateEventTags(item) {
    const tags = new Set();

    // Add source as tag
    tags.add(item.source);

    // Add sentiment as tag
    if (item.sentiment) {
      tags.add(item.sentiment.label);
    }

    // Add topic-based tags
    const content = (item.title + ' ' + (item.description || item.content)).toLowerCase();
    const topicKeywords = {
      technology: ['tech', 'digital', 'software', 'ai', 'innovation'],
      politics: ['government', 'policy', 'election', 'political'],
      economy: ['market', 'economic', 'financial', 'trade'],
      health: ['health', 'medical', 'healthcare', 'disease'],
      environment: ['climate', 'environmental', 'sustainable']
    };

    Object.entries(topicKeywords).forEach(([topic, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        tags.add(topic);
      }
    });

    return Array.from(tags);
  }

  // Generate tags for prediction events
  generatePredictionTags(prediction) {
    const tags = new Set([
      'prediction',
      prediction.topic,
      prediction.trend.direction,
      `confidence-${Math.round(prediction.confidence * 10) / 10}`
    ]);

    return Array.from(tags);
  }

  // Extract links from event data
  extractLinks(item) {
    const links = [];

    if (item.url) {
      links.push({
        type: 'source',
        url: item.url
      });
    }

    // Extract URLs from content
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const content = item.description || item.content || '';
    const contentUrls = content.match(urlRegex) || [];

    contentUrls.forEach(url => {
      if (url !== item.url) {
        links.push({
          type: 'reference',
          url: url
        });
      }
    });

    return links;
  }

  // Get timeline events with filtering options
  getEvents(options = {}) {
    let filteredEvents = [...this.events];

    // Filter by date range
    if (options.startDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) >= new Date(options.startDate)
      );
    }

    if (options.endDate) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.date) <= new Date(options.endDate)
      );
    }

    // Filter by type
    if (options.type) {
      filteredEvents = filteredEvents.filter(event => 
        event.type === options.type
      );
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        options.tags.some(tag => event.tags.includes(tag))
      );
    }

    // Filter by minimum relevance
    if (options.minRelevance) {
      filteredEvents = filteredEvents.filter(event => 
        event.relevance >= options.minRelevance
      );
    }

    // Filter by minimum confidence (for predictions)
    if (options.minConfidence) {
      filteredEvents = filteredEvents.filter(event => 
        event.type !== 'prediction' || event.confidence >= options.minConfidence
      );
    }

    // Sort events
    if (options.sortOrder === 'desc') {
      filteredEvents.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else {
      filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    return filteredEvents;
  }

  // Get timeline statistics
  getStatistics() {
    const stats = {
      total: this.events.length,
      byType: {
        historical: 0,
        prediction: 0
      },
      byTopic: {},
      averageConfidence: 0,
      topTags: this.getTopTags()
    };

    this.events.forEach(event => {
      // Count by type
      stats.byType[event.type]++;

      // Count by topic
      if (event.topic) {
        stats.byTopic[event.topic] = (stats.byTopic[event.topic] || 0) + 1;
      }

      // Add to confidence calculation if prediction
      if (event.type === 'prediction') {
        stats.averageConfidence += event.confidence;
      }
    });

    // Calculate average confidence
    if (stats.byType.prediction > 0) {
      stats.averageConfidence /= stats.byType.prediction;
    }

    return stats;
  }

  // Get most common tags
  getTopTags(limit = 10) {
    const tagCounts = {};
    
    this.events.forEach(event => {
      event.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }
}

module.exports = new Timeline();