import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Plus, Trash2, RefreshCw } from 'lucide-react';
import { 
  fetchCategoryTitles, 
  createTitleRule, 
  deleteTitleRule,
  clearError 
} from '../../store/slices/audioManagementSlice';

const TitleRulesModal = ({ isOpen, onClose, category }) => {
  const dispatch = useDispatch();
  const { currentCategoryTitles, titleLoading, titleError, loading } = useSelector(state => state.audioManagement);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    before_title: '',
    after_title: '',
    skip_transcription: true,
    is_active: true,
    notes: ''
  });

  useEffect(() => {
    if (category && isOpen) {
      dispatch(fetchCategoryTitles(category.id));
    }
  }, [category, isOpen, dispatch]);

  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  const handleRefresh = () => {
    if (category) {
      dispatch(fetchCategoryTitles(category.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (category) {
      dispatch(createTitleRule({
        ...formData,
        category: category.id
      }))
        .unwrap()
        .then(() => {
          setFormData({
            before_title: '',
            after_title: '',
            skip_transcription: true,
            is_active: true,
            notes: ''
          });
          setShowAddForm(false);
        })
        .catch(() => {});
    }
  };

  const handleDeleteTitle = (titleId) => {
    if (window.confirm('Are you sure you want to delete this title rule?')) {
      dispatch(deleteTitleRule(titleId));
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Title Rules - {category?.name}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{category?.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {titleError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{titleError}</p>
            </div>
          )}

          {/* Add Title Rule Form */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Title Rule</span>
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h4 className="font-medium text-gray-900">Add New Title Rule</h4>
              
              <div>
                <label htmlFor="before_title" className="block text-sm font-medium text-gray-700 mb-1">
                  Before Title *
                </label>
                <input
                  type="text"
                  id="before_title"
                  name="before_title"
                  required
                  value={formData.before_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter before title text"
                />
              </div>
              <div>
                <label htmlFor="after_title" className="block text-sm font-medium text-gray-700 mb-1">
                  After Title *
                </label>
                <input
                  type="text"
                  id="after_title"
                  name="after_title"
                  required
                  value={formData.after_title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter after title text"
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter notes"
                />
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="skip_transcription"
                    name="skip_transcription"
                    checked={formData.skip_transcription}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="skip_transcription" className="ml-2 block text-sm text-gray-700">
                    Skip Transcription
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding...' : 'Add Rule'}
                </button>
              </div>
            </form>
          )}

          {/* Title Rules List */}
          {titleLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : currentCategoryTitles?.title_mapping_rules?.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-900">
                  Title Rules ({currentCategoryTitles.count})
                </h4>
              </div>
              
              {currentCategoryTitles.title_mapping_rules.map((rule) => (
                <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center space-x-2">
                        <h5 className="font-medium text-gray-900">{rule.before_title} {rule.after_title ? `- ${rule.after_title}` : ''}</h5>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          rule.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {rule.is_active ? 'Active' : 'Inactive'}
                        </span>
                        {rule.skip_transcription && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Skip Transcription
                          </span>
                        )}
                      </div>
                      {rule.notes && (
                        <p className="text-sm text-gray-600">{rule.notes}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        Created: { rule.created_at }
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteTitle(rule.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 p-1 rounded transition-colors ml-4"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-600">No title rules found for this category.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TitleRulesModal;