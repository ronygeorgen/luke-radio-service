import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, ChevronLeft } from 'lucide-react';
import { 
    fetchReportFolders, 
    createReportFolder, 
    addSegmentToReport,
    clearReportError
} from '../../store/slices/reportSlice';

const SelectReportModal = ({ isOpen, onClose, segmentId, onCreateNew }) => {
  const dispatch = useDispatch();
  const { folders, folderLoading, folderError } = useSelector((state) => state.reports);
  const [selectedFolder, setSelectedFolder] = useState('');

  useEffect(() => {
    if (isOpen) {
      dispatch(fetchReportFolders());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (folderError) {
      setTimeout(() => dispatch(clearReportError()), 3000);
    }
  }, [folderError, dispatch]);

  const handleAddToReport = () => {
    if (selectedFolder) {
      dispatch(addSegmentToReport({ 
        folder_id: parseInt(selectedFolder), 
        audio_segment_id: segmentId 
      }))
        .unwrap()
        .then(() => {
          onClose();
        })
        .catch(() => {
          // Error handled by Redux
        });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add to Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {folderError && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {folderError}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select a report
          </label>
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={folderLoading}
          >
            <option value="">Choose a report...</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-between space-x-3">
          <button
            onClick={onCreateNew}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            + New Report
          </button>
          <button
            onClick={handleAddToReport}
            disabled={!selectedFolder || folderLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {folderLoading ? 'Adding...' : 'Add to Report'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CreateReportModal = ({ isOpen, onClose, onBack, segmentId }) => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.reports);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearReportError()), 3000);
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const channelId = localStorage.getItem('channelId');
    const payload = {
      ...formData,
      channel_id: channelId ? parseInt(channelId) : undefined
    };
    dispatch(createReportFolder(payload))
      .unwrap()
      .then((newFolder) => {
        // Add the segment to the newly created report
        dispatch(addSegmentToReport({ 
          folder_id: newFolder.data.id, 
          audio_segment_id: segmentId 
        }))
          .unwrap()
          .then(() => {
            onClose();
          });
      });
  };

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-md">
        <div className="flex items-center mb-4">
          <button onClick={onBack} className="mr-2 text-gray-400 hover:text-gray-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg font-semibold flex-1 text-center mr-5">Add to Report</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter report name"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter description (optional)"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create & Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export { SelectReportModal, CreateReportModal };