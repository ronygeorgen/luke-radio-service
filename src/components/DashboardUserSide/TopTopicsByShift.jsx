import { Users } from 'lucide-react';
import { useSelector } from 'react-redux';

const TopTopicsByShift = () => {
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics.data);
  
  if (!shiftAnalytics || !shiftAnalytics.topTopicsByShift) {
    return <div>Loading topics data...</div>;
  }

  const topicsByShift = shiftAnalytics.topTopicsByShift;
  const shiftEntries = Object.entries(topicsByShift);
  const getTitle = (key) => shiftAnalytics?.shiftData?.[key]?.title || key;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <Users className="w-5 h-5 text-orange-500" />
        <h3 className="text-lg font-semibold text-gray-800">Top Topics by Shift</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shiftEntries.map(([key, items]) => (
          <div key={key}>
            <h4 className="font-semibold text-gray-700 mb-4 text-center">{getTitle(key)}</h4>
            <div className="space-y-3">
              {items && items.length > 0 ? (
                items.map((item) => (
                  <div key={item.rank} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500">{item.rank}.</span>
                      <span className="text-sm text-gray-900">{item.topic}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center">No data available</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopTopicsByShift;