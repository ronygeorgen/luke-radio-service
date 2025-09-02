import { dashboardStats } from "../../data/DashboardData";

const SentimentGauge = () => {
  const sentimentValue = dashboardStats.avgSentimentScore;
  const percentage = sentimentValue;
  const strokeDasharray = `${percentage * 2.51} 251`;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">Average Sentiment</h3>
      
      <div className="flex flex-col items-center">
        <div className="relative w-40 h-40 mb-6">
          <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgb(229 231 235)"
              strokeWidth="8"
              fill="transparent"
              className="opacity-30"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="rgb(34 197 94)"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-12 bg-gray-800 rounded-full transform rotate-45" 
                 style={{ transform: `rotate(${(percentage / 100) * 180 - 90}deg)` }} />
          </div>
        </div>

        <div className="flex justify-between w-full text-sm text-gray-500 mb-4">
          <div className="text-center">
            <p>Low</p>
            <p>0</p>
          </div>
          <div className="text-center">
            <p>High</p>
            <p>100</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-3xl font-bold text-green-500 mb-1">{sentimentValue}</p>
          <p className="text-sm text-gray-600">Average {sentimentValue}</p>
        </div>
      </div>
    </div>
  );
};

export default SentimentGauge;