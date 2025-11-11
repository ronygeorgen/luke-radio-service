import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';

const DEFAULT_STYLE = { top: 'calc(4rem + 1.5rem + 5.5rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem)' };

const StatusToggleTrigger = ({
  onClick,
  inline = false,
  wrapperClassName = '',
  style,
  isLoading = false,
}) => {
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
        disabled={isLoading}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-300 transform hover:scale-110
          ${isLoading
            ? 'bg-gray-400 cursor-not-allowed'
            : isHovered
            ? 'bg-amber-600 shadow-xl'
            : 'bg-amber-500 shadow-lg'
          }
        `}
      >
        {isLoading ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <RefreshCcw className="w-5 h-5 text-white" />
        )}
      </button>

      {isHovered && !isLoading && (
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
          <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
            Toggle Segment Status
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1">
              <div className="w-3 h-3 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusToggleTrigger;

