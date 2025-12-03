import { useEffect, useState } from 'react';

const WordCloudSlide = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Generate words with varied sizes, colors, positions, and rotations
  const generateWord = (text, size, color, x, y, rotation = 0) => ({
    text,
    size,
    color,
    x,
    y,
    rotation
  });

  const words = [
    // Large prominent words (size 80-90) - Central focus
    generateWord('TRANSCRIPTION', 90, '#ef4444', 50, 50, -5),
    generateWord('SENTIMENT', 85, '#fbbf24', 25, 30, 3),
    generateWord('TOPICS', 85, '#10b981', 75, 35, -2),
    generateWord('ANALYTICS', 80, '#14b8a6', 45, 20, 4),
    generateWord('CONTENT', 80, '#ec4899', 70, 60, -3),
    
    // Large words (size 70-75)
    generateWord('RADIO', 75, '#f97316', 20, 50, 2),
    generateWord('AUDIO', 75, '#8b5cf6', 80, 50, -4),
    generateWord('INSIGHTS', 70, '#06b6d4', 55, 70, 1),
    generateWord('REPORTS', 70, '#f59e0b', 30, 65, -2),
    generateWord('DASHBOARD', 70, '#10b981', 65, 25, 3),
    generateWord('CHANNELS', 70, '#ef4444', 25, 75, -1),
    
    // Medium-large words (size 60-65)
    generateWord('ANALYSIS', 65, '#ec4899', 50, 85, 2),
    generateWord('TRENDING', 65, '#fbbf24', 85, 70, -3),
    generateWord('METRICS', 65, '#14b8a6', 15, 40, 4),
    generateWord('PERFORMANCE', 60, '#3b82f6', 40, 45, -2),
    generateWord('ENGAGEMENT', 60, '#10b981', 75, 80, 1),
    generateWord('MONITORING', 60, '#f97316', 20, 25, -4),
    generateWord('TRACKING', 60, '#8b5cf6', 80, 30, 2),
    generateWord('DISTRIBUTION', 60, '#06b6d4', 35, 55, -1),
    generateWord('WELLBEING', 65, '#8b5cf6', 55, 15, 2),
    generateWord('COMMUNITY', 60, '#f59e0b', 15, 70, -3),
    generateWord('SPIRITUAL', 60, '#14b8a6', 85, 75, 1),
    generateWord('PERSONAL', 60, '#ec4899', 10, 50, -2),
    
    // Medium words (size 50-55)
    generateWord('DATA', 55, '#9ca3af', 60, 40, 3),
    generateWord('TRENDS', 55, '#f59e0b', 45, 60, -2),
    generateWord('STATISTICS', 55, '#ec4899', 70, 15, 1),
    generateWord('OVERVIEW', 55, '#10b981', 15, 60, -3),
    generateWord('SUMMARY', 55, '#3b82f6', 85, 45, 2),
    generateWord('BREAKDOWN', 55, '#f97316', 30, 35, -1),
    generateWord('COMPARISON', 55, '#8b5cf6', 60, 75, 4),
    generateWord('DETAILS', 55, '#14b8a6', 25, 85, -2),
    generateWord('PATTERNS', 55, '#06b6d4', 75, 60, 1),
    generateWord('VISUALIZATION', 55, '#fbbf24', 40, 30, -3),
    generateWord('IMPACT', 55, '#ef4444', 50, 10, 2),
    generateWord('INDEX', 55, '#8b5cf6', 90, 50, -1),
    
    // Small-medium words (size 40-50)
    generateWord('POSITIVE', 50, '#10b981', 55, 50, 2),
    generateWord('NEGATIVE', 50, '#ef4444', 35, 70, -1),
    generateWord('NEUTRAL', 50, '#9ca3af', 65, 55, 3),
    generateWord('SCORE', 50, '#f59e0b', 50, 35, -2),
    generateWord('RATING', 50, '#3b82f6', 40, 75, 1),
    generateWord('AVERAGE', 50, '#14b8a6', 30, 50, 2),
    generateWord('PEAK', 50, '#f97316', 80, 65, -1),
    generateWord('LOW', 50, '#06b6d4', 20, 70, 3),
    generateWord('HIGH', 50, '#ec4899', 60, 20, -2),
    generateWord('TOTAL', 50, '#fbbf24', 45, 80, 1),
    generateWord('COUNT', 50, '#10b981', 75, 25, -4),
    generateWord('VALUE', 50, '#3b82f6', 40, 20, 1),
    generateWord('RANGE', 50, '#8b5cf6', 65, 70, -2),
    generateWord('MIN', 50, '#f97316', 25, 45, 3),
    generateWord('MAX', 50, '#06b6d4', 75, 45, -1),
    
    // Small words (size 35-45)
    generateWord('SHIFT', 45, '#9ca3af', 50, 60, 2),
    generateWord('TIME', 45, '#3b82f6', 40, 40, -1),
    generateWord('DATE', 45, '#f59e0b', 60, 65, 3),
    generateWord('HOUR', 45, '#8b5cf6', 35, 30, -2),
    generateWord('WEEK', 45, '#14b8a6', 70, 50, 1),
    generateWord('MONTH', 45, '#f97316', 25, 55, -3),
    generateWord('YEAR', 45, '#06b6d4', 80, 35, 2),
    generateWord('PERIOD', 45, '#ec4899', 45, 25, -1),
    generateWord('FILTER', 45, '#fbbf24', 30, 45, -2),
    generateWord('SEARCH', 45, '#3b82f6', 55, 30, 1),
    generateWord('SORT', 45, '#8b5cf6', 75, 55, -3),
    generateWord('EXPORT', 45, '#14b6d4', 20, 35, 2),
    generateWord('IMPORT', 45, '#f97316', 85, 75, -1),
    generateWord('DOWNLOAD', 45, '#06b6d4', 40, 15, 3),
    generateWord('UPLOAD', 45, '#ec4899', 60, 80, -2),
    generateWord('SAVE', 45, '#10b981', 25, 20, 1),
    generateWord('DELETE', 45, '#ef4444', 70, 85, -3),
    generateWord('EDIT', 45, '#f59e0b', 50, 10, 2),
    generateWord('CREATE', 45, '#3b82f6', 80, 20, -1),
    generateWord('UPDATE', 45, '#8b5cf6', 35, 15, 1),
    generateWord('REMOVE', 45, '#14b8a6', 65, 80, -2),
    generateWord('ADD', 45, '#f97316', 15, 30, 3),
    generateWord('CHANGE', 45, '#06b6d4', 85, 60, -1),
    
    // Very small words (size 25-35)
    generateWord('VIEW', 40, '#9ca3af', 45, 50, 1),
    generateWord('SHOW', 40, '#8b5cf6', 55, 45, -2),
    generateWord('HIDE', 40, '#14b8a6', 35, 60, 3),
    generateWord('TOGGLE', 40, '#f97316', 65, 40, -1),
    generateWord('SELECT', 40, '#06b6d4', 40, 50, 2),
    generateWord('CHOOSE', 40, '#ec4899', 60, 55, -3),
    generateWord('CLICK', 40, '#10b981', 50, 40, 1),
    generateWord('OPEN', 40, '#fbbf24', 30, 30, -2),
    generateWord('CLOSE', 40, '#3b82f6', 70, 30, 3),
    generateWord('BACK', 40, '#8b5cf6', 25, 40, -1),
    generateWord('NEXT', 40, '#14b8a6', 75, 40, 2),
    generateWord('PREV', 40, '#f97316', 45, 35, -3),
    generateWord('FIRST', 40, '#06b6d4', 20, 30, 1),
    generateWord('LAST', 40, '#ec4899', 80, 30, -2),
    generateWord('ALL', 40, '#10b981', 50, 25, 3),
    generateWord('NONE', 40, '#fbbf24', 30, 20, -1),
    generateWord('MORE', 40, '#3b82f6', 70, 20, 2),
    generateWord('LESS', 40, '#8b5cf6', 25, 15, -3),
    generateWord('NEW', 40, '#14b8a6', 75, 15, 1),
    generateWord('OLD', 40, '#f97316', 45, 20, -2),
    generateWord('RECENT', 40, '#06b6d4', 35, 25, 1),
    generateWord('PAST', 40, '#ec4899', 55, 15, -2),
    generateWord('FUTURE', 40, '#10b981', 65, 10, 3),
    generateWord('CURRENT', 40, '#fbbf24', 40, 10, -1),
    generateWord('ACTIVE', 40, '#3b82f6', 80, 10, 2),
    generateWord('INACTIVE', 40, '#8b5cf6', 20, 10, -3),
    generateWord('ENABLED', 40, '#14b8a6', 90, 40, 1),
    generateWord('DISABLED', 40, '#f97316', 10, 40, -2),
    generateWord('ON', 40, '#06b6d4', 90, 60, 2),
    generateWord('OFF', 40, '#ec4899', 10, 60, -1),
    generateWord('YES', 40, '#10b981', 90, 70, 3),
    generateWord('NO', 40, '#fbbf24', 10, 70, -2),
    generateWord('TRUE', 40, '#3b82f6', 90, 80, 1),
    generateWord('FALSE', 40, '#8b5cf6', 10, 80, -3),
    generateWord('OK', 40, '#14b8a6', 5, 50, 2),
    generateWord('CANCEL', 40, '#f97316', 95, 50, -1),
    generateWord('SUBMIT', 40, '#06b6d4', 5, 60, 3),
    generateWord('RESET', 40, '#ec4899', 95, 60, -2),
    generateWord('APPLY', 40, '#10b981', 5, 70, 1),
    generateWord('CLEAR', 40, '#fbbf24', 95, 70, -3),
  ];

  return (
    <div className={`min-h-screen p-8 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">Word Cloud</h2>
        
        <div className="relative h-[600px] bg-black rounded-2xl overflow-hidden">
          {words.map((word, index) => (
            <div
              key={index}
              className="absolute transition-all duration-1000 cursor-pointer hover:scale-110"
              style={{
                left: `${word.x}%`,
                top: `${word.y}%`,
                fontSize: `${Math.max(word.size * 0.12, 12)}px`,
                color: word.color,
                fontWeight: 'bold',
                opacity: isVisible ? 1 : 0,
                transform: isVisible 
                  ? `scale(1) rotate(${word.rotation}deg)` 
                  : `scale(0) rotate(${word.rotation}deg)`,
                transitionDelay: `${index * 30}ms`,
                transformOrigin: 'center',
                textShadow: `0 0 10px ${word.color}40`,
                whiteSpace: 'nowrap',
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


