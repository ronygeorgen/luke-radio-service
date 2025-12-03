import { useEffect, useState } from 'react';
import { RefreshCw, User } from 'lucide-react';

const PersonalSlide = () => {
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
    byContentNumber: [
      { name: 'MENTAL', value: 12 },
      { name: 'PHYSICAL', value: 26 },
      { name: 'FINANCIAL', value: 28 },
      { name: 'LEARNING', value: 16 },
      { name: 'PURPOSE', value: 18 },
    ],
    byContentTime: [
      { name: 'MENTAL', value: 24, color: '#8b5cf6' },
      { name: 'PHYSICAL', value: 18, color: '#3b82f6' },
      { name: 'FINANCIAL', value: 14, color: '#10b981' },
      { name: 'LEARNING', value: 19, color: '#f59e0b' },
      { name: 'PURPOSE', value: 24.5, color: '#ec4899' },
    ],
    totalTime: [
      { category: 'Product', value: 210 },
      { category: 'Marketing', value: 165 },
      { category: 'Sales', value: 150 },
      { category: 'Operations', value: 145 },
      { category: 'IT & Support', value: 80 },
    ],
    metrics: {
      totalOvertime: 750,
      averageTalkBreak: 4.7,
    },
  };

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">PERSONAL</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - By Content # */}
          <div 
            className="bg-white rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <RefreshCw className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">By Content #</h3>
            </div>
            <div className="space-y-4">
              {dummyData.byContentNumber.map((item, index) => (
                <div
                  key={item.name}
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-50px)',
                    transition: `opacity 0.6s ease-out ${index * 150 + 200}ms, transform 0.6s ease-out ${index * 150 + 200}ms`,
                  }}
                >
                  <div
                    className="flex items-center justify-between mb-2"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transition: `opacity 0.5s ease-out ${index * 150 + 300}ms`,
                    }}
                  >
                    <span className="text-sm font-medium text-gray-700">{item.name}</span>
                    <span className="text-sm font-bold text-gray-900">{item.value}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-green-500 h-3 rounded-full origin-left"
                      style={{
                        width: isVisible ? `${item.value}%` : '0%',
                        transition: `width 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${index * 150 + 500}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Panel - By Content Time */}
          <div 
            className="bg-gray-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <div className="flex items-center space-x-2 mb-6">
              <User className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">By Content Time</h3>
            </div>
            <div className="relative pl-8">
              {/* Chart area - bars start from 0% level */}
              <div className="h-64 relative">
                {/* Y-axis labels on the left */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 w-8">
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0 }}>25%</span>
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '100ms' }}>20%</span>
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '200ms' }}>15%</span>
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '300ms' }}>10%</span>
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '400ms' }}>5%</span>
                  <span className="transition-opacity duration-500" style={{ opacity: isVisible ? 1 : 0, transitionDelay: '500ms' }}>0%</span>
                </div>

                {/* Chart area with bars - bars start from 0% level */}
                <div className="ml-8 h-full flex items-end justify-between space-x-2">
                  {dummyData.byContentTime.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex-1 flex flex-col items-center h-full justify-end"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transition: `opacity 0.3s ease-out ${index * 100 + 200}ms`,
                      }}
                    >
                      {/* Vertical bar - water filling animation from bottom to top */}
                      <div
                        className="w-full rounded-t origin-bottom overflow-hidden"
                        style={{
                          height: isVisible ? `${(item.value / 25) * 100}%` : '0%',
                          backgroundColor: item.color,
                          transition: `height 1.5s cubic-bezier(0.4, 0, 0.2, 1) ${index * 200 + 400}ms`,
                          minHeight: '2px',
                          position: 'relative',
                        }}
                      >
                        {/* Water filling effect overlay */}
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                          style={{
                            opacity: isVisible ? 0.3 : 0,
                            transition: `opacity 0.5s ease-out ${index * 200 + 1900}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* X-axis labels - positioned below the 0% level */}
              <div className="ml-8 mt-2 flex justify-between space-x-2">
                {dummyData.byContentTime.map((item, index) => (
                  <div
                    key={item.name}
                    className="flex-1 flex flex-col items-center"
                    style={{
                      opacity: isVisible ? 1 : 0,
                      transition: `opacity 0.3s ease-out ${index * 150 + 1000}ms`,
                    }}
                  >
                    {/* Percentage value */}
                    <span className="text-xs font-bold text-gray-900">
                      {item.value}%
                    </span>
                    {/* Category name */}
                    <span className="text-xs text-gray-600 mt-0.5 text-center">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Total Time */}
          <div 
            className="bg-gray-100 rounded-2xl p-6 shadow-xl"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <h3 className="text-lg font-bold text-pink-600 mb-6">Total Time</h3>
            <div className="relative pl-2">
              {/* Chart area - graph starts from 0 level */}
              <div className="h-72 relative"> {/* Increased height for labels */}
                <div className="w-full h-full">
                  <svg viewBox="0 0 440 260" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                    {/* Y-axis labels */}
                    {[250, 200, 150, 100, 50, 0].map((value, idx) => {
                      // Chart area: top at y=20, bottom at y=200 (height 180)
                      const y = 20 + (250 - value) / 250 * 180;
                      return (
                        <text
                          key={`y-label-${value}`}
                          x="32"
                          y={y}
                          dy="4"
                          textAnchor="end"
                          className="text-xs fill-gray-500 transition-opacity duration-500"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${idx * 100}ms`,
                            fontSize: '12px',
                            fontWeight: '500'
                          }}
                        >
                          {value}
                        </text>
                      );
                    })}

                    {/* X-axis / 0% baseline - solid line at bottom */}
                    <line
                      x1="40"
                      y1="200"
                      x2="420"
                      y2="200"
                      stroke="#9ca3af"
                      strokeWidth="2"
                      className="transition-opacity duration-500"
                      style={{
                        opacity: isVisible ? 1 : 0,
                        transitionDelay: '0ms',
                      }}
                    />

                    {/* Horizontal grid lines for other intervals */}
                    {[50, 100, 150, 200, 250].map((value, idx) => {
                      const y = 20 + (250 - value) / 250 * 180;
                      return (
                        <line
                          key={`grid-${value}`}
                          x1="40"
                          y1={y}
                          x2="420"
                          y2={y}
                          stroke="#d1d5db"
                          strokeWidth="1"
                          strokeDasharray="4,4"
                          className="transition-opacity duration-500"
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transitionDelay: `${(idx + 1) * 50}ms`,
                          }}
                        />
                      );
                    })}

                    {/* Line chart - waterfall animation from left to right */}
                    <polyline
                      points={dummyData.totalTime.map((item, index) => {
                        const x = 40 + (index * 90) + 20; // Adjusted spacing
                        const y = 20 + (250 - item.value) / 250 * 180;
                        return `${x},${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#000000"
                      strokeWidth="3"
                      strokeDasharray="1000"
                      strokeDashoffset={isVisible ? "0" : "1000"}
                      style={{
                        transition: 'stroke-dashoffset 2s cubic-bezier(0.4, 0, 0.2, 1)',
                        transitionDelay: '500ms',
                      }}
                    />

                    {/* Data points - waterfall animation */}
                    {dummyData.totalTime.map((item, index) => {
                      const x = 40 + (index * 90) + 20; // Adjusted spacing
                      const y = 20 + (250 - item.value) / 250 * 180;
                      const baseDelay = 500 + (index * 250);
                      return (
                        <g key={`point-${index}`}>
                          <circle
                            cx={x}
                            cy={y}
                            r={isVisible ? "4" : "0"}
                            fill="#000000"
                            style={{
                              opacity: isVisible ? 1 : 0,
                              transition: `opacity 0.3s ease-out ${baseDelay}ms, r 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${baseDelay}ms`,
                            }}
                          />
                        </g>
                      );
                    })}

                    {/* X-axis labels */}
                    {dummyData.totalTime.map((item, index) => {
                      const x = 40 + (index * 90) + 20; // Adjusted spacing
                      const baseDelay = 500 + (index * 250);
                      return (
                        <g
                          key={`x-label-${index}`}
                          transform={`translate(${x}, 215) rotate(-45)`}
                          style={{
                            opacity: isVisible ? 1 : 0,
                            transition: `opacity 0.4s ease-out ${baseDelay + 200}ms`,
                          }}
                        >
                          <text
                            textAnchor="end"
                            className="text-xs fill-gray-600"
                            style={{
                              fontSize: '12px',
                              fontWeight: '500'
                            }}
                          >
                            {item.category}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* Spacer for metrics section */}
              <div className="h-4"></div>
            </div>
            <div className="space-y-3 mt-8">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Overtime</span>
                <span className="text-xl font-bold text-gray-900 bg-purple-200 rounded-lg px-4 py-2">{dummyData.metrics.totalOvertime} hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Average Talk Break</span>
                <span className="text-xl font-bold text-gray-900 bg-purple-200 rounded-lg px-4 py-2">{dummyData.metrics.averageTalkBreak} hours</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalSlide;

