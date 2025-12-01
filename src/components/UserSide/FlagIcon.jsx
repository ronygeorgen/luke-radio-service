// components/UserSide/FlagIcon.jsx
import React from 'react';
import { Flag } from 'lucide-react';

const FlagIcon = ({ message, className = "" }) => {
  if (!message) return null;

  return (
    <div className={`relative group inline-flex items-center ${className}`}>
      <Flag 
        className="w-4 h-4 text-yellow-500 fill-yellow-500 cursor-help" 
        title={message}
      />
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 max-w-xs shadow-lg">
        <div className="whitespace-normal break-words">{message}</div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
          <div className="w-2 h-2 bg-gray-900 transform rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default FlagIcon;

