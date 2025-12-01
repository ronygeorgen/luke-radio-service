// pages/admin/CustomFlagModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChannels } from '../../store/slices/channelSlice';

const CustomFlagModal = ({ isOpen, onClose, flag = null, onSubmit, loading, error }) => {
  
  const [formData, setFormData] = useState({
    name: '',
    channel: '',
    transcription_keywords: [],
    summary_keywords: [],
    sentiment_min: '',
    sentiment_max: '',
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

  useEffect(() => {
    if (isOpen) {
      // Get channel from localStorage
      const channelId = localStorage.getItem('channelId');
      
      if (flag) {
        setFormData({
          name: flag.name || '',
          channel: flag.channel || channelId || '',
          transcription_keywords: flag.transcription_keywords || [],
          summary_keywords: flag.summary_keywords || [],
          sentiment_min: flag.sentiment_min !== null && flag.sentiment_min !== undefined ? flag.sentiment_min : '',
          sentiment_max: flag.sentiment_max !== null && flag.sentiment_max !== undefined ? flag.sentiment_max : '',
          iab_topics: flag.iab_topics || [],
          bucket_prompt: flag.bucket_prompt || [],
          general_topics: flag.general_topics || [],
          is_active: flag.is_active !== undefined ? flag.is_active : true,
        });
      } else {
        setFormData({
          name: '',
          channel: channelId || '',
          transcription_keywords: [],
          summary_keywords: [],
          sentiment_min: '',
          sentiment_max: '',
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
    }
  }, [isOpen, flag]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTranscriptionKeyword = () => {
    if (keywordInput.trim()) {
      setFormData(prev => ({
        ...prev,
        transcription_keywords: [...prev.transcription_keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const handleRemoveTranscriptionKeyword = (index) => {
    setFormData(prev => ({
      ...prev,
      transcription_keywords: prev.transcription_keywords.filter((_, i) => i !== index)
    }));
  };

  const handleAddSummaryKeyword = () => {
    if (summaryKeywordInput.trim()) {
      setFormData(prev => ({
        ...prev,
        summary_keywords: [...prev.summary_keywords, summaryKeywordInput.trim()]
      }));
      setSummaryKeywordInput('');
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
      setFormData(prev => ({
        ...prev,
        iab_topics: [...prev.iab_topics, iabTopicInput.trim()]
      }));
      setIabTopicInput('');
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
      setFormData(prev => ({
        ...prev,
        bucket_prompt: [...prev.bucket_prompt, bucketPromptInput.trim()]
      }));
      setBucketPromptInput('');
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
      setFormData(prev => ({
        ...prev,
        general_topics: [...prev.general_topics, generalTopicInput.trim()]
      }));
      setGeneralTopicInput('');
    }
  };

  const handleRemoveGeneralTopic = (index) => {
    setFormData(prev => ({
      ...prev,
      general_topics: prev.general_topics.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Get channel from localStorage if not already set in formData
    const channelId = formData.channel || localStorage.getItem('channelId');
    const submitData = {
      ...formData,
      channel: parseInt(channelId),
      sentiment_min: formData.sentiment_min !== '' ? parseFloat(formData.sentiment_min) : null,
      sentiment_max: formData.sentiment_max !== '' ? parseFloat(formData.sentiment_max) : null,
    };
    onSubmit(submitData);
  };

  if (!isOpen) return null;

  return (
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
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">
                {typeof error === 'object' ? JSON.stringify(error) : error}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter flag name"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment Min
              </label>
              <input
                type="number"
                name="sentiment_min"
                value={formData.sentiment_min}
                onChange={handleInputChange}
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="-1.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sentiment Max
              </label>
              <input
                type="number"
                name="sentiment_max"
                value={formData.sentiment_max}
                onChange={handleInputChange}
                step="0.1"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="1.0"
              />
            </div>
          </div>

          {/* Transcription Keywords */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transcription Keywords
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTranscriptionKeyword())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter keyword"
              />
              <button
                type="button"
                onClick={handleAddTranscriptionKeyword}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.transcription_keywords.map((keyword, index) => {
                const displayText = Array.isArray(keyword) ? keyword.join(', ') : keyword;
                return (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {displayText}
                    <button
                      type="button"
                      onClick={() => handleRemoveTranscriptionKeyword(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
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
              <input
                type="text"
                value={summaryKeywordInput}
                onChange={(e) => setSummaryKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSummaryKeyword())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter keyword"
              />
              <button
                type="button"
                onClick={handleAddSummaryKeyword}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.summary_keywords.map((keyword, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => handleRemoveSummaryKeyword(index)}
                    className="ml-2 text-green-600 hover:text-green-800"
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
              <input
                type="text"
                value={iabTopicInput}
                onChange={(e) => setIabTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIabTopic())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter IAB topic"
              />
              <button
                type="button"
                onClick={handleAddIabTopic}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.iab_topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveIabTopic(index)}
                    className="ml-2 text-purple-600 hover:text-purple-800"
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
              <input
                type="text"
                value={bucketPromptInput}
                onChange={(e) => setBucketPromptInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBucketPrompt())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter bucket prompt"
              />
              <button
                type="button"
                onClick={handleAddBucketPrompt}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.bucket_prompt.map((prompt, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm"
                >
                  {prompt}
                  <button
                    type="button"
                    onClick={() => handleRemoveBucketPrompt(index)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
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
              <input
                type="text"
                value={generalTopicInput}
                onChange={(e) => setGeneralTopicInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddGeneralTopic())}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter general topic"
              />
              <button
                type="button"
                onClick={handleAddGeneralTopic}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.general_topics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                >
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveGeneralTopic(index)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
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
  );
};

export default CustomFlagModal;

