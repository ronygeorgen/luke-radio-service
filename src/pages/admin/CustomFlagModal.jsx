// pages/admin/CustomFlagModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannels } from '../../store/slices/channelSlice';

// Dual Range Slider Component
const DualRangeSlider = ({ min = 0, max = 100, lowerValue, upperValue, onLowerChange, onUpperChange, lowerName, upperName }) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(null); // 'lower' or 'upper' or null

  // Convert empty strings to numbers for display, default to min for lower and max for upper
  const lowerNum = lowerValue === '' || lowerValue === null || lowerValue === undefined ? min : Number(lowerValue);
  const upperNum = upperValue === '' || upperValue === null || upperValue === undefined ? max : Number(upperValue);

  const lowerPercent = ((lowerNum - min) / (max - min)) * 100;
  const upperPercent = ((upperNum - min) / (max - min)) * 100;

  const handleMouseDown = (type) => {
    setIsDragging(type);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !sliderRef.current) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const value = Math.round((percent / 100) * (max - min) + min);

      if (isDragging === 'lower') {
        const newValue = Math.min(value, upperNum);
        onLowerChange(newValue);
      } else if (isDragging === 'upper') {
        const newValue = Math.max(value, lowerNum);
        onUpperChange(newValue);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, lowerNum, upperNum, min, max, onLowerChange, onUpperChange]);

  return (
    <div className="w-full">
      <div className="relative h-8 flex items-center mb-2">
        <div
          ref={sliderRef}
          className="relative w-full h-1 bg-gray-200 rounded-full"
        >
          {/* Active range track */}
          <div
            className="absolute h-1 bg-blue-500 rounded-full"
            style={{
              left: `${lowerPercent}%`,
              width: `${upperPercent - lowerPercent}%`,
            }}
          />
          
          {/* Lower handle */}
          <div
            className="absolute w-6 h-6 -mt-2.5 cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${lowerPercent}% - 12px)` }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown('lower');
            }}
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>

          {/* Upper handle */}
          <div
            className="absolute w-6 h-6 -mt-2.5 cursor-grab active:cursor-grabbing"
            style={{ left: `calc(${upperPercent}% - 12px)` }}
            onMouseDown={(e) => {
              e.preventDefault();
              handleMouseDown('upper');
            }}
          >
            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value display and manual inputs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-500 w-8">From:</span>
          <input
            type="number"
            name={lowerName}
            value={lowerValue !== '' && lowerValue !== null && lowerValue !== undefined ? lowerValue : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(min, Math.min(upperNum, Number(e.target.value) || min));
              onLowerChange(val);
            }}
            min={min}
            max={max}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs text-gray-500 w-8">To:</span>
          <input
            type="number"
            name={upperName}
            value={upperValue !== '' && upperValue !== null && upperValue !== undefined ? upperValue : ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : Math.max(lowerNum, Math.min(max, Number(e.target.value) || max));
              onUpperChange(val);
            }}
            min={min}
            max={max}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="text-xs text-gray-400">0 - 100</div>
      </div>
    </div>
  );
};

const CustomFlagModal = ({ isOpen, onClose, flag = null, onSubmit, loading, error }) => {
  const dispatch = useDispatch();
  const { channels } = useSelector((state) => state.channels);
  
  const [formData, setFormData] = useState({
    channel: '',
    transcription_keywords: [],
    summary_keywords: [],
    sentiment_min_lower: '',
    sentiment_min_upper: '',
    sentiment_max_lower: '',
    sentiment_max_upper: '',
    iab_topics: [],
    bucket_prompt: [],
    general_topics: [],
    is_active: true,
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [summaryKeywordInput, setSummaryKeywordInput] = useState('');
  const [iabTopicInput, setIabTopicInput] = useState('');
  const [bucketPromptInput, setBucketPromptInput] = useState('');
  const [generalTopicInput, setGeneralTopicInput] = useState('');

  // Suggestions state
  const [transcriptionSuggestions, setTranscriptionSuggestions] = useState([]);
  const [summarySuggestions, setSummarySuggestions] = useState([]);
  const [iabSuggestions, setIabSuggestions] = useState([]);
  const [bucketSuggestions, setBucketSuggestions] = useState([]);
  const [generalSuggestions, setGeneralSuggestions] = useState([]);

  // Edit state for lists
  const [editingList, setEditingList] = useState(null);
  const [editingListType, setEditingListType] = useState(null);
  const [editingListItems, setEditingListItems] = useState([]);
  const [editingItemIndex, setEditingItemIndex] = useState(null);
  const [editingItemValue, setEditingItemValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchChannels());
      
      if (flag) {
        // Normalize list fields - ensure they're arrays of arrays for display
        const normalizeListField = (field) => {
          if (!Array.isArray(field)) return [];
          return field.map(item => {
            // If already an array, return as is
            if (Array.isArray(item)) return item;
            // If string, wrap in array
            return [item];
          });
        };

        setFormData({
          channel: flag.channel || '',
          transcription_keywords: normalizeListField(flag.transcription_keywords || []),
          summary_keywords: normalizeListField(flag.summary_keywords || []),
          sentiment_min_lower: flag.sentiment_min_lower !== null && flag.sentiment_min_lower !== undefined ? flag.sentiment_min_lower : '',
          sentiment_min_upper: flag.sentiment_min_upper !== null && flag.sentiment_min_upper !== undefined ? flag.sentiment_min_upper : '',
          sentiment_max_lower: flag.sentiment_max_lower !== null && flag.sentiment_max_lower !== undefined ? flag.sentiment_max_lower : '',
          sentiment_max_upper: flag.sentiment_max_upper !== null && flag.sentiment_max_upper !== undefined ? flag.sentiment_max_upper : '',
          iab_topics: normalizeListField(flag.iab_topics || []),
          bucket_prompt: normalizeListField(flag.bucket_prompt || []),
          general_topics: normalizeListField(flag.general_topics || []),
          is_active: flag.is_active !== undefined ? flag.is_active : true,
        });
      } else {
        const channelId = localStorage.getItem('channelId');
        setFormData({
          channel: channelId || '',
          transcription_keywords: [],
          summary_keywords: [],
          sentiment_min_lower: '',
          sentiment_min_upper: '',
          sentiment_max_lower: '',
          sentiment_max_upper: '',
          iab_topics: [],
          bucket_prompt: [],
          general_topics: [],
          is_active: true,
        });
      }
      setKeywordInput('');
      setSummaryKeywordInput('');
      setIabTopicInput('');
      setBucketPromptInput('');
      setGeneralTopicInput('');
      setEditingList(null);
      setEditingListType(null);
      setEditingListItems([]);
    }
  }, [isOpen, flag, dispatch]);

  // Generate suggestions based on previous items (only from second item onwards)
  const generateSuggestions = (currentList, inputValue) => {
    // Only show suggestions if there's at least one item already (second item onwards)
    if (currentList.length === 0 || !inputValue.trim()) return [];
    
    const input = inputValue.toLowerCase().trim();
    const suggestions = currentList
      .filter(item => {
        const itemStr = Array.isArray(item) ? item.join(' ').toLowerCase() : String(item).toLowerCase();
        return itemStr.includes(input) && itemStr !== input;
      })
      .slice(0, 5); // Limit to 5 suggestions
    
    return suggestions;
  };

  // Update suggestions when input changes (only show from second item onwards)
  useEffect(() => {
    // Only show suggestions if there's at least one item already (when adding second item)
    if (formData.transcription_keywords.length >= 1 && keywordInput.trim()) {
      setTranscriptionSuggestions(generateSuggestions(formData.transcription_keywords, keywordInput));
    } else {
      setTranscriptionSuggestions([]);
    }
  }, [keywordInput, formData.transcription_keywords]);

  useEffect(() => {
    if (formData.summary_keywords.length >= 1 && summaryKeywordInput.trim()) {
      setSummarySuggestions(generateSuggestions(formData.summary_keywords, summaryKeywordInput));
    } else {
      setSummarySuggestions([]);
    }
  }, [summaryKeywordInput, formData.summary_keywords]);

  useEffect(() => {
    if (formData.iab_topics.length >= 1 && iabTopicInput.trim()) {
      setIabSuggestions(generateSuggestions(formData.iab_topics, iabTopicInput));
    } else {
      setIabSuggestions([]);
    }
  }, [iabTopicInput, formData.iab_topics]);

  useEffect(() => {
    if (formData.bucket_prompt.length >= 1 && bucketPromptInput.trim()) {
      setBucketSuggestions(generateSuggestions(formData.bucket_prompt, bucketPromptInput));
    } else {
      setBucketSuggestions([]);
    }
  }, [bucketPromptInput, formData.bucket_prompt]);

  useEffect(() => {
    if (formData.general_topics.length >= 1 && generalTopicInput.trim()) {
      setGeneralSuggestions(generateSuggestions(formData.general_topics, generalTopicInput));
    } else {
      setGeneralSuggestions([]);
    }
  }, [generalTopicInput, formData.general_topics]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user changes the field that has an error
    if (error && typeof error === 'object' && error[name]) {
      // Error will be cleared by the parent component's clearError action
      // This is just for visual feedback
    }
  };

  const handleSuggestionClick = (suggestion, type) => {
    const suggestionValue = Array.isArray(suggestion) ? suggestion.join(', ') : String(suggestion);
    switch(type) {
      case 'transcription':
        setKeywordInput(suggestionValue);
        break;
      case 'summary':
        setSummaryKeywordInput(suggestionValue);
        break;
      case 'iab':
        setIabTopicInput(suggestionValue);
        break;
      case 'bucket':
        setBucketPromptInput(suggestionValue);
        break;
      case 'general':
        setGeneralTopicInput(suggestionValue);
        break;
    }
  };

  const handleAddTranscriptionKeyword = () => {
    if (keywordInput.trim()) {
      // Split by comma and create array of arrays format
      const keywords = keywordInput.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [keywordInput.trim()];
      
      setFormData(prev => ({
        ...prev,
        transcription_keywords: [...prev.transcription_keywords, keywordArray]
      }));
      setKeywordInput('');
      setTranscriptionSuggestions([]);
    }
  };

  const handleRemoveTranscriptionKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      transcription_keywords: prev.transcription_keywords.filter((_, i) => i !== index)
    }));
  };

  const handleEditList = (listType, items, itemIndex = null) => {
    setEditingListType(listType);
    setEditingListItems([...items]);
    setEditingList(true);
    // If itemIndex is provided, open that item in edit mode
    if (itemIndex !== null && itemIndex >= 0 && itemIndex < items.length) {
      const item = items[itemIndex];
      const displayText = Array.isArray(item) ? item.join(', ') : String(item);
      setEditingItemIndex(itemIndex);
      setEditingItemValue(displayText);
    } else {
      setEditingItemIndex(null);
      setEditingItemValue('');
    }
  };

  const handleSaveEditedList = () => {
    if (editingListType) {
      setFormData(prev => ({
        ...prev,
        [editingListType]: editingListItems
      }));
    }
    setEditingList(false);
    setEditingListType(null);
    setEditingListItems([]);
  };

  const handleCancelEditList = () => {
    setEditingList(false);
    setEditingListType(null);
    setEditingListItems([]);
    setEditingItemIndex(null);
    setEditingItemValue('');
  };

  const handleAddItemToEditingList = (value) => {
    if (value.trim()) {
      // Split by comma and create array format
      const keywords = value.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [value.trim()];
      setEditingListItems(prev => [...prev, keywordArray]);
    }
  };

  const handleRemoveItemFromEditingList = (index) => {
    setEditingListItems(prev => prev.filter((_, i) => i !== index));
    if (editingItemIndex === index) {
      setEditingItemIndex(null);
      setEditingItemValue('');
    } else if (editingItemIndex > index) {
      setEditingItemIndex(editingItemIndex - 1);
    }
  };

  const handleStartEditItem = (index, item) => {
    const displayText = Array.isArray(item) ? item.join(', ') : String(item);
    setEditingItemIndex(index);
    setEditingItemValue(displayText);
  };

  const handleSaveEditItem = (index) => {
    if (editingItemValue.trim()) {
      setEditingListItems(prev => {
        const newItems = [...prev];
        // Split by comma and create array format
        const keywords = editingItemValue.split(',').map(k => k.trim()).filter(k => k);
        newItems[index] = keywords.length > 0 ? keywords : [editingItemValue.trim()];
        return newItems;
      });
      setEditingItemIndex(null);
      setEditingItemValue('');
    }
  };

  const handleCancelEditItem = () => {
    setEditingItemIndex(null);
    setEditingItemValue('');
  };

  const handleAddSummaryKeyword = () => {
    if (summaryKeywordInput.trim()) {
      // Split by comma and create array of arrays format
      const keywords = summaryKeywordInput.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [summaryKeywordInput.trim()];
      
      setFormData(prev => ({
        ...prev,
        summary_keywords: [...prev.summary_keywords, keywordArray]
      }));
      setSummaryKeywordInput('');
      setSummarySuggestions([]);
    }
  };

  const handleRemoveSummaryKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      summary_keywords: prev.summary_keywords.filter((_, i) => i !== index)
    }));
  };

  const handleAddIabTopic = () => {
    if (iabTopicInput.trim()) {
      // Split by comma and create array of arrays format
      const keywords = iabTopicInput.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [iabTopicInput.trim()];
      
      setFormData(prev => ({
        ...prev,
        iab_topics: [...prev.iab_topics, keywordArray]
      }));
      setIabTopicInput('');
      setIabSuggestions([]);
    }
  };

  const handleRemoveIabTopic = (index) => {
    setFormData(prev => ({
      ...prev,
      iab_topics: prev.iab_topics.filter((_, i) => i !== index)
    }));
  };

  const handleAddBucketPrompt = () => {
    if (bucketPromptInput.trim()) {
      // Split by comma and create array of arrays format
      const keywords = bucketPromptInput.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [bucketPromptInput.trim()];
      
      setFormData(prev => ({
        ...prev,
        bucket_prompt: [...prev.bucket_prompt, keywordArray]
      }));
      setBucketPromptInput('');
      setBucketSuggestions([]);
    }
  };

  const handleRemoveBucketPrompt = (index) => {
    setFormData(prev => ({
      ...prev,
      bucket_prompt: prev.bucket_prompt.filter((_, i) => i !== index)
    }));
  };

  const handleAddGeneralTopic = () => {
    if (generalTopicInput.trim()) {
      // Split by comma and create array of arrays format
      const keywords = generalTopicInput.split(',').map(k => k.trim()).filter(k => k);
      const keywordArray = keywords.length > 0 ? keywords : [generalTopicInput.trim()];
      
      setFormData(prev => ({
        ...prev,
        general_topics: [...prev.general_topics, keywordArray]
      }));
      setGeneralTopicInput('');
      setGeneralSuggestions([]);
    }
  };

  const handleRemoveGeneralTopic = (index) => {
    setFormData(prev => ({
      ...prev,
      general_topics: prev.general_topics.filter((_, i) => i !== index)
    }));
  };

  // Transform list fields to ensure they're arrays of arrays
  const transformListField = (field) => {
    if (!Array.isArray(field)) return [];
    return field.map(item => {
      // If already an array, return as is
      if (Array.isArray(item)) return item;
      // If string, check if it contains commas and split, otherwise wrap in array
      if (typeof item === 'string') {
        const parts = item.split(',').map(p => p.trim()).filter(p => p);
        return parts.length > 0 ? parts : [item];
      }
      // For other types, wrap in array
      return [item];
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      channel: parseInt(formData.channel),
      sentiment_min_lower: formData.sentiment_min_lower !== '' && formData.sentiment_min_lower !== null && formData.sentiment_min_lower !== undefined ? Number(formData.sentiment_min_lower) : null,
      sentiment_min_upper: formData.sentiment_min_upper !== '' && formData.sentiment_min_upper !== null && formData.sentiment_min_upper !== undefined ? Number(formData.sentiment_min_upper) : null,
      sentiment_max_lower: formData.sentiment_max_lower !== '' && formData.sentiment_max_lower !== null && formData.sentiment_max_lower !== undefined ? Number(formData.sentiment_max_lower) : null,
      sentiment_max_upper: formData.sentiment_max_upper !== '' && formData.sentiment_max_upper !== null && formData.sentiment_max_upper !== undefined ? Number(formData.sentiment_max_upper) : null,
      // Transform list fields to array of arrays format
      transcription_keywords: transformListField(formData.transcription_keywords),
      summary_keywords: transformListField(formData.summary_keywords),
      iab_topics: transformListField(formData.iab_topics),
      bucket_prompt: transformListField(formData.bucket_prompt),
      general_topics: transformListField(formData.general_topics),
    };
    // Remove name from submitData if it exists
    delete submitData.name;
    onSubmit(submitData);
  };

  const getListFieldName = (listType) => {
    const mapping = {
      'transcription_keywords': 'Transcription Keywords',
      'summary_keywords': 'Summary Keywords',
      'iab_topics': 'IAB Topics',
      'bucket_prompt': 'Bucket Prompt',
      'general_topics': 'General Topics'
    };
    return mapping[listType] || listType;
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {flag ? 'Edit Custom Flag' : 'Create Custom Flag'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Channel *
                </label>
                <select
                  name="channel"
                  value={formData.channel}
                  onChange={handleInputChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a channel</option>
                  {channels.map((channel) => (
                    <option key={channel.id} value={channel.id}>
                      {channel.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment Min Range
                </label>
                <DualRangeSlider
                  min={0}
                  max={100}
                  lowerValue={formData.sentiment_min_lower}
                  upperValue={formData.sentiment_min_upper}
                  onLowerChange={(value) => setFormData(prev => ({ ...prev, sentiment_min_lower: value }))}
                  onUpperChange={(value) => setFormData(prev => ({ ...prev, sentiment_min_upper: value }))}
                  lowerName="sentiment_min_lower"
                  upperName="sentiment_min_upper"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sentiment Max Range
                </label>
                <DualRangeSlider
                  min={0}
                  max={100}
                  lowerValue={formData.sentiment_max_lower}
                  upperValue={formData.sentiment_max_upper}
                  onLowerChange={(value) => setFormData(prev => ({ ...prev, sentiment_max_lower: value }))}
                  onUpperChange={(value) => setFormData(prev => ({ ...prev, sentiment_max_upper: value }))}
                  lowerName="sentiment_max_lower"
                  upperName="sentiment_max_upper"
                />
              </div>
            </div>

            {/* Transcription Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Transcription Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={keywordInput}
                    onChange={(e) => setKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTranscriptionKeyword())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter keyword"
                  />
                  {transcriptionSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {transcriptionSuggestions.map((suggestion, idx) => {
                        const displayText = Array.isArray(suggestion) ? suggestion.join(', ') : String(suggestion);
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion, 'transcription')}
                            className="w-full text-left px-3 py-2 hover:bg-blue-50 text-sm text-gray-700"
                          >
                            {displayText}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddTranscriptionKeyword}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {formData.transcription_keywords.map((keyword, index) => {
                  const displayText = Array.isArray(keyword) ? keyword.join(', ') : keyword;
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      <button
                        type="button"
                        onClick={() => handleEditList('transcription_keywords', formData.transcription_keywords, index)}
                        className="hover:bg-blue-200 cursor-pointer transition-colors rounded-l-full -ml-3 -mr-1 px-3 py-1"
                      >
                        {displayText}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTranscriptionKeyword(index);
                        }}
                        className="text-blue-600 hover:text-blue-800 ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Summary Keywords */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Summary Keywords
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={summaryKeywordInput}
                    onChange={(e) => setSummaryKeywordInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSummaryKeyword())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter keyword"
                  />
                  {summarySuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {summarySuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion, 'summary')}
                          className="w-full text-left px-3 py-2 hover:bg-green-50 text-sm text-gray-700"
                        >
                          {String(suggestion)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddSummaryKeyword}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {formData.summary_keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleEditList('summary_keywords', formData.summary_keywords, index)}
                      className="hover:bg-green-200 cursor-pointer transition-colors rounded-l-full -ml-3 -mr-1 px-3 py-1"
                    >
                      {keyword}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSummaryKeyword(index);
                      }}
                      className="text-green-600 hover:text-green-800 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* IAB Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IAB Topics
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={iabTopicInput}
                    onChange={(e) => setIabTopicInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIabTopic())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter IAB topic"
                  />
                  {iabSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {iabSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion, 'iab')}
                          className="w-full text-left px-3 py-2 hover:bg-purple-50 text-sm text-gray-700"
                        >
                          {String(suggestion)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddIabTopic}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {formData.iab_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleEditList('iab_topics', formData.iab_topics, index)}
                      className="hover:bg-purple-200 cursor-pointer transition-colors rounded-l-full -ml-3 -mr-1 px-3 py-1"
                    >
                      {topic}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveIabTopic(index);
                      }}
                      className="text-purple-600 hover:text-purple-800 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bucket Prompt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bucket Prompt
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={bucketPromptInput}
                    onChange={(e) => setBucketPromptInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBucketPrompt())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter bucket prompt"
                  />
                  {bucketSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {bucketSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion, 'bucket')}
                          className="w-full text-left px-3 py-2 hover:bg-yellow-50 text-sm text-gray-700"
                        >
                          {String(suggestion)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddBucketPrompt}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {formData.bucket_prompt.map((prompt, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleEditList('bucket_prompt', formData.bucket_prompt, index)}
                      className="hover:bg-yellow-200 cursor-pointer transition-colors rounded-l-full -ml-3 -mr-1 px-3 py-1"
                    >
                      {prompt}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveBucketPrompt(index);
                      }}
                      className="text-yellow-600 hover:text-yellow-800 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* General Topics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                General Topics
              </label>
              <div className="flex gap-2 mb-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={generalTopicInput}
                    onChange={(e) => setGeneralTopicInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGeneralTopic())}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter general topic"
                  />
                  {generalSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                      {generalSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion, 'general')}
                          className="w-full text-left px-3 py-2 hover:bg-indigo-50 text-sm text-gray-700"
                        >
                          {String(suggestion)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddGeneralTopic}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                {formData.general_topics.map((topic, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                  >
                    <button
                      type="button"
                      onClick={() => handleEditList('general_topics', formData.general_topics, index)}
                      className="hover:bg-indigo-200 cursor-pointer transition-colors rounded-l-full -ml-3 -mr-1 px-3 py-1"
                    >
                      {topic}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveGeneralTopic(index);
                      }}
                      className="text-indigo-600 hover:text-indigo-800 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Is Active */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                Active
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : flag ? 'Update Flag' : 'Create Flag'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Edit List Modal */}
      {editingList && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Edit {getListFieldName(editingListType)}
              </h3>
              <button
                onClick={handleCancelEditList}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  id="edit-list-input"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItemToEditingList(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add new item"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = document.getElementById('edit-list-input');
                    if (input && input.value.trim()) {
                      handleAddItemToEditingList(input.value);
                      input.value = '';
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2">
                {editingListItems.map((item, index) => {
                  const displayText = Array.isArray(item) ? item.join(', ') : String(item);
                  const isEditing = editingItemIndex === index;
                  
                  return (
                    <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editingItemValue}
                            onChange={(e) => setEditingItemValue(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEditItem(index);
                              } else if (e.key === 'Escape') {
                                handleCancelEditItem();
                              }
                            }}
                            className="flex-1 border border-blue-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveEditItem(index)}
                            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
                            title="Save"
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            onClick={handleCancelEditItem}
                            className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                            title="Cancel"
                          >
                            ✕
                          </button>
                        </>
                      ) : (
                        <>
                          <span 
                            className="flex-1 text-sm text-gray-700 cursor-pointer hover:text-blue-600"
                            onClick={() => handleStartEditItem(index, item)}
                            title="Click to edit"
                          >
                            {displayText}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItemFromEditingList(index)}
                            className="text-red-600 hover:text-red-800 px-2"
                            title="Remove"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancelEditList}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedList}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CustomFlagModal;
