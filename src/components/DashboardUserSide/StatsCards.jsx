import { MessageSquare, TrendingUp, Users, Clock } from 'lucide-react';
import { useDashboard } from '../../hooks/useDashboard';

const StatsCards = () => {
  const { stats = {}, loading } = useDashboard();

  const statsData = [
    {
      title: 'Total Transcriptions',
      value: loading ? '...' : (stats.totalTranscriptions || 0).toLocaleString(),
      icon: MessageSquare,
      bgColor: 'bg-blue-500',
      textColor: 'text-white'
    },
    {
      title: 'Avg Sentiment Score',
      value: loading ? '...' : stats.avgSentimentScore || 0,
      icon: TrendingUp,
      bgColor: 'bg-green-500',
      textColor: 'text-white'
    },
    {
      title: 'Unique Topics',
      value: loading ? '...' : stats.uniqueTopics || 0,
      icon: Users,
      bgColor: 'bg-purple-500',
      textColor: 'text-white'
    },
    {
      title: 'Active Shifts',
      value: loading ? '...' : stats.activeShifts || 0,
      icon: Clock,
      bgColor: 'bg-orange-500',
      textColor: 'text-white'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statsData.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <div
            key={index}
            className={`${stat.bgColor} ${stat.textColor} rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </div>
              <IconComponent className="w-8 h-8 opacity-80" />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;