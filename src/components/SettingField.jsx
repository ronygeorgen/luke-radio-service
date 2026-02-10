import { useState, useEffect } from 'react';

const SettingField = ({ label, settingKey, value, isTextarea = false, disableEdit = false, onValueChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);

  // Update local value when prop value changes (e.g., after save or reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    // Notify parent component of the change
    if (onValueChange) {
      onValueChange(settingKey, newValue);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    // Reset to original value in parent
    if (onValueChange) {
      onValueChange(settingKey, value);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        {!isEditing && !disableEdit && (
          <button
            onClick={handleEdit}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
        )}
        {isEditing && (
          <button
            onClick={handleCancel}
            className="text-xs text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-3">
          {isTextarea ? (
            <textarea
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={6}
            />
          ) : (
            <input
              type="text"
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          )}
        </div>
      ) : (
        <div className="text-sm text-gray-600 break-words">
          {isTextarea ? (
            <div className="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
              {value}
            </div>
          ) : (
            <div className="bg-gray-50 p-2 rounded border">
              {value}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SettingField;