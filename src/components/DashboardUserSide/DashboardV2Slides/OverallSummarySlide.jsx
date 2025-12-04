import { useEffect, useState } from 'react';
import { Lightbulb, Target, Users, TrendingUp, Hand } from 'lucide-react';

const OverallSummarySlide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [averageSentimentProgress, setAverageSentimentProgress] = useState(0);
  const [targetSentimentProgress, setTargetSentimentProgress] = useState(0);
  const [lowSentimentProgress, setLowSentimentProgress] = useState(0);
  const [highSentimentProgress, setHighSentimentProgress] = useState(0);

  useEffect(() => {
    // Reset and trigger animations with delay
    setIsVisible(false);
    setAverageSentimentProgress(0);
    setTargetSentimentProgress(0);
    setLowSentimentProgress(0);
    setHighSentimentProgress(0);
    
    const timer = setTimeout(() => {
      setIsVisible(true);
      
      // Animate progress bars from 0 to target values
      const animateProgress = (setter, target, duration = 1500) => {
        const startTime = Date.now();
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min((elapsed / duration) * 100, 100);
          setter((target / 100) * progress);
          
          if (progress < 100) {
            requestAnimationFrame(animate);
          } else {
            setter(target);
          }
        };
        requestAnimationFrame(animate);
      };
      
      // Start animations with slight delays
      setTimeout(() => animateProgress(setAverageSentimentProgress, dummyData.averageSentiment), 300);
      setTimeout(() => animateProgress(setTargetSentimentProgress, dummyData.targetSentiment), 500);
      setTimeout(() => animateProgress(setLowSentimentProgress, dummyData.lowSentiment), 700);
      setTimeout(() => animateProgress(setHighSentimentProgress, dummyData.highSentiment), 900);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const dummyData = {
    averageSentiment: 88,
    targetSentiment: 95,
    sentimentData: [
      { month: 'Jan', value: 70 },
      { month: 'Feb', value: 75 },
      { month: 'Mar', value: 80 },
      { month: 'Apr', value: 78 },
      { month: 'May', value: 80 },
      { month: 'Jun', value: 65 },
    ],
    lowSentiment: 12,
    highSentiment: 71,
    totalTalkBreaks: { value: 265, change: '+21', progress: 9 },
    uniqueTopics: { value: 423, change: '+32%', progress: 92 },
    activeShifts: { value: 4, change: '+14%', progress: 88 },
  };

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8 text-center">Overall Summary</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sentiment Overview */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Average Sentiment</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(averageSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(averageSentimentProgress)}%</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Target className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Target</h3>
              </div>
              <div className="relative w-48 h-48 mx-auto">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="80"
                    stroke="#14b8a6"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${(targetSentimentProgress / 100) * 502.4} 502.4`}
                    strokeDashoffset={0}
                    strokeLinecap="round"
                    style={{ 
                      opacity: isVisible ? 1 : 0,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-4xl font-bold text-white">{Math.round(targetSentimentProgress)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Sentiment Analysis */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-white font-semibold">Sentiment Analysis</h3>
                </div>
                <button className="px-3 py-1 bg-green-500 text-white rounded-lg text-sm font-medium">
                  Monthly
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-4">Last 6 months</p>
              <div className="h-48 relative">
                <svg viewBox="0 0 400 200" className="w-full h-full">
                  {/* Y-axis labels */}
                  {[0, 20, 40, 60, 80, 100].map((val) => (
                    <g key={val}>
                      <line
                        x1="40"
                        y1={180 - (val * 1.6)}
                        x2="380"
                        y2={180 - (val * 1.6)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="1"
                      />
                      <text
                        x="35"
                        y={185 - (val * 1.6)}
                        textAnchor="end"
                        className="text-xs fill-gray-400"
                      >
                        {val}
                      </text>
                    </g>
                  ))}
                  {/* Animated Line chart */}
                  <polyline
                    points={dummyData.sentimentData.map((item, index) => {
                      const x = 40 + (index * 56);
                      const y = 180 - (item.value * 1.6);
                      return `${x},${y}`;
                    }).join(' ')}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth="3"
                    strokeDasharray={isVisible ? "1000" : "0"}
                    strokeDashoffset={isVisible ? "0" : "1000"}
                    className="transition-all duration-1500 ease-out"
                    style={{ opacity: isVisible ? 1 : 0 }}
                  />
                  {/* Data points with animation */}
                  {dummyData.sentimentData.map((item, index) => {
                    const x = 40 + (index * 56);
                    const y = 180 - (item.value * 1.6);
                    return (
                      <g key={index}>
                        <circle
                          cx={x}
                          cy={y}
                          r="4"
                          fill="#ffffff"
                          className="transition-all duration-500"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transform: isVisible ? 'scale(1)' : 'scale(0)',
                            transformOrigin: 'center',
                            transitionDelay: `${800 + index * 150}ms`,
                          }}
                        />
                        <text
                          x={x}
                          y="195"
                          textAnchor="middle"
                          className="text-xs fill-gray-400 transition-opacity duration-500"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${1000 + index * 100}ms`,
                          }}
                        >
                          {item.month}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">Low Sentiment (&lt;70)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(lowSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(lowSentimentProgress)}%</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
                <h4 className="text-white font-semibold mb-2">High Sentiment (95+)</h4>
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#3b82f6"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(highSentimentProgress / 100) * 351.86} 351.86`}
                      strokeDashoffset={0}
                      strokeLinecap="round"
                      style={{ 
                        opacity: isVisible ? 1 : 0,
                      }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{Math.round(highSentimentProgress)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - KPIs */}
          <div 
            className="space-y-6"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Total Talk Breaks</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{dummyData.totalTalkBreaks.value}</div>
              <p className="text-gray-400 text-sm mb-4">+{dummyData.totalTalkBreaks.change} from last month</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-white h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${dummyData.totalTalkBreaks.progress}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '800ms',
                  }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2 text-right">{dummyData.totalTalkBreaks.progress}%</p>
            </div>

            <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <Hand className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Unique Topics</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{dummyData.uniqueTopics.value}</div>
              <p className="text-gray-400 text-sm mb-4">{dummyData.uniqueTopics.change} from last month</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${dummyData.uniqueTopics.progress}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1000ms',
                  }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2 text-right">{dummyData.uniqueTopics.progress}%</p>
            </div>

            {/* <div className="rounded-2xl p-6 shadow-xl backdrop-blur-sm border border-gray-300/20" style={{ background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.7) 0%, rgba(17, 24, 39, 0.7) 100%)' }}>
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
                <h3 className="text-white font-semibold">Active Shifts</h3>
              </div>
              <div className="text-4xl font-bold text-yellow-400 mb-2">{dummyData.activeShifts.value}</div>
              <p className="text-gray-400 text-sm mb-4">{dummyData.activeShifts.change} from last month</p>
              <div className="w-full rounded-full h-2 overflow-hidden" style={{ backgroundColor: 'rgba(55, 65, 81, 0.5)' }}>
                <div
                  className="bg-teal-500 h-2 rounded-full transition-all duration-1000 ease-out origin-left"
                  style={{ 
                    width: isVisible ? `${dummyData.activeShifts.progress}%` : '0%',
                    opacity: isVisible ? 1 : 0,
                    transitionDelay: '1200ms',
                  }}
                />
              </div>
              <p className="text-gray-400 text-xs mt-2 text-right">{dummyData.activeShifts.progress}%</p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallSummarySlide;

