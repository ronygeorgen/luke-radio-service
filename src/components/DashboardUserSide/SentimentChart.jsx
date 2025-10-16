import React, { useState, useMemo, useRef } from 'react';
import { TrendingUp } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';
import Shimmer from './Shimmer';

const SentimentChart = ({ isLoading = false }) => {
  const { sentimentData, loading } = useDashboard();
  const chartRef = useRef(null);
  const [tooltip, setTooltip] = useState({
    x: 0,
    y: 0,
    date: '',
    sentiment: 0,
    visible: false
  });

  // Function to parse DD/MM/YYYY format
  const parseDate = (dateString) => {
    if (!dateString) return new Date();
    
    // Handle DD/MM/YYYY format from API
    const parts = dateString.split('/');
    if (parts.length === 3) {
      // Note: months are 0-indexed in JavaScript Date
      return new Date(parts[2], parts[1] - 1, parts[0]);
    }
    
    // Fallback to default Date parsing
    return new Date(dateString);
  };

  // Format date for display
  const formatDate = (dateString, options = {}) => {
    const date = parseDate(dateString);
    const defaultOptions = {
      month: 'short',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
  };

  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    if (!sentimentData || sentimentData.length === 0) return null;

    const width = sentimentData.length * 80;
    const height = 200;
    const padding = { top: 20, right: 60, bottom: 40, left: 60 };
    
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Calculate data ranges
    const sentimentValues = sentimentData.map(d => d.sentiment);
    const minSentiment = Math.min(...sentimentValues);
    const maxSentiment = Math.max(...sentimentValues);
    const sentimentRange = maxSentiment - minSentiment;
    
    // Add some padding to the range for better visualization
    const rangePadding = sentimentRange * 0.1;
    const yMin = Math.max(0, minSentiment - rangePadding);
    const yMax = Math.min(100, maxSentiment + rangePadding);
    const yRange = yMax - yMin;

    // Calculate point positions
    const points = sentimentData.map((point, index) => {
      // Calculate x position to use full available width
      const x = padding.left + (index / Math.max(1, sentimentData.length - 1)) * chartWidth;
      const y = padding.top + chartHeight - ((point.sentiment - yMin) / yRange) * chartHeight;
      return { ...point, x, y };
    });

    // Generate y-axis labels
    const yLabels = [];
    const labelCount = 5;
    for (let i = 0; i < labelCount; i++) {
      const value = yMin + (yRange / (labelCount - 1)) * i;
      const y = padding.top + chartHeight - (i / (labelCount - 1)) * chartHeight;
      yLabels.push({ value: Math.round(value * 10) / 10, y });
    }

    return {
      points,
      yLabels,
      width,
      height,
      padding,
      chartWidth,
      chartHeight,
      yMin,
      yMax
    };
  }, [sentimentData]);

  const handleMouseMove = (event, point) => {
    const container = chartRef.current;
    const rect = container ? container.getBoundingClientRect() : event.currentTarget.getBoundingClientRect();
    setTooltip({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      date: point.date,
      sentiment: point.sentiment,
      visible: true
    });
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  if (isLoading || loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">Sentiment Analysis Over Time</h3>
        </div>
        <Shimmer type="chart" />
      </div>
    );
  }

  if (!sentimentData || sentimentData.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-800">Sentiment Analysis Over Time</h3>
        </div>
        <div className="h-64 flex items-center justify-center text-gray-500">
          No sentiment data available for the selected period
        </div>
      </div>
    );
  }

  if (!chartData) return null;

  const { points, yLabels, width, height, padding } = chartData;

  // Create path for line
  const linePath = points.map((point, index) => 
    `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
  ).join(' ');

  // Create path for area fill
  const areaPath = `M ${points[0].x} ${height - padding.bottom} L ${points.map(p => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${height - padding.bottom} Z`;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 relative">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Sentiment Analysis Over Time</h3>
      </div>

      <div ref={chartRef} className="relative h-64">
        <svg 
          className="w-full h-full" 
          viewBox={`0 0 ${width} ${height}`}
          onMouseLeave={handleMouseLeave}
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="28" patternUnits="userSpaceOnUse">
              <path 
                d={`M 40 0 L 0 0 0 28`} 
                fill="none" 
                stroke="rgb(248 250 252)" 
                strokeWidth="1"
              />
            </pattern>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.2"/>
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.05"/>
            </linearGradient>
          </defs>
          
          {/* Grid background */}
          <rect 
            x={padding.left} 
            y={padding.top} 
            width={chartData.chartWidth} 
            height={chartData.chartHeight} 
            fill="url(#grid)" 
          />

          {/* Y-axis */}
          <line 
            x1={padding.left} 
            y1={padding.top} 
            x2={padding.left} 
            y2={height - padding.bottom} 
            stroke="rgb(229 231 235)" 
            strokeWidth="1"
          />

          {/* X-axis */}
          <line 
            x1={padding.left} 
            y1={height - padding.bottom} 
            x2={width - padding.right} 
            y2={height - padding.bottom} 
            stroke="rgb(229 231 235)" 
            strokeWidth="1"
          />

          {/* Y-axis labels and horizontal grid lines */}
          {yLabels.map((label, index) => (
            <g key={index}>
              <line
                x1={padding.left}
                y1={label.y}
                x2={width - padding.right}
                y2={label.y}
                stroke="rgb(243 244 246)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={padding.left - 10}
                y={label.y + 4}
                className="text-xs fill-gray-500"
                textAnchor="end"
              >
                {label.value}
              </text>
            </g>
          ))}

          {/* X-axis labels - positioned exactly at each data point */}
          {points.map((point, index) => (
            <text
              key={index}
              x={point.x}
              y={height - padding.bottom / 2}
              className="text-xs fill-gray-500"
              textAnchor="middle"
            >
              {formatDate(point.date)}
            </text>
          ))}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#sentimentGradient)"
          />

          {/* Main line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points with hover areas */}
          {points.map((point, index) => (
            <g key={index}>
              {/* Invisible hover area */}
              <circle
                cx={point.x}
                cy={point.y}
                r="12"
                fill="transparent"
                className="cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, point)}
              />
              {/* Visible point */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="white"
                stroke="rgb(59 130 246)"
                strokeWidth="2"
                className="hover:r-6 transition-all duration-200 cursor-pointer"
                onMouseMove={(e) => handleMouseMove(e, point)}
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {tooltip.visible && (
          <div 
            className="absolute pointer-events-none z-10 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg"
            style={{ 
              left: `${tooltip.x + 12}px`, 
              top: `${tooltip.y + 12}px`,
              fontSize: '12px'
            }}
          >
            <div className="font-medium">
              {formatDate(tooltip.date, { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-blue-300">
              Sentiment: {tooltip.sentiment.toFixed(1)}%
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>

      {/* Legend and stats */}
      <div className="flex items-center justify-between mt-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Sentiment Score</span>
        </div>
        <div className="text-sm text-gray-500">
          Avg: {(sentimentData.reduce((sum, d) => sum + d.sentiment, 0) / sentimentData.length).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;