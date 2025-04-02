require('dotenv').config();

const config = {
  // Server configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // API endpoints for data collection
  endpoints: {
    news: [
      'https://newsapi.org/v2/top-headlines',
      'https://api.mediastack.com/v1/news'
    ],
    social: {
      twitter: 'https://api.twitter.com/2/tweets/search/recent',
      reddit: 'https://oauth.reddit.com/r/all/hot'
    }
  },

  // Data collection intervals (in minutes)
  collectionIntervals: {
    news: 60,    // Collect news every hour
    social: 30   // Collect social media data every 30 minutes
  },

  // Analysis configuration
  analysis: {
    timelineWindow: {
      past: 30,    // Days of historical data to consider
      future: 7    // Days to predict into the future
    },
    confidenceThreshold: 0.75,  // Minimum confidence score for predictions
    minimumDataPoints: 100      // Minimum data points needed for analysis
  },

  // API Keys (should be moved to .env in production)
  apiKeys: {
    newsApi: process.env.NEWS_API_KEY || 'dummy_news_api_key',
    twitter: process.env.TWITTER_API_KEY || 'dummy_twitter_api_key',
    reddit: process.env.REDDIT_API_KEY || 'dummy_reddit_api_key'
  },

  // Cache configuration
  cache: {
    ttl: 3600,     // Time to live in seconds
    checkPeriod: 600  // Cleanup period in seconds
  },

  // Logging configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    filename: 'app.log'
  }
};

module.exports = config;