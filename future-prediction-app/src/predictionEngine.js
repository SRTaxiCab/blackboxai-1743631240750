const config = require('./config');
const dataCollector = require('./dataCollector');

class PredictionEngine {
  constructor() {
    this.predictions = [];
    this.lastAnalysis = null;
  }

  // Main prediction method
  async generatePredictions() {
    try {
      const data = dataCollector.getData();
      
      if (data.length < config.analysis.minimumDataPoints) {
        throw new Error(`Insufficient data points. Need at least ${config.analysis.minimumDataPoints}`);
      }

      // Group data by topics/categories
      const groupedData = this.groupDataByTopics(data);
      
      // Generate predictions for each topic
      const predictions = [];
      for (const [topic, topicData] of Object.entries(groupedData)) {
        const topicPredictions = this.predictTopic(topic, topicData);
        predictions.push(...topicPredictions);
      }

      // Filter predictions based on confidence threshold
      this.predictions = predictions.filter(p => 
        p.confidence >= config.analysis.confidenceThreshold
      );

      this.lastAnalysis = new Date();
      return this.predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  // Group collected data by topics using keyword analysis
  groupDataByTopics(data) {
    const topics = {
      technology: ['ai', 'tech', 'software', 'digital', 'innovation'],
      politics: ['government', 'policy', 'election', 'political'],
      economy: ['market', 'economy', 'financial', 'stock', 'trade'],
      health: ['medical', 'health', 'healthcare', 'disease', 'treatment'],
      environment: ['climate', 'environmental', 'sustainable', 'green']
    };

    const groupedData = {};

    // Initialize topic groups
    Object.keys(topics).forEach(topic => {
      groupedData[topic] = [];
    });

    // Categorize each data point
    data.forEach(item => {
      const content = (item.title + ' ' + (item.description || item.content)).toLowerCase();
      
      Object.entries(topics).forEach(([topic, keywords]) => {
        if (keywords.some(keyword => content.includes(keyword))) {
          groupedData[topic].push({
            ...item,
            relevanceScore: this.calculateRelevance(content, keywords)
          });
        }
      });
    });

    return groupedData;
  }

  // Calculate relevance score for topic categorization
  calculateRelevance(content, keywords) {
    let score = 0;
    keywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'g');
      const matches = content.match(regex);
      if (matches) {
        score += matches.length;
      }
    });
    return score / content.length * 100; // Normalize score
  }

  // Generate predictions for a specific topic
  predictTopic(topic, topicData) {
    const predictions = [];
    const now = new Date();
    
    // Sort data by date
    topicData.sort((a, b) => 
      new Date(a.publishedAt || a.createdAt) - new Date(b.publishedAt || b.createdAt)
    );

    // Analyze trends
    const trends = this.analyzeTrends(topicData);
    
    // Generate future dates for predictions
    const futureDates = Array.from({ length: config.analysis.timelineWindow.future }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() + i + 1);
      return date;
    });

    // Generate predictions for each identified trend
    trends.forEach(trend => {
      futureDates.forEach(date => {
        const prediction = this.createPrediction(topic, trend, date);
        if (prediction) {
          predictions.push(prediction);
        }
      });
    });

    return predictions;
  }

  // Analyze trends in topic data
  analyzeTrends(topicData) {
    const trends = [];
    
    // Calculate sentiment progression
    const sentiments = topicData.map(item => ({
      date: new Date(item.publishedAt || item.createdAt),
      sentiment: item.sentiment.score,
      relevance: item.relevanceScore
    }));

    // Identify trend patterns
    let currentTrend = {
      direction: null,
      strength: 0,
      duration: 0,
      dataPoints: []
    };

    sentiments.forEach((sentiment, index) => {
      if (index === 0) {
        currentTrend.direction = sentiment.sentiment > 0 ? 'positive' : 'negative';
        currentTrend.dataPoints.push(sentiment);
      } else {
        const previousSentiment = sentiments[index - 1];
        
        if ((sentiment.sentiment > 0 && currentTrend.direction === 'positive') ||
            (sentiment.sentiment < 0 && currentTrend.direction === 'negative')) {
          currentTrend.strength += Math.abs(sentiment.sentiment);
          currentTrend.duration += 1;
          currentTrend.dataPoints.push(sentiment);
        } else {
          // New trend detected
          if (currentTrend.duration > 2) { // Minimum trend duration
            trends.push({
              ...currentTrend,
              averageStrength: currentTrend.strength / currentTrend.duration
            });
          }
          
          currentTrend = {
            direction: sentiment.sentiment > 0 ? 'positive' : 'negative',
            strength: Math.abs(sentiment.sentiment),
            duration: 1,
            dataPoints: [sentiment]
          };
        }
      }
    });

    // Add last trend if significant
    if (currentTrend.duration > 2) {
      trends.push({
        ...currentTrend,
        averageStrength: currentTrend.strength / currentTrend.duration
      });
    }

    return trends;
  }

  // Create a single prediction based on trend analysis
  createPrediction(topic, trend, date) {
    const confidence = this.calculateConfidence(trend);
    
    if (confidence < config.analysis.confidenceThreshold) {
      return null;
    }

    return {
      topic,
      predictedDate: date,
      trend: {
        direction: trend.direction,
        strength: trend.averageStrength
      },
      confidence,
      details: this.generatePredictionDetails(topic, trend),
      createdAt: new Date(),
      metadata: {
        dataPoints: trend.dataPoints.length,
        trendDuration: trend.duration
      }
    };
  }

  // Calculate confidence score for a prediction
  calculateConfidence(trend) {
    // Factors affecting confidence:
    // 1. Number of data points
    // 2. Trend duration
    // 3. Trend strength consistency
    // 4. Data relevance scores

    const dataPointScore = Math.min(trend.dataPoints.length / config.analysis.minimumDataPoints, 1);
    const durationScore = Math.min(trend.duration / 30, 1); // Max 30 days
    const strengthScore = trend.averageStrength / 100;
    
    // Calculate consistency of trend
    const strengthVariance = this.calculateVariance(trend.dataPoints.map(p => p.sentiment));
    const consistencyScore = 1 - Math.min(strengthVariance, 1);

    // Weighted average of all factors
    return (
      (dataPointScore * 0.3) +
      (durationScore * 0.25) +
      (strengthScore * 0.25) +
      (consistencyScore * 0.2)
    );
  }

  // Calculate variance for consistency scoring
  calculateVariance(numbers) {
    const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const variance = numbers.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
  }

  // Generate detailed description of prediction
  generatePredictionDetails(topic, trend) {
    const trendStrength = trend.averageStrength > 7 ? 'strong' : 
                         trend.averageStrength > 4 ? 'moderate' : 'mild';
    
    const trendDirection = trend.direction === 'positive' ? 'positive' : 'negative';
    
    return {
      summary: `${trendStrength} ${trendDirection} trend in ${topic}`,
      analysis: `Based on analysis of ${trend.dataPoints.length} data points over ${trend.duration} days`,
      implications: this.generateImplications(topic, trend)
    };
  }

  // Generate potential implications of the prediction
  generateImplications(topic, trend) {
    const implications = {
      technology: {
        positive: ['Increased innovation', 'New product launches', 'Market growth'],
        negative: ['Technical challenges', 'Security concerns', 'Market saturation']
      },
      politics: {
        positive: ['Policy reforms', 'International cooperation', 'Social progress'],
        negative: ['Political tension', 'Policy gridlock', 'Social unrest']
      },
      economy: {
        positive: ['Market growth', 'Investment opportunities', 'Economic stability'],
        negative: ['Market volatility', 'Economic uncertainty', 'Investment risks']
      },
      health: {
        positive: ['Medical breakthroughs', 'Healthcare improvements', 'Public health gains'],
        negative: ['Health challenges', 'Healthcare issues', 'Public health concerns']
      },
      environment: {
        positive: ['Environmental progress', 'Sustainable solutions', 'Conservation success'],
        negative: ['Environmental challenges', 'Climate concerns', 'Resource depletion']
      }
    };

    return implications[topic][trend.direction];
  }

  // Get current predictions with optional filtering
  getPredictions(options = {}) {
    let filteredPredictions = [...this.predictions];

    if (options.topic) {
      filteredPredictions = filteredPredictions.filter(p => p.topic === options.topic);
    }

    if (options.minConfidence) {
      filteredPredictions = filteredPredictions.filter(p => p.confidence >= options.minConfidence);
    }

    if (options.dateRange) {
      filteredPredictions = filteredPredictions.filter(p => 
        p.predictedDate >= options.dateRange.start && 
        p.predictedDate <= options.dateRange.end
      );
    }

    return filteredPredictions;
  }
}

module.exports = new PredictionEngine();