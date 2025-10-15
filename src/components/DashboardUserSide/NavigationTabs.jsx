import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCurrentView } from '../../store/slices/shiftManagementSlice';
import { Tag, Clock, Filter } from 'lucide-react';

const NavigationTabs = () => {
  const dispatch = useDispatch();
  const { currentView } = useSelector((state) => state.shiftManagement);

  const tabs = [
    { id: 'topics', label: 'Topic Management', icon: Tag },
    { id: 'shifts', label: 'Shift Management', icon: Clock },
    { id: 'predefined-filters', label: 'Predefined Filters', icon: Filter }
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex space-x-4">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => dispatch(setCurrentView(tab.id))}
              className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center ${
                currentView === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <IconComponent className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationTabs;