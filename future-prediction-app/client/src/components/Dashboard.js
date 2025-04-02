import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentPredictions, setRecentPredictions] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, predictionsResponse] = await Promise.all([
          axios.get('/api/timeline/stats'),
          axios.get('/api/predictions?limit=5')
        ]);

        setStats(statsResponse.data.statistics);
        setRecentPredictions(predictionsResponse.data.predictions);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <i className="fas fa-exclamation-circle text-red-400"></i>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const topicChartData = {
    labels: Object.keys(stats?.byTopic || {}),
    datasets: [
      {
        data: Object.values(stats?.byTopic || {}),
        backgroundColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#6366F1'
        ],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">Future Prediction Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Monitor predictions, analyze trends, and explore future insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-blue-500 rounded-md">
              <i className="fas fa-chart-line text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Events</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-green-500 rounded-md">
              <i className="fas fa-crystal-ball text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Predictions</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.byType?.prediction || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-yellow-500 rounded-md">
              <i className="fas fa-history text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Historical Events</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.byType?.historical || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0 p-3 bg-purple-500 rounded-md">
              <i className="fas fa-bullseye text-white text-xl"></i>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Confidence</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(stats?.averageConfidence * 100)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Recent Predictions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topic Distribution Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Topic Distribution</h2>
          <div className="h-64">
            <Doughnut
              data={topicChartData}
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

        {/* Recent Predictions */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Recent Predictions</h2>
            <Link
              to="/predictions"
              className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentPredictions.map((prediction) => (
              <div
                key={prediction.id}
                className="border-l-4 border-indigo-400 bg-indigo-50 p-4 rounded-r-lg"
              >
                <div className="flex justify-between">
                  <p className="text-sm font-medium text-gray-900">{prediction.title}</p>
                  <span className="badge badge-blue">
                    {Math.round(prediction.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="mt-1 text-sm text-gray-600">{prediction.details.summary}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    Predicted for: {new Date(prediction.predictedDate).toLocaleDateString()}
                  </span>
                  <span className={`badge ${
                    prediction.trend.direction === 'positive' ? 'badge-green' : 'badge-red'
                  }`}>
                    {prediction.trend.direction}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Tags */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Popular Tags</h2>
        <div className="flex flex-wrap gap-2">
          {stats?.topTags.map((tag) => (
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
    </div>
  );
}

export default Dashboard;