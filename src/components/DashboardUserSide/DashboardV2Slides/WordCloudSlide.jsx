import { useEffect, useState } from 'react';

const WordCloudSlide = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const words = [
    { text: 'ChatGPT', size: 80, color: '#ef4444', x: 50, y: 50 },
    { text: 'features', size: 70, color: '#fbbf24', x: 20, y: 20 },
    { text: 'history', size: 65, color: '#92400e', x: 50, y: 80 },
    { text: 'model', size: 70, color: '#10b981', x: 70, y: 50 },
    { text: 'plugins', size: 75, color: '#14b8a6', x: 80, y: 40 },
    { text: 'users', size: 65, color: '#ec4899', x: 50, y: 70 },
    { text: 'experimental', size: 60, color: '#f97316', x: 70, y: 70 },
    { text: 'conversations', size: 55, color: '#9ca3af', x: 40, y: 40 },
    { text: 'access', size: 60, color: '#10b981', x: 30, y: 50 },
    { text: 'rolling', size: 55, color: '#92400e', x: 25, y: 55 },
    { text: 'updates', size: 65, color: '#ef4444', x: 85, y: 25 },
    { text: 'beta', size: 60, color: '#60a5fa', x: 75, y: 60 },
    { text: 'browsing', size: 60, color: '#f97316', x: 20, y: 70 },
    { text: 'version', size: 55, color: '#92400e', x: 65, y: 75 },
    { text: 'feedback', size: 55, color: '#10b981', x: 20, y: 30 },
    { text: 'GPT4', size: 65, color: '#fbbf24', x: 70, y: 80 },
    { text: 'app', size: 50, color: '#9ca3af', x: 15, y: 25 },
    { text: 'share', size: 55, color: '#10b981', x: 45, y: 30 },
    { text: 'thirdparty', size: 50, color: '#60a5fa', x: 80, y: 50 },
    { text: 'countries', size: 50, color: '#92400e', x: 70, y: 85 },
    { text: 'settings', size: 50, color: '#9ca3af', x: 30, y: 45 },
    { text: 'iOS', size: 55, color: '#ec4899', x: 20, y: 75 },
    { text: 'Bing', size: 50, color: '#9ca3af', x: 70, y: 85 },
  ];

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Word Cloud</h2>
        
        <div className="relative h-[600px] bg-black rounded-2xl overflow-hidden">
          {words.map((word, index) => (
            <div
              key={index}
              className="absolute transition-all duration-1000"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                fontSize: `${word.size}%`,
                color: word.color,
                fontWeight: 'bold',
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? 'scale(1)' : 'scale(0)',
                transitionDelay: `${index * 50}ms`,
                transformOrigin: 'center',
              }}
            >
              {word.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordCloudSlide;


