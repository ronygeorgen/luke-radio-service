import { useEffect, useState } from 'react';

const TopTopicsSlide = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Reset and trigger animations with delay
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const dummyData = {
    topTopicsTime: [
      { name: 'COLLABORATION', count: 26, percentage: 42 },
      { name: 'COLD CASE', count: 22, percentage: 42 },
      { name: 'WEDDING', count: 21, percentage: 42 },
      { name: 'FAMILY', count: 18, percentage: 42 },
      { name: 'CHRISTMAS', count: 16, percentage: 42 },
      { name: 'MELBOURNE CUP', count: 14, percentage: 42 },
      { name: 'NEW MUSIC', count: 12, percentage: 42 },
      { name: 'COMMUNICATION', count: 11, percentage: 42 },
      { name: 'MENTAL HEALTH', count: 10, percentage: 42 },
      { name: 'COMMUNITY', count: 9, percentage: 42 },
    ],
    topTopicsNumber: [
      { name: 'COLLABORATION', count: 9 },
      { name: 'COLD CASE', count: 7 },
      { name: 'WEDDING', count: 6 },
      { name: 'FAMILY', count: 6 },
      { name: 'CHRISTMAS', count: 6 },
      { name: 'MELBOURNE CUP', count: 6 },
      { name: 'NEW MUSIC', count: 6 },
      { name: 'COMMUNICATION', count: 5 },
      { name: 'MENTAL HEALTH', count: 5 },
      { name: 'COMMUNITY', count: 4 },
    ],
  };

  // Calculate max count for proper scaling
  const maxTopicCount = Math.max(...dummyData.topTopicsNumber.map(topic => topic.count));

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Top Topics Distribution</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Top 10 Topics (Time) */}
          <div 
            className="bg-gray-700 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6">Top 10 Topics (Time)</h3>
            <div className="space-y-3">
              {dummyData.topTopicsTime.map((topic, index) => {
                const baseDelay = 200 + (index * 100);
                return (
                <div
                  key={topic.name}
                  className="flex items-center space-x-4 transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${baseDelay}ms`,
                  }}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index < 3 ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-2 border-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white font-medium">{topic.name}</span>
                      <span className="text-white text-sm">({topic.count})</span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: isVisible ? `${topic.percentage}%` : '0%',
                          transitionDelay: `${baseDelay + 200}ms`,
                        }}
                      />
                    </div>
                    <span className="text-white text-xs mt-1">{topic.percentage}%</span>
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* Right Panel - Top 10 Topics # */}
          <div 
            className="bg-teal-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Top 10 Topics #</h3>
              <button className="px-3 py-1 bg-black text-white rounded-lg text-sm font-medium">
                By Time
              </button>
            </div>
            <div className="h-96">
              <div className="flex flex-col h-full justify-between">
                {dummyData.topTopicsNumber.map((topic, index) => {
                  const baseDelay = 400 + (index * 100);
                  return (
                  <div
                    key={topic.name}
                    className="flex items-center space-x-4 transition-all duration-700"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transform: isVisible ? 'translateX(0)' : 'translateX(20px)',
                      transitionDelay: `${baseDelay}ms`,
                    }}
                  >
                    <span className="text-sm font-medium text-gray-700 w-32">{topic.name}</span>
                    <div className="flex-1 flex items-center">
                      <div
                        className="bg-teal-500 h-8 rounded transition-all duration-1000"
                        style={{
                          width: isVisible ? `${(topic.count / maxTopicCount) * 100}%` : '0%',
                          transitionDelay: `${baseDelay + 200}ms`,
                        }}
                      />
                      <span className="ml-2 text-sm font-bold text-gray-900">{topic.count}</span>
                    </div>
                  </div>
                );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopTopicsSlide;


