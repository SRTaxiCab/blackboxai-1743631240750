import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

function Timeline() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    tags: [],
    minRelevance: 0,
    minConfidence: 0
  });

  useEffect(() => {
    fetchTimelineEvents();
  }, [filters]);

  const fetchTimelineEvents = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        type: filters.type === 'all' ? undefined : filters.type,
        tags: filters.tags.join(',')
      };

      const response = await axios.get('/api/timeline', { params });
      setEvents(response.data.events);
      setError(null);
    } catch (err) {
      setError('Failed to fetch timeline events');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const getEventIcon = (type, trend) => {
    if (type === 'historical') {
      return <i className="fas fa-history text-blue-500"></i>;
    }
    return trend?.direction === 'positive' 
      ? <i className="fas fa-arrow-trend-up text-green-500"></i>
      : <i className="fas fa-arrow-trend-down text-red-500"></i>;
  };

  const getEventColor = (type, trend) => {
    if (type === 'historical') return 'border-blue-200 bg-blue-50';
    return trend?.direction === 'positive' 
      ? 'border-green-200 bg-green-50'
      : 'border-red-200 bg-red-50';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900">Timeline</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track historical events and future predictions chronologically
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Type</label>
            <select
              className="mt-1 select"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">All Events</option>
              <option value="historical">Historical</option>
              <option value="prediction">Predictions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              className="mt-1 input"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              className="mt-1 input"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Min. Confidence</label>
            <input
              type="range"
              min="0"
              max="100"
              className="mt-1 w-full"
              value={filters.minConfidence * 100}
              onChange={(e) => handleFilterChange('minConfidence', e.target.value / 100)}
            />
            <div className="text-sm text-gray-500 text-center">
              {Math.round(filters.minConfidence * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white shadow rounded-lg p-6">
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
          <div className="timeline-container">
            <div className="timeline-line"></div>
            {events.map((event, index) => (
              <div
                key={event.id}
                className={`timeline-item mb-8 ${
                  index % 2 === 0 ? 'md:flex-row-reverse' : ''
                }`}
              >
                <div className={`relative flex items-center ${
                  index % 2 === 0 ? 'md:justify-start' : 'md:justify-end'
                }`}>
                  <div className={`
                    w-full md:w-1/2 p-4 rounded-lg border ${getEventColor(event.type, event.trend)}
                    ${index % 2 === 0 ? 'md:ml-8' : 'md:mr-8'}
                  `}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        {getEventIcon(event.type, event.trend)}
                        <span className="ml-2 text-sm font-medium text-gray-900">
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {event.type === 'prediction' && (
                        <span className="badge badge-blue">
                          {Math.round(event.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-medium text-gray-900">{event.title}</h3>
                    <p className="mt-1 text-sm text-gray-600">{event.description}</p>

                    {event.implications && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-gray-900">Implications:</h4>
                        <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                          {event.implications.map((implication, i) => (
                            <li key={i}>{implication}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2">
                      {event.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {event.links && event.links.length > 0 && (
                      <div className="mt-3 text-sm">
                        <a
                          href={event.links[0].url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-500"
                        >
                          View Source <i className="fas fa-external-link-alt ml-1"></i>
                        </a>
                      </div>
                    )}
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

export default Timeline;