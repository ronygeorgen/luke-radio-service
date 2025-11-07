import React, { useState } from 'react';
import { Merge } from 'lucide-react';

const MergeAudioTrigger = ({ onClick, isMergeMode, selectedCount }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="fixed right-8 z-40" style={{ top: 'calc(4rem + 1.5rem + 3.5rem + 1.5rem + 1.5rem + 1.5rem + 1.5rem)' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          flex items-center justify-center w-12 h-12 rounded-full shadow-lg
          transition-all duration-300 transform hover:scale-110
          ${isMergeMode 
            ? 'bg-green-600 shadow-xl' 
            : isHovered
            ? 'bg-purple-600 shadow-xl' 
            : 'bg-purple-500 shadow-lg'
          }
        `}
      >
        <Merge className="w-5 h-5 text-white" />
        {isMergeMode && selectedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {selectedCount}
          </span>
        )}
      </button>
      
      {/* Tooltip */}
      {isHovered && (
        <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
          <div className="bg-gray-900 text-white text-sm py-2 px-3 rounded-lg whitespace-nowrap shadow-lg">
            {isMergeMode ? 'Cancel Merge Mode' : 'Merge Audio Segments'}
            <div className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-1">
              <div className="w-3 h-3 bg-gray-900 transform rotate-45"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MergeAudioTrigger;

