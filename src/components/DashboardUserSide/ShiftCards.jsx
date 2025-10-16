import { Clock } from 'lucide-react';
import { useSelector } from 'react-redux';

const ShiftCards = () => {
  const shiftAnalytics = useSelector((state) => state.shiftAnalytics.data);
  
  if (!shiftAnalytics || !shiftAnalytics.shiftData) {
    return <div>Loading shift data...</div>;
  }

  const shifts = Object.values(shiftAnalytics.shiftData).map((shift) => ({
    ...shift,
    icon: Clock,
    bgColor: 'bg-white',
    borderColor: 'border-gray-200'
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {shifts.map((shift, index) => {
        const IconComponent = shift.icon;
        return (
          <div
            key={index}
            className={`${shift.bgColor} ${shift.borderColor} border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <IconComponent className="w-5 h-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-gray-800">{shift.title}</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total</span>
                <span className="text-2xl font-bold text-gray-900">{shift.total}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Avg Sentiment</span>
                <span className="text-xl font-semibold text-green-500">{shift.avgSentiment}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Top Topic</span>
                <span className="text-lg font-medium text-gray-900">{shift.topTopic}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ShiftCards;