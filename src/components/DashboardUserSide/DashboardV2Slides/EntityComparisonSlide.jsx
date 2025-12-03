import { useEffect, useState } from 'react';
import { Radio, Mic, Heart } from 'lucide-react';

const EntityComparisonSlide = () => {
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
    entities: ['Lucy and Kel', 'Mornings', 'The Daily', 'Rob and Shay'],
    topics: [
      { name: 'COLLABORATION', count: 28 },
      { name: 'COLD CASE', count: 22 },
      { name: 'WEDDING', count: 21 },
      { name: 'FAMILY', count: 18 },
      { name: 'CHRISTMAS', count: 16 },
      { name: 'MELBOURNE CUP', count: 14 },
      { name: 'NEW MUSIC', count: 12 },
      { name: 'COMMUNICATION', count: 11 },
      { name: 'MENTAL HEALTH', count: 10 },
      { name: 'COMMUNITY', count: 9 },
    ],
    byContentNumber: {
      'Lucy & Kel': 88000,
      'Mornings': 30000,
      'The Daily': 32000,
      'Rob and Shay': 47000,
    },
    byAvgSentiment: {
      'Lucy & Kel': 75,
      'Mornings': 69,
      'The Daily': 79,
      'Rob and Shay': 67,
    },
  };

  // Calculate max values for proper scaling
  const maxContentNumber = Math.max(...Object.values(dummyData.byContentNumber));
  const maxAvgSentiment = Math.max(...Object.values(dummyData.byAvgSentiment));

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Entity Comparison</h2>
        
        {/* Top Section - Content Category Breakdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dummyData.entities.map((entity, entityIndex) => (
            <div
              key={entity}
              className="bg-white rounded-2xl p-4 shadow-xl transition-all duration-700"
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: `${entityIndex * 100}ms`,
              }}
            >
              <div className="flex items-center space-x-2 mb-4">
                <Radio className="w-5 h-5 text-green-500" />
                <h3 className="text-lg font-bold text-gray-900">{entity}</h3>
              </div>
              <div className="space-y-2">
                {dummyData.topics.map((topic, topicIndex) => (
                  <div
                    key={topicIndex}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        topicIndex < 3 ? 'bg-pink-500 text-white' : 'bg-white text-gray-700 border-2 border-blue-500'
                      }`}>
                        {topicIndex + 1}
                      </span>
                      <span className="text-sm text-gray-700">{topic.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">({topic.count})</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }} />
                      </div>
                      <span className="text-xs text-gray-500 w-8">42%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Section - Summary Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Content # */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <Mic className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-bold text-gray-900">By Content #</h3>
            </div>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-end justify-between space-x-4 px-2">
                {Object.entries(dummyData.byContentNumber).map(([entity, value], index) => {
                  const colors = ['#ec4899', '#10b981', '#fbbf24', '#3b82f6'];
                  const baseDelay = 200 + (index * 150);
                  const barHeight = (value / maxContentNumber) * 100;
                  return (
                    <div
                      key={entity}
                      className="flex-1 flex flex-col items-center h-full"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease-out ${baseDelay}ms, transform 0.5s ease-out ${baseDelay}ms`,
                      }}
                    >
                      <div className="flex flex-col items-center justify-end h-full w-full pb-16">
                        <div
                          className="w-full rounded-t origin-bottom"
                          style={{
                            height: isVisible ? `${barHeight}%` : '0%',
                            minHeight: isVisible ? '8px' : '0px',
                            backgroundColor: colors[index],
                            transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms, min-height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms`,
                          }}
                        />
                        <span 
                          className="text-xs text-gray-600 mt-2 text-center transition-opacity duration-300"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${baseDelay + 800}ms`,
                          }}
                        >
                          {entity}
                        </span>
                        <span 
                          className="text-xs font-bold text-gray-900 mt-1 transition-opacity duration-300"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${baseDelay + 800}ms`,
                          }}
                        >
                          {Math.round(value / 1000)}k
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* By Avg Sentiment */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <Heart className="w-5 h-5 text-red-500" />
              <h3 className="text-xl font-bold text-gray-900">By Avg Sentiment</h3>
            </div>
            <div className="h-64 relative">
              <div className="absolute inset-0 flex items-end justify-between space-x-4 px-2">
                {Object.entries(dummyData.byAvgSentiment).map(([entity, value], index) => {
                  const colors = ['#ec4899', '#10b981', '#fbbf24', '#3b82f6'];
                  const baseDelay = 400 + (index * 150);
                  const barHeight = (value / maxAvgSentiment) * 100;
                  return (
                    <div
                      key={entity}
                      className="flex-1 flex flex-col items-center h-full"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: `opacity 0.5s ease-out ${baseDelay}ms, transform 0.5s ease-out ${baseDelay}ms`,
                      }}
                    >
                      <div className="flex flex-col items-center justify-end h-full w-full pb-16">
                        <div
                          className="w-full rounded-t origin-bottom"
                          style={{
                            height: isVisible ? `${barHeight}%` : '0%',
                            minHeight: isVisible ? '8px' : '0px',
                            backgroundColor: colors[index],
                            transition: `height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms, min-height 0.8s cubic-bezier(0.4, 0, 0.2, 1) ${baseDelay + 200}ms`,
                          }}
                        />
                        <span 
                          className="text-xs text-gray-600 mt-2 text-center transition-opacity duration-300"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${baseDelay + 800}ms`,
                          }}
                        >
                          {entity}
                        </span>
                        <span 
                          className="text-xs font-bold text-gray-900 mt-1 transition-opacity duration-300"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${baseDelay + 800}ms`,
                          }}
                        >
                          {value}
                        </span>
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

export default EntityComparisonSlide;

