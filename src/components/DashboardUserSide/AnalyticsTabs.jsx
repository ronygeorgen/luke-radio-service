import { useState } from 'react';

const AnalyticsTabs = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="mb-8">
      {/* Tabs Container */}
      <div className="w-full mb-6">
        <div className="flex w-full rounded-md overflow-hidden border border-gray-200">
          <button
            onClick={() => setActiveTab('main')}
            className={`flex-1 py-2 text-sm font-medium relative transition-all duration-800 ease-in-out ${
              activeTab === 'main'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Main Analytics
            {activeTab === 'main' && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('shift')}
            className={`flex-1 py-2 text-sm font-medium relative transition-all duration-300 ease-in-out ${
              activeTab === 'shift'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                : 'bg-white text-gray-600 hover:bg-gray-100'
            }`}
          >
            Shift Analytics
            {activeTab === 'shift' && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300"></span>
            )}
          </button>
        </div>
      </div>


      {/* Tab Content */}
      {children}
    </div>
  );
};

export default AnalyticsTabs;
