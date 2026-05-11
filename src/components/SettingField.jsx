import { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '../services/api';

const SettingField = ({ label, settingKey, value, isTextarea = false, disableEdit = false, onValueChange }) => {
  const [localValue, setLocalValue] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const isZeroToOneField = ['chatGptTemperature', 'chatGptTopP'].includes(settingKey);
  const isModelField = settingKey === 'chatGptModel';
  const [modelSearch, setModelSearch] = useState('');
  const [modelOptions, setModelOptions] = useState([]);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const modelDropdownRef = useRef(null);

  // Update local value when prop value changes (e.g., after save or reset)
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (!isModelField) return;
    setModelSearch(value || '');
  }, [isModelField, value]);

  useEffect(() => {
    if (!isModelField || !isEditing) return;

    const handleOutsideClick = (event) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target)) {
        setIsModelDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isEditing, isModelField]);

  useEffect(() => {
    if (!isModelField || !isEditing) return;

    let isMounted = true;
    const timeoutId = setTimeout(async () => {
      setIsModelLoading(true);
      try {
        const response = await axiosInstance.get('/openrouter/models', {
          params: modelSearch?.trim() ? { name: modelSearch.trim() } : {},
        });
        const rows = response?.data?.data?.data || response?.data?.data || [];
        const options = Array.isArray(rows)
          ? rows
              .filter((item) => item?.id)
              .map((item) => ({
                id: item.id,
                name: item.name || item.id,
              }))
          : [];

        if (isMounted) {
          setModelOptions(options);
        }
      } catch {
        if (isMounted) {
          setModelOptions([]);
        }
      } finally {
        if (isMounted) {
          setIsModelLoading(false);
        }
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [isEditing, isModelField, modelSearch]);

  const handleEdit = () => {
    setIsEditing(true);
    if (isModelField) {
      setModelSearch(String(localValue || ''));
      setIsModelDropdownOpen(true);
    }
  };

  const handleChange = (newValue) => {
    if (isZeroToOneField) {
      // Allow clearing, and only keep values between 0 and 1.
      if (newValue === '') {
        setLocalValue('');
        if (onValueChange) {
          onValueChange(settingKey, '');
        }
        return;
      }

      if (!/^(\d+(\.\d*)?|\.\d+)$/.test(newValue)) {
        return;
      }

      const parsedValue = Number(newValue);
      if (Number.isNaN(parsedValue) || parsedValue < 0 || parsedValue > 1) {
        return;
      }
    }

    setLocalValue(newValue);
    // Notify parent component of the change
    if (onValueChange) {
      onValueChange(settingKey, newValue);
    }
  };

  const handleCancel = () => {
    setLocalValue(value);
    setIsEditing(false);
    if (isModelField) {
      setModelSearch(value || '');
      setIsModelDropdownOpen(false);
    }
    // Reset to original value in parent
    if (onValueChange) {
      onValueChange(settingKey, value);
    }
  };

  const handleModelSelect = (option) => {
    handleChange(option.id);
    setModelSearch(option.name);
    setIsModelDropdownOpen(false);
  };

  const selectedModelOption = modelOptions.find((option) => option.id === localValue);

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
          ) : isModelField ? (
            <div ref={modelDropdownRef} className="relative">
              <input
                type="text"
                value={modelSearch}
                onChange={(e) => {
                  setModelSearch(e.target.value);
                  setIsModelDropdownOpen(true);
                }}
                onFocus={() => setIsModelDropdownOpen(true)}
                placeholder="Search and select a model..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              {isModelDropdownOpen && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-auto">
                  {isModelLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-500">Loading models...</div>
                  ) : modelOptions.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">No models found</div>
                  ) : (
                    modelOptions.map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleModelSelect(option)}
                        className={`w-full text-left px-3 py-2 transition-colors border-b border-gray-100 last:border-b-0 ${
                          localValue === option.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 truncate">{option.name}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          <span className="truncate">{option.id}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
              {localValue && (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {selectedModelOption?.name || modelSearch || localValue}
                  </div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                    <span className="truncate">{localValue}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <input
              type={isZeroToOneField ? 'number' : 'text'}
              value={localValue}
              onChange={(e) => handleChange(e.target.value)}
              min={isZeroToOneField ? 0 : undefined}
              max={isZeroToOneField ? 1 : undefined}
              step={isZeroToOneField ? '0.01' : undefined}
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