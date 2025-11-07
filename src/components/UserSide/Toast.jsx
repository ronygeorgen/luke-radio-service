import React, { useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

const Toast = ({ message, onClose, type = 'error' }) => {
  useEffect(() => {
    // Auto-close after 5 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200';
  const textColor = type === 'error' ? 'text-red-800' : 'text-green-800';
  const iconColor = type === 'error' ? 'text-red-600' : 'text-green-600';

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50`}
      style={{
        animation: 'slideDown 0.3s ease-out'
      }}
    >
      <div className={`${bgColor} border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[500px]`}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <AlertCircle className={`w-5 h-5 ${iconColor} mt-0.5 flex-shrink-0`} />
            <div className="flex-1">
              <p className={`${textColor} text-sm font-medium`}>
                {message}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`ml-4 ${textColor} hover:opacity-70 transition-opacity flex-shrink-0`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Toast;

