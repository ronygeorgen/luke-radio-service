import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, Edit3, Save, X, Trash2 } from 'lucide-react';
import { addBucket, updateBucket, deleteBucket, clearError } from '../store/slices/settingsSlice';
import Toast from './UserSide/Toast';

const BucketManager = () => {
  const dispatch = useDispatch();
  const { buckets } = useSelector(state => state.settings);
  const [isAddingBucket, setIsAddingBucket] = useState(false);
  const [editingBucket, setEditingBucket] = useState(null);
  const [newBucket, setNewBucket] = useState({ name: '', value: '', category: '' });
  const [editValues, setEditValues] = useState({});
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState('error');

  const handleAddBucket = async () => {
      if (!newBucket.name.trim() || !newBucket.value.trim()) {
        setToastMessage('Please fill in both bucket name and value');
        setToastType('error');
        return;
      }

      if (!newBucket.category) {
        setToastMessage('Please select a category');
        setToastType('error');
        return;
      }

      if (buckets.length >= 20) {
        setToastMessage('Maximum of 20 buckets allowed');
        setToastType('error');
        return;
      }

      dispatch(clearError()); // Clear any existing errors
      const result = await dispatch(addBucket({
        name: newBucket.name,
        value: newBucket.value,
        category: newBucket.category,
        prompt: newBucket.prompt || ''
      }));

      if (addBucket.fulfilled.match(result)) {
        setNewBucket({ name: '', value: '', category: '', prompt: '' });
        setIsAddingBucket(false);
        setToastMessage(null);
      } else if (addBucket.rejected.match(result)) {
        const errorMessage = result.payload || result.error?.message || 'Failed to create bucket';
        setToastMessage(errorMessage);
        setToastType('error');
        dispatch(clearError());
      }
    };

  const handleEditBucket = (bucket) => {
    setEditingBucket(bucket.id);
    setEditValues({
      name: bucket.name,
      value: bucket.value,
      category: bucket.category || '',
      prompt: bucket.prompt || ''
    });
  };

  const handleSaveEdit = async (bucketId) => {
      if (!editValues.name.trim() || !editValues.value.trim()) {
        setToastMessage('Please fill in both bucket name and value');
        setToastType('error');
        return;
      }

      if (!editValues.category) {
        setToastMessage('Please select a category');
        setToastType('error');
        return;
      }

      dispatch(clearError()); // Clear any existing errors
      const result = await dispatch(updateBucket({
        id: bucketId,
        name: editValues.name,
        value: editValues.value,
        category: editValues.category,
        prompt: editValues.prompt
      }));

      if (updateBucket.fulfilled.match(result)) {
        setEditingBucket(null);
        setEditValues({});
        setToastMessage(null);
      } else if (updateBucket.rejected.match(result)) {
        const errorMessage = result.payload || result.error?.message || 'Failed to update bucket';
        setToastMessage(errorMessage);
        setToastType('error');
        dispatch(clearError());
      }
    };

  const handleCancelEdit = () => {
    setEditingBucket(null);
    setEditValues({});
  };

  const handleDeleteBucket = async (bucketId) => {
    if (window.confirm('Are you sure you want to delete this bucket?')) {
      dispatch(clearError()); // Clear any existing errors
      const result = await dispatch(deleteBucket(bucketId));
      if (deleteBucket.fulfilled.match(result)) {
        setToastMessage(null);
      } else if (deleteBucket.rejected.match(result)) {
        const errorMessage = result.payload || result.error?.message || 'Failed to delete bucket';
        setToastMessage(errorMessage);
        setToastType('error');
        dispatch(clearError());
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
          Custom Buckets ({buckets.length}/20)
        </h3>
        {!isAddingBucket && buckets.length < 20 && (
          <button
            onClick={() => setIsAddingBucket(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Bucket</span>
          </button>
        )}
      </div>

      {/* Add New Bucket Form */}
      {isAddingBucket && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-md font-medium text-blue-900 mb-3">Add New Bucket</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Bucket Name
              </label>
              <input
                type="text"
                value={newBucket.name}
                onChange={(e) => setNewBucket(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Enter bucket name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Bucket Value
              </label>
              <textarea
                value={newBucket.value}
                onChange={(e) => setNewBucket(prev => ({ ...prev, value: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={4}
                placeholder="Enter bucket value/description"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={newBucket.category}
                onChange={(e) => setNewBucket(prev => ({ ...prev, category: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select a category</option>
                <option value="spiritual">Spiritual</option>
                <option value="community">Community</option>
                <option value="personal">Personal</option>
              </select>
            </div>
            {/* <div>
              <label className="block text-sm font-medium text-blue-800 mb-1">
                Bucket Prompt (Optional)
              </label>
              <textarea
                value={newBucket.prompt}
                onChange={(e) => setNewBucket(prev => ({ ...prev, prompt: e.target.value }))}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows={4}
                placeholder="Enter bucket prompt"
              />
            </div> */}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsAddingBucket(false);
                  setNewBucket({ name: '', value: '', category: '', prompt: '' });
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBucket}
                className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
              >
                <Plus className="h-3 w-3" />
                <span>Add Bucket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bucket List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {buckets.map(bucket => (
          <div key={bucket.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            {editingBucket === bucket.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket Name
                  </label>
                  <input
                    type="text"
                    value={editValues.name}
                    onChange={(e) => setEditValues(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket Value
                  </label>
                  <textarea
                    value={editValues.value}
                    onChange={(e) => setEditValues(prev => ({ ...prev, value: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={4}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editValues.category || ''}
                    onChange={(e) => setEditValues(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="">Select a category</option>
                    <option value="spiritual">Spiritual</option>
                    <option value="community">Community</option>
                    <option value="personal">Personal</option>
                  </select>
                </div>
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bucket Prompt (Optional)
                  </label>
                  <textarea
                    value={editValues.prompt}
                    onChange={(e) => setEditValues(prev => ({ ...prev, prompt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    rows={4}
                  />
                </div> */}
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveEdit(bucket.id)}
                    className="flex items-center space-x-1 px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">{bucket.name}</h4>
                    {bucket.category && (
                      <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-800 capitalize">
                        {bucket.category}
                      </span>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => handleEditBucket(bucket)}
                      className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteBucket(bucket.id)}
                      className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="text-sm text-gray-600 break-words">
                  <div className="bg-gray-50 p-3 rounded border max-h-32 overflow-y-auto">
                    {bucket.value}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {buckets.length === 0 && !isAddingBucket && (
        <div className="text-center py-8">
          <div className="bg-gray-50 rounded-lg p-6">
            <h4 className="text-md font-medium text-gray-900 mb-2">No custom buckets created</h4>
            <p className="text-gray-600 mb-4">Create custom buckets to organize your content</p>
            <button
              onClick={() => setIsAddingBucket(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add First Bucket</span>
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <Toast
          message={toastMessage}
          onClose={() => setToastMessage(null)}
          type={toastType}
        />
      )}
    </div>
  );
};

export default BucketManager;