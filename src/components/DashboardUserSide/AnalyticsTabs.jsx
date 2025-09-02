import { useState } from 'react';

const AnalyticsTabs = ({ children, activeTab, setActiveTab }) => {

  return (
    <div className="mb-8">
      <div className="flex space-x-1 mb-6">
        <button
          onClick={() => setActiveTab('main')}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'main'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Main Analytics
        </button>
        <button
          onClick={() => setActiveTab('shift')}
          className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
            activeTab === 'shift'
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Shift Analytics
        </button>
      </div>
      {children}
    </div>
  );
};

export default AnalyticsTabs;