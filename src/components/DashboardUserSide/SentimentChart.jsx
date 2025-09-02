import { TrendingUp } from 'lucide-react';
import { sentimentData } from '../../data/dashboardData';

const SentimentChart = () => {
  const maxValue = Math.max(...sentimentData.map(d => d.sentiment));
  const minValue = Math.min(...sentimentData.map(d => d.sentiment));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Sentiment Analysis Over Time</h3>
      </div>

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="25" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 25" fill="none" stroke="rgb(243 244 246)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Y-axis labels */}
          <text x="10" y="20" className="text-xs fill-gray-500">100</text>
          <text x="10" y="70" className="text-xs fill-gray-500">75</text>
          <text x="10" y="120" className="text-xs fill-gray-500">50</text>
          <text x="10" y="170" className="text-xs fill-gray-500">25</text>
          <text x="10" y="195" className="text-xs fill-gray-500">0</text>

          {/* Chart area */}
          <defs>
            <linearGradient id="sentimentGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgb(59 130 246)" stopOpacity="0.3"/>
              <stop offset="100%" stopColor="rgb(59 130 246)" stopOpacity="0.1"/>
            </linearGradient>
          </defs>

          {/* Line path */}
          <path
            d={`M 50 ${200 - ((sentimentData[0].sentiment - 25) / 75) * 180} ${sentimentData.map((point, index) => 
              `L ${50 + (index * 80)} ${200 - ((point.sentiment - 25) / 75) * 180}`
            ).join(' ')}`}
            fill="none"
            stroke="rgb(59 130 246)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Fill area */}
          <path
            d={`M 50 200 ${sentimentData.map((point, index) => 
              `L ${50 + (index * 80)} ${200 - ((point.sentiment - 25) / 75) * 180}`
            ).join(' ')} L ${50 + ((sentimentData.length - 1) * 80)} 200 Z`}
            fill="url(#sentimentGradient)"
          />

          {/* Data points */}
          {sentimentData.map((point, index) => (
            <circle
              key={index}
              cx={50 + (index * 80)}
              cy={200 - ((point.sentiment - 25) / 75) * 180}
              r="4"
              fill="rgb(59 130 246)"
              className="hover:r-6 transition-all duration-200"
            />
          ))}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-between mt-4 px-12">
          {sentimentData.map((point, index) => (
            <span key={index} className="text-xs text-gray-500">{point.date}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center mt-4">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">sentiment</span>
        </div>
      </div>
    </div>
  );
};

export default SentimentChart;