import { useDispatch, useSelector } from 'react-redux';
import { closeModal } from '../../store/slices/topicModalSlice';
import { X } from 'lucide-react';

const TopicModal = () => {
  const dispatch = useDispatch();
  const { isOpen, topicName, audioSegments, loading, error } = useSelector((state) => state.topicModal);
  const apiUrl = import.meta.env.VITE_API_URL || 'https://radio.reloop.pro/api';

  if (!isOpen) return null;

  const handleClose = () => {
    dispatch(closeModal());
  };

  const getTitle = (segment) => {
    if (segment.title) return segment.title;
    return `${segment.title_before || ''} ${segment.title_after || ''}`.trim();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">
            Audio Segments for "{topicName}"
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading audio segments...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {!loading && !error && audioSegments.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              No audio segments found for this topic.
            </div>
          )}

          {!loading && !error && audioSegments.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      File Path
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      General Topics
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sentiment
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {audioSegments.map((segment) => (
                    <tr key={segment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {segment.id}
                      </td>
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-500">
                        <a
                          href={`${apiUrl}/${segment.file_path}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          Link
                        </a>
                      </td> */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getTitle(segment)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {segment.analysis?.general_topics || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {segment.analysis?.sentiment || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopicModal;