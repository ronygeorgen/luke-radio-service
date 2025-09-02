import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { topTopicsRanking } from '../../data/DashboardData';

const TopTopicsTable = () => {
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <div className="flex items-center space-x-2 mb-6">
        <div className="w-5 h-5 text-orange-500">👥</div>
        <h3 className="text-lg font-semibold text-gray-800">Top 10 Topics Ranking</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-sm text-gray-500 border-b">
              <th className="pb-3">#</th>
              <th className="pb-3">Topic</th>
              <th className="pb-3 text-right">Count</th>
              <th className="pb-3 text-right">%</th>
              <th className="pb-3 text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topTopicsRanking.map((item) => (
              <tr key={item.rank} className="hover:bg-gray-50 transition-colors duration-200">
                <td className="py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-white ${
                    item.rank <= 3 ? 'bg-blue-500' : 'bg-gray-400'
                  }`}>
                    {item.rank}
                  </div>
                </td>
                <td className="py-4 font-medium text-gray-900">{item.topic}</td>
                <td className="py-4 text-right font-medium">{item.count}</td>
                <td className="py-4 text-right text-gray-600">{item.percentage}%</td>
                <td className="py-4 text-right">{getTrendIcon(item.trend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopTopicsTable;