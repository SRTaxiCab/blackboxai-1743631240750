const axios = require('axios');
const schedule = require('node-schedule');
const config = require('./config');

class DataCollector {
  constructor() {
    this.collectedData = {
      news: [],
      social: []
    };
    this.lastCollection = {
      news: null,
      social: null
    };
  }

  // Initialize data collection schedules
  initializeSchedules() {
    // Schedule news collection
    schedule.scheduleJob(`*/${config.collectionIntervals.news} * * * *`, async () => {
      try {
        await this.collectNewsData();
      } catch (error) {
        console.error('News collection failed:', error);
      }
    });

    // Schedule social media collection
    schedule.scheduleJob(`*/${config.collectionIntervals.social} * * * *`, async () => {
      try {
        await this.collectSocialData();
      } catch (error) {
        console.error('Social media collection failed:', error);
      }
    });
  }

  // Collect news data from configured sources
  async collectNewsData() {
    try {
      const newsData = [];

      // Collect from News API
      const newsApiResponse = await axios.get(config.endpoints.news[0], {
        params: {
          apiKey: config.apiKeys.newsApi,
          language: 'en'
        }
      });

      if (newsApiResponse.data.articles) {
        newsData.push(...newsApiResponse.data.articles.map(article => ({
          source: 'newsapi',
          title: article.title,
          description: article.description,
          url: article.url,
          publishedAt: article.publishedAt,
          sentiment: this.analyzeSentiment(article.title + ' ' + article.description)
        })));
      }

      this.collectedData.news = [...this.collectedData.news, ...newsData];
      this.lastCollection.news = new Date();

      console.log(`Collected ${newsData.length} news articles`);
      return newsData;
    } catch (error) {
      console.error('Error collecting news data:', error);
      throw error;
    }
  }

  // Collect social media data
  async collectSocialData() {
    try {
      const socialData = [];

      // Collect Twitter data
      const twitterResponse = await axios.get(config.endpoints.social.twitter, {
        headers: {
          'Authorization': `Bearer ${config.apiKeys.twitter}`
        },
        params: {
          query: 'trending',
          'tweet.fields': 'created_at,public_metrics'
        }
      });

      if (twitterResponse.data.data) {
        socialData.push(...twitterResponse.data.data.map(tweet => ({
          source: 'twitter',
          content: tweet.text,
          createdAt: tweet.created_at,
          metrics: tweet.public_metrics,
          sentiment: this.analyzeSentiment(tweet.text)
        })));
      }

      // Collect Reddit data
      const redditResponse = await axios.get(config.endpoints.social.reddit, {
        headers: {
          'Authorization': `Bearer ${config.apiKeys.reddit}`
        }
      });

      if (redditResponse.data.data) {
        socialData.push(...redditResponse.data.data.children.map(post => ({
          source: 'reddit',
          title: post.data.title,
          content: post.data.selftext,
          createdAt: new Date(post.data.created_utc * 1000),
          metrics: {
            score: post.data.score,
            comments: post.data.num_comments
          },
          sentiment: this.analyzeSentiment(post.data.title + ' ' + post.data.selftext)
        })));
      }

      this.collectedData.social = [...this.collectedData.social, ...socialData];
      this.lastCollection.social = new Date();

      console.log(`Collected ${socialData.length} social media posts`);
      return socialData;
    } catch (error) {
      console.error('Error collecting social media data:', error);
      throw error;
    }
  }

  // Basic sentiment analysis (placeholder - should be replaced with proper NLP)
  analyzeSentiment(text) {
    const positiveWords = ['good', 'great', 'awesome', 'excellent', 'happy', 'positive'];
    const negativeWords = ['bad', 'terrible', 'awful', 'negative', 'sad', 'poor'];

    text = text.toLowerCase();
    let score = 0;

    positiveWords.forEach(word => {
      if (text.includes(word)) score += 1;
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) score -= 1;
    });

    return {
      score,
      label: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral'
    };
  }

  // Get collected data with optional filtering
  getData(options = {}) {
    const { source, startDate, endDate } = options;
    let filteredData = [];

    if (source === 'news') {
      filteredData = this.collectedData.news;
    } else if (source === 'social') {
      filteredData = this.collectedData.social;
    } else {
      filteredData = [...this.collectedData.news, ...this.collectedData.social];
    }

    if (startDate) {
      filteredData = filteredData.filter(item => 
        new Date(item.publishedAt || item.createdAt) >= new Date(startDate)
      );
    }

    if (endDate) {
      filteredData = filteredData.filter(item => 
        new Date(item.publishedAt || item.createdAt) <= new Date(endDate)
      );
    }

    return filteredData;
  }

  // Clear old data to prevent memory issues
  cleanup() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.analysis.timelineWindow.past);

    this.collectedData.news = this.collectedData.news.filter(item =>
      new Date(item.publishedAt) >= cutoffDate
    );

    this.collectedData.social = this.collectedData.social.filter(item =>
      new Date(item.createdAt) >= cutoffDate
    );
  }
}

module.exports = new DataCollector();