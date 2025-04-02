{/* Previous imports and code remain the same until the Accuracy Metrics section */}
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function Analytics() {
  // ... [Previous state and functions remain the same until the return statement]
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('30days');
  const [selectedTopic, setSelectedTopic] = useState('all');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedTopic]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const [timelineStats, predictions] = await Promise.all([
        axios.get('/api/timeline/stats'),
        axios.get('/api/predictions', {
          params: {
            topic: selectedTopic === 'all' ? undefined : selectedTopic
          }
        })
      ]);

      setData({
        stats: timelineStats.data.statistics,
        predictions: predictions.data.predictions
      });
      setError(null);
    } catch (err) {
      setError('Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  };

  const prepareConfidenceTrendData = () => {
    if (!data?.predictions) return null;

    const sortedPredictions = [...data.predictions].sort(
      (a, b) => new Date(a.predictedDate) - new Date(b.predictedDate)
    );

    return {
      labels: sortedPredictions.map(p => new Date(p.predictedDate).toLocaleDateString()),
      datasets: [{
        label: 'Prediction Confidence',
        data: sortedPredictions.map(p => p.confidence * 100),
        borderColor: '#4F46E5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.4
      }]
    };
  };

  const prepareTopicDistributionData = () => {
    if (!data?.stats?.byTopic) return null;

    return {
      labels: Object.keys(data.stats.byTopic),
      datasets: [{
        data: Object.values(data.stats.byTopic),
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#6366F1'
        ]
      }]
    };
  };

  const prepareTrendAnalysisData = () => {
    if (!data?.predictions) return null;

    const trends = data.predictions.reduce((acc, pred) => {
      const direction = pred.trend.direction;
      acc[direction] = (acc[direction] || 0) + 1;
      return acc;
    }, {});

    return {
      labels: ['Positive', 'Negative'],
      datasets: [{
        label: 'Trend Distribution',
        data: [trends.positive || 0, trends.negative || 0],
        backgroundColor: ['#10B981', '#EF4444']
      }]
    };
  };

  const calculateAccuracyMetrics = () => {
    if (!data?.predictions) return null;

    const total = data.predictions.length;
    const highConfidence = data.predictions.filter(p => p.confidence >= 0.8).length;
    const mediumConfidence = data.predictions.filter(p => p.confidence >= 0.6 && p.confidence < 0.8).length;
    const lowConfidence = data.predictions.filter(p => p.confidence < 0.6).length;

    return {
      total,
      highConfidence: (highConfidence / total) * 100,
      mediumConfidence: (mediumConfidence / total) * 100,
      lowConfidence: (lowConfidence / total) * 100
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Detailed analysis and insights from prediction data
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Time Range</label>
            <select
              className="mt-1 select"
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
            >
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <select
              className="mt-1 select"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">All Topics</option>
              <option value="technology">Technology</option>
              <option value="politics">Politics</option>
              <option value="economy">Economy</option>
              <option value="health">Health</option>
              <option value="environment">Environment</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <i className="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-blue-500 rounded-md">
                  <i className="fas fa-chart-line text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Predictions</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data?.predictions?.length || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-green-500 rounded-md">
                  <i className="fas fa-bullseye text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. Confidence</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Math.round(data?.stats?.averageConfidence * 100)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-yellow-500 rounded-md">
                  <i className="fas fa-tags text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active Topics</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {Object.keys(data?.stats?.byTopic || {}).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 p-3 bg-purple-500 rounded-md">
                  <i className="fas fa-clock text-white text-xl"></i>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Prediction Window</p>
                  <p className="text-2xl font-semibold text-gray-900">{timeRange}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Confidence Trend */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Confidence Trend</h2>
              <div className="h-80">
                <Line
                  data={prepareConfidenceTrendData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        title: {
                          display: true,
                          text: 'Confidence (%)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Topic Distribution */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Topic Distribution</h2>
              <div className="h-80">
                <Doughnut
                  data={prepareTopicDistributionData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom'
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Trend Analysis */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Trend Analysis</h2>
              <div className="h-80">
                <Bar
                  data={prepareTrendAnalysisData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true
                      }
                    }
                  }}
                />
              </div>
            </div>

            {/* Accuracy Metrics */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Accuracy Metrics</h2>
              <div className="space-y-4">
                {calculateAccuracyMetrics() && (
                  <>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">High Confidence (&ge;80%)</span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(calculateAccuracyMetrics().highConfidence)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${calculateAccuracyMetrics().highConfidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Medium Confidence (60-79%)</span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(calculateAccuracyMetrics().mediumConfidence)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full"
                          style={{ width: `${calculateAccuracyMetrics().mediumConfidence}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">Low Confidence (&lt;60%)</span>
                        <span className="text-sm font-medium text-gray-700">
                          {Math.round(calculateAccuracyMetrics().lowConfidence)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full"
                          style={{ width: `${calculateAccuracyMetrics().lowConfidence}%` }}
                        ></div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Popular Tags */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Tags</h2>
            <div className="flex flex-wrap gap-2">
              {data?.stats?.topTags.map((tag) => (
                <span
                  key={tag.tag}
                  className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
                >
                  {tag.tag}
                  <span className="ml-2 text-indigo-600">{tag.count}</span>
                </span>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Analytics;