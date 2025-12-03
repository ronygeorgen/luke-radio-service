import { useEffect, useState } from 'react';

const ImpactIndexSlide = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [revealProgress, setRevealProgress] = useState(0);

  useEffect(() => {
    // Reset and trigger animations with delay
    setIsVisible(false);
    setRevealProgress(0);
    const timer = setTimeout(() => {
      setIsVisible(true);
      // Reset and animate reveal progress from 0 to 100 over 2 seconds
      const startTime = Date.now();
      const duration = 2000; // 2 seconds
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        setRevealProgress(progress);
        
        if (progress < 100) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const dummyData = {
    circles: [
      { name: 'PERSONAL', value: 33, color: '#14b8a6' },
      { name: 'COMMUNITY', value: 33, color: '#fbbf24' },
      { name: 'SPIRITUAL', value: 33, color: '#3b82f6' },
    ],
    trends: {
      personal: [25, 50, 30, 20, 40, 15],
      community: [50, 30, 20, 60, 60, 50],
      spiritual: [25, 20, 50, 20, 20, 35],
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    insights: [
      '87% of positions were filled within 30 days, indicating strong recruitment efficiency.',
      'Only 13% were classified as slow-to-fill (over 30 days), primarily for senior or highly technical roles.',
      'The recruitment team has demonstrated solid performance in maintaining a fast and responsive hiring process.',
    ],
  };

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-12 text-center">Impact Index</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Panel - Circles of Wellbeing */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(-50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 200ms, transform 0.8s ease-out 200ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Circles of Wellbeing</h3>
            <div className="relative w-64 h-64 mx-auto">
              <svg className="transform -rotate-90 w-64 h-64">
                {[...dummyData.circles].reverse().map((circle, index) => {
                  const startAngle = (index * 120) - 90;
                  const endAngle = ((index + 1) * 120) - 90;
                  const startRad = (startAngle * Math.PI) / 180;
                  const endRad = (endAngle * Math.PI) / 180;
                  const radius = 100;
                  const x1 = 128 + radius * Math.cos(startRad);
                  const y1 = 128 + radius * Math.sin(startRad);
                  const x2 = 128 + radius * Math.cos(endRad);
                  const y2 = 128 + radius * Math.sin(endRad);
                  const largeArc = 120 > 180 ? 1 : 0;
                  const midAngle = ((startAngle + endAngle) / 2) * Math.PI / 180;

                  return (
                    <g key={circle.name}>
                      <path
                        d={`M 128 128 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                        fill={circle.color}
                        className="transition-all duration-1000"
                        style={{ 
                          opacity: isVisible ? 1 : 0,
                          transitionDelay: `${index * 200}ms`
                        }}
                      />
                      <text
                        x={128 + (radius * 0.7) * Math.cos(midAngle)}
                        y={128 + (radius * 0.7) * Math.sin(midAngle)}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="text-2xl font-bold fill-white transition-opacity duration-1000"
                        transform={`rotate(90 ${128 + (radius * 0.7) * Math.cos(midAngle)} ${128 + (radius * 0.7) * Math.sin(midAngle)})`}
                        style={{ 
                          opacity: isVisible ? 1 : 0,
                          transitionDelay: `${index * 200 + 300}ms`
                        }}
                      >
                        {circle.value}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
            <div className="mt-6 space-y-3">
              {dummyData.circles.map((circle, index) => (
                <div 
                  key={circle.name} 
                  className="flex items-center space-x-3 transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
                    transitionDelay: `${index * 100 + 800}ms`,
                  }}
                >
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: circle.color }} />
                  <span className="text-white font-medium">{circle.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Middle Panel - Circle Trends */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateY(30px)',
              transition: 'opacity 0.8s ease-out 400ms, transform 0.8s ease-out 400ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Circle Trends</h3>
            <div className="h-80 relative">
              <svg viewBox="0 0 400 300" className="w-full h-full">
                {/* Y-axis */}
                <line x1="40" y1="20" x2="40" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                {/* X-axis */}
                <line x1="40" y1="280" x2="380" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                
                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map((val) => (
                  <line
                    key={val}
                    x1="40"
                    y1={280 - (val * 2.6)}
                    x2="380"
                    y2={280 - (val * 2.6)}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="1"
                  />
                ))}

                {/* Stacked area chart with wave animation */}
                {(() => {
                  const points = dummyData.trends.months.map((month, monthIndex) => {
                    const x = 40 + (monthIndex * 56);
                    const personal = dummyData.trends.personal[monthIndex];
                    const community = dummyData.trends.community[monthIndex];
                    const spiritual = dummyData.trends.spiritual[monthIndex];
                    
                    const personalY = 280 - (personal * 2.6);
                    const communityY = personalY - (community * 2.6);
                    const spiritualY = communityY - (spiritual * 2.6);
                    
                    return { x, personalY, communityY, spiritualY, month, personal, community, spiritual };
                  });

                  // Create path for stacked areas
                  const personalPath = `M ${points[0].x} 280 ${points.map(p => `L ${p.x} ${p.personalY}`).join(' ')} L ${points[points.length - 1].x} 280 Z`;
                  const communityPath = `M ${points[0].x} ${points[0].personalY} ${points.map(p => `L ${p.x} ${p.communityY}`).join(' ')} L ${points[points.length - 1].x} ${points[points.length - 1].personalY} Z`;
                  const spiritualPath = `M ${points[0].x} ${points[0].communityY} ${points.map(p => `L ${p.x} ${p.spiritualY}`).join(' ')} L ${points[points.length - 1].x} ${points[points.length - 1].communityY} Z`;

                  const revealWidth = (revealProgress / 100) * 400;
                  
                  return (
                    <g>
                      {/* Clip path for left-to-right reveal animation */}
                      <defs>
                        <clipPath id="chartReveal">
                          <rect
                            x="0"
                            y="0"
                            width={revealWidth}
                            height="300"
                          />
                        </clipPath>
                      </defs>
                      
                      {/* Personal area (bottom) - animated from left to right */}
                      <g clipPath="url(#chartReveal)">
                        <path
                          d={personalPath}
                          fill="#14b8a6"
                          opacity={0.8}
                        />
                      </g>
                      
                      {/* Community area (middle) - animated from left to right */}
                      <g clipPath="url(#chartReveal)">
                        <path
                          d={communityPath}
                          fill="#fbbf24"
                          opacity={0.8}
                        />
                      </g>
                      
                      {/* Spiritual area (top) - animated from left to right */}
                      <g clipPath="url(#chartReveal)">
                        <path
                          d={spiritualPath}
                          fill="#3b82f6"
                          opacity={0.8}
                        />
                      </g>
                      
                      {/* Month labels - appear as wave passes */}
                      {points.map((point, index) => {
                        const labelProgress = ((point.x - 40) / 340) * 100;
                        const isLabelVisible = revealProgress >= labelProgress;
                        return (
                          <text
                            key={index}
                            x={point.x}
                            y="295"
                            textAnchor="middle"
                            className="text-xs fill-white"
                            style={{
                              opacity: isLabelVisible ? 1 : 0,
                              transition: 'opacity 0.2s ease-out',
                            }}
                          >
                            {point.month}
                          </text>
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Right Panel - Key Insight */}
          <div 
            className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20"
            style={{
              opacity: isVisible ? 1 : 0,
              transform: isVisible ? 'translateX(0) translateY(0)' : 'translateX(50px) translateY(20px)',
              transition: 'opacity 0.8s ease-out 600ms, transform 0.8s ease-out 600ms',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-6 text-center">Key Insight</h3>
            <div className="space-y-4">
              {dummyData.insights.map((insight, index) => (
                <div
                  key={index}
                  className="bg-white/10 rounded-lg p-4 border border-white/20 transition-all duration-700"
                  style={{
                    opacity: isVisible ? 1 : 0,
                    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
                    transitionDelay: `${index * 200}ms`,
                  }}
                >
                  <p className="text-white text-sm leading-relaxed">{insight}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {[0, 1, 2, 3].map((dot) => (
            <div
              key={dot}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                dot === 0 ? 'bg-white w-8' : 'bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImpactIndexSlide;

