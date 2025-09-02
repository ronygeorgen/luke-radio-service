import { BarChart } from 'lucide-react';
import { topicsDistribution } from '../../data/DashboardData';


const TopicsDistribution = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-8">
      <div className="flex items-center space-x-2 mb-6">
        <BarChart className="w-5 h-5 text-purple-500" />
        <h3 className="text-lg font-semibold text-gray-800">Top Topics Distribution</h3>
      </div>

      <div className="space-y-3">
        {topicsDistribution.map((topic, index) => (
          <div key={index} className="flex items-center">
            <div className="w-32 text-sm text-gray-600 text-right pr-4">
              {topic.topic}
            </div>
            <div className="flex-1 relative">
              <div className="bg-gray-200 h-6 rounded-r">
                <div 
                  className="bg-gray-400 h-6 rounded-r transition-all duration-1000 flex items-center justify-end pr-2"
                  style={{ width: `${topic.value * 100}%` }}
                >
                  {index === 0 && (
                    <div className="bg-white rounded px-2 py-1 text-xs shadow-lg">
                      <div className="font-semibold">1</div>
                      <div className="text-blue-500">Count: 140</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-4">
        <span>0</span>
        <span>0.25</span>
        <span>0.5</span>
        <span>0.75</span>
        <span>1</span>
      </div>
    </div>
  );
};

export default TopicsDistribution;