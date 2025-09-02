import { Users } from 'lucide-react';
import { topTopicsByShift } from '../../data/DashboardData';

const TopTopicsByShift = () => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">Top Topics by Shift</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Morning Shift */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-4 text-center">Morning Shift (6AM-2PM)</h4>
          <div className="space-y-3">
            {topTopicsByShift.morning.map((item) => (
              <div key={item.rank} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">{item.rank}.</span>
                  <span className="text-sm text-gray-900">{item.topic}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Afternoon Shift */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-4 text-center">Afternoon Shift (2PM-10PM)</h4>
          <div className="space-y-3">
            {topTopicsByShift.afternoon.map((item) => (
              <div key={item.rank} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">{item.rank}.</span>
                  <span className="text-sm text-gray-900">{item.topic}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Night Shift */}
        <div>
          <h4 className="font-semibold text-gray-700 mb-4 text-center">Night Shift (10PM-6AM)</h4>
          <div className="space-y-3">
            {topTopicsByShift.night.map((item) => (
              <div key={item.rank} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-500">{item.rank}.</span>
                  <span className="text-sm text-gray-900">{item.topic}</span>
                </div>
                <span className="text-sm font-semibold text-gray-700">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTopicsByShift;