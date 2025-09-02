import { TrendingUp } from 'lucide-react';
import { sentimentByShift } from '../../data/dashboardData';

const SentimentByShiftChart = () => {
  const maxValue = Math.max(...sentimentByShift.map(d => d.value));

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Sentiment by Shift</h3>
      </div>

      <div className="relative h-64">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {/* Grid lines */}
          <defs>
            <pattern id="shiftGrid" width="40" height="25" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 25" fill="none" stroke="rgb(243 244 246)" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#shiftGrid)" />

          {/* Y-axis labels */}
          <text x="10" y="20" className="text-xs fill-gray-500">75</text>
          <text x="10" y="70" className="text-xs fill-gray-500">50</text>
          <text x="10" y="120" className="text-xs fill-gray-500">25</text>
          <text x="10" y="170" className="text-xs fill-gray-500">0</text>

          {/* Bars */}
          {sentimentByShift.map((item, index) => {
            const barHeight = (item.value / maxValue) * 140;
            const barWidth = 60;
            const x = 60 + (index * 100);
            const y = 160 - barHeight;

            return (
              <g key={index}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#1f2937"
                  rx="4"
                  className="hover:fill-gray-600 transition-colors duration-200"
                />
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 font-medium"
                >
                  {item.value}
                </text>
              </g>
            );
          })}
        </svg>

        {/* X-axis labels */}
        <div className="flex justify-center space-x-8 mt-4">
          {sentimentByShift.map((item, index) => (
            <span key={index} className="text-xs text-gray-500 transform -rotate-45 origin-center">
              {item.shift}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SentimentByShiftChart;