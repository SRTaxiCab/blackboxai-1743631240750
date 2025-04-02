import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    topic: '',
    minConfidence: 0.5,
    timeframe: '7days'
  });
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchPredictions();
  }, [filters]);

  const fetchPredictions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/predictions', {
        params: {
          topic: filters.topic || undefined,
          minConfidence: filters.minConfidence,
          dateRange: getDateRange()
        }
      });
      setPredictions(response.data.predictions);
      setError(null);
    } catch (err) {
      setError('Failed to fetch predictions');
    } finally {
      setLoading(false);
    }
  };

  const generateNewPredictions = async () => {
    try {
      setGenerating(true);
      await axios.post('/api/predict');
      await fetchPredictions();
    } catch (err) {
      setError('Failed to generate new predictions');
    } finally {
      setGenerating(false);
    }
  };

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();
    
    switch (filters.timeframe) {
      case '7days':
        start.setDate(start.getDate() - 7);
        break;
      case '30days':
        start.setDate(start.getDate() - 30);
        break;
      case '90days':
        start.setDate(start.getDate() - 90);
        break;
      default:
        start.setDate(start.getDate() - 7);
    }

    return { start, end };
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const prepareChartData = () => {
    const topics = [...new Set(predictions.map(p => p.topic))];
    const datasets = topics.map((topic, index) => {
      const topicPredictions = predictions.filter(p => p.topic === topic);
      return {
        label: topic,
        data: topicPredictions.map(p => p.confidence * 100),
        borderColor: [
          '#4F46E5',
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#6366F1'
        ][index % 5],
        tension: 0.4
      };
    });

    return {
      labels: predictions
        .map(p => new Date(p.predictedDate).toLocaleDateString())
        .filter((date, index, self) => self.indexOf(date) === index),
      datasets
    };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Predictions</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and analyze future predictions based on collected data
            </p>
          </div>
          <button
            className="btn"
            onClick={generateNewPredictions}
            disabled={generating}
          >
            {generating ? (
              <>
                <div className="spinner w-4 h-4 mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic mr-2"></i>
                Generate New Predictions
              </>
            )}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Topic</label>
            <select
              className="mt-1 select"
              value={filters.topic}
              onChange={(e) => setFilters(prev => ({ ...prev, topic: e.target.value }))}
            >
              <option value="">All Topics</option>
              <option value="technology">Technology</option>
              <option value="politics">Politics</option>
              <option value="economy">Economy</option>
              <option value="health">Health</option>
              <option value="environment">Environment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Minimum Confidence</label>
            <input
              type="range"
              min="0"
              max="100"
              className="mt-1 w-full"
              value={filters.minConfidence * 100}
              onChange={(e) => setFilters(prev => ({ ...prev, minConfidence: e.target.value / 100 }))}
            />
            <div className="text-sm text-gray-500 text-center">
              {Math.round(filters.minConfidence * 100)}%
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Timeframe</label>
            <select
              className="mt-1 select"
              value={filters.timeframe}
              onChange={(e) => setFilters(prev => ({ ...prev, timeframe: e.target.value }))}
            >
              <option value="7days">Next 7 Days</option>
              <option value="30days">Next 30 Days</option>
              <option value="90days">Next 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Confidence Trend Chart */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Prediction Confidence Trends</h2>
        {predictions.length > 0 && (
          <div className="h-80">
            <Line
              data={prepareChartData()}
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
                },
                plugins: {
                  legend: {
                    position: 'bottom'
                  }
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Predictions List */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Detailed Predictions</h2>
        
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
          <div className="space-y-4">
            {predictions.map((prediction) => (
              <div
                key={prediction.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{prediction.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{prediction.details.summary}</p>
                  </div>
                  <span className={`text-lg font-semibold ${getConfidenceColor(prediction.confidence)}`}>
                    {Math.round(prediction.confidence * 100)}%
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Analysis</h4>
                    <p className="mt-1 text-sm text-gray-600">{prediction.details.analysis}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">Implications</h4>
                    <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                      {prediction.details.implications.map((implication, index) => (
                        <li key={index}>{implication}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500">
                      <i className="far fa-calendar mr-1"></i>
                      {new Date(prediction.predictedDate).toLocaleDateString()}
                    </span>
                    <span className="text-sm text-gray-500">
                      <i className="fas fa-tag mr-1"></i>
                      {prediction.topic}
                    </span>
                    <span className={`badge ${
                      prediction.trend.direction === 'positive' ? 'badge-green' : 'badge-red'
                    }`}>
                      {prediction.trend.direction} trend
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    Based on {prediction.metadata.dataPoints} data points
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Predictions;