import React, { useState } from 'react';
import { Eye } from 'lucide-react';

const DEFAULT_STYLE = { top: 'calc(4rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem)' };

const PieChartTrigger = ({ onClick, inline = false, wrapperClassName = '', style }) => {
  const [isHovered, setIsHovered] = useState(false);

  const containerClassName = inline
    ? `relative ${wrapperClassName}`
    : `fixed right-8 z-40 ${wrapperClassName}`;

  const containerStyle = inline ? style : { ...DEFAULT_STYLE, ...style };

  return (
    <div className={containerClassName} style={containerStyle}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-300 transform hover:scale-110
          ${isHovered 
            ? 'bg-blue-600 shadow-xl' 
            : 'bg-blue-500 shadow-lg'
          }
        `}
      >
        <Eye className="w-5 h-5 text-white" />
      </button>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
          <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
            View Content Distribution
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1">
              <div className="w-3 h-3 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChartTrigger;