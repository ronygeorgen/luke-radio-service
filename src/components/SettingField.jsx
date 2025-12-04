import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Save } from 'lucide-react';
import { updateSetting } from '../store/slices/settingsSlice';
import Toast from './UserSide/Toast';

const SettingField = ({ label, settingKey, value, isTextarea = false }) => {
  const dispatch = useDispatch();
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorToast, setErrorToast] = useState(null);

  const handleSave = async () => {
    setIsSaving(true);
    setErrorToast(null);
    try {
      const result = await dispatch(updateSetting({ key: settingKey, value: localValue }));
      if (updateSetting.rejected.match(result)) {
        const errorMessage = result.payload || result.error?.message || 'Failed to update setting';
        setErrorToast(errorMessage);
      } else {
        setIsEditing(false);
      }
    } catch (error) {
      const errorMessage = error?.message || 'Failed to update setting';
      setErrorToast(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
  };

  return (
    <>
      {errorToast && (
        <Toast
          message={errorToast}
          type="error"
          onClose={() => setErrorToast(null)}
        />
      )}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Edit
          </button>
        )}
      </div>
      
      {isEditing ? (
        <div className="space-y-3">
          {isTextarea ? (
            <textarea
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              rows={6}
            />
          ) : (
            <input
              type="text"
              value={localValue}
              onChange={(e) => setLocalValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          )}
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center space-x-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              <Save className="h-3 w-3" />
              <span>{isSaving ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
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
    </>
  );
};

export default SettingField;