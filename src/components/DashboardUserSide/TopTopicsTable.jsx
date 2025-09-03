import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';

const TopTopicsTable = () => {
  const { topTopicsRanking, loading } = useDashboard();

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

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-5 h-5 text-orange-500">👥</div>
          <h3 className="text-lg font-semibold text-gray-800">Top 10 Topics Ranking</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex items-center space-x-4 py-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!topTopicsRanking || topTopicsRanking.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-2 mb-6">
          <div className="w-5 h-5 text-orange-500">👥</div>
          <h3 className="text-lg font-semibold text-gray-800">Top 10 Topics Ranking</h3>
        </div>
        <div className="text-center text-gray-500 py-8">
          No ranking data available
        </div>
      </div>
    );
  }

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
              {/* <th className="pb-3 text-right">Trend</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {topTopicsRanking.slice(0, 10).map((item) => (
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
                {/* <td className="py-4 text-right">{getTrendIcon(item.trend)}</td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopTopicsTable;