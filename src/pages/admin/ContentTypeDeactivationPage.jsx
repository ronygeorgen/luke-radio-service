// pages/admin/ContentTypeDeactivationPage.jsx
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XCircle, Plus, RefreshCw, Trash2, Search, CheckCircle } from 'lucide-react';
import { 
  fetchContentTypeDeactivationRules, 
  createContentTypeDeactivationRule,
  deleteContentTypeDeactivationRule,
  clearError
} from '../../store/slices/contentTypeDeactivationSlice';
import ContentTypeDeactivationModal from './ContentTypeDeactivationModal';

const ContentTypeDeactivationPage = () => {
  const dispatch = useDispatch();
  const { rules, loading, error, createLoading, deleteLoading } = useSelector(state => state.contentTypeDeactivation);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isActiveFilter, setIsActiveFilter] = useState('true');
  const [ordering, setOrdering] = useState('-created_at');

  const channelId = localStorage.getItem('channelId');

  useEffect(() => {
    if (channelId) {
      const params = {
        channelId,
        search: searchQuery,
        ordering
      };
      if (isActiveFilter !== '') {
        params.isActive = isActiveFilter === 'true';
      }
      dispatch(fetchContentTypeDeactivationRules(params));
    }
  }, [dispatch, channelId, isActiveFilter, searchQuery, ordering]);

  const handleRefresh = () => {
    if (channelId) {
      const params = {
        channelId,
        search: searchQuery,
        ordering
      };
      if (isActiveFilter !== '') {
        params.isActive = isActiveFilter === 'true';
      }
      dispatch(fetchContentTypeDeactivationRules(params));
    }
  };

  const handleCreateRule = () => {
    setIsModalOpen(true);
    dispatch(clearError());
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (ruleData) => {
    dispatch(createContentTypeDeactivationRule(ruleData))
      .unwrap()
        .then(() => {
          setIsModalOpen(false);
          if (channelId) {
            const params = {
              channelId,
              search: searchQuery,
              ordering
            };
            if (isActiveFilter !== '') {
              params.isActive = isActiveFilter === 'true';
            }
            dispatch(fetchContentTypeDeactivationRules(params));
          }
        })
      .catch((error) => {
        console.error('Failed to create rule:', error);
      });
  };

  const handleDeleteRule = (rule) => {
    if (window.confirm(`Are you sure you want to delete the content type deactivation rule for "${rule.content_type}"? This action cannot be undone.`)) {
      dispatch(deleteContentTypeDeactivationRule(rule.id))
        .unwrap()
        .then(() => {
          if (channelId) {
            const params = {
              channelId,
              search: searchQuery,
              ordering
            };
            if (isActiveFilter !== '') {
              params.isActive = isActiveFilter === 'true';
            }
            dispatch(fetchContentTypeDeactivationRules(params));
          }
        })
        .catch((error) => {
          console.error('Failed to delete rule:', error);
        });
    }
  };

  if (!channelId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Please select a channel first</p>
        </div>
      </div>
    );
  }

  if (loading && rules.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search content types..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={isActiveFilter}
            onChange={(e) => setIsActiveFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
            <option value="">All</option>
          </select>
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="-created_at">Newest First</option>
            <option value="created_at">Oldest First</option>
            <option value="content_type">Content Type A-Z</option>
            <option value="-content_type">Content Type Z-A</option>
          </select>
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleCreateRule}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Create Rule</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {rules.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No content type deactivation rules found</h3>
            <p className="text-gray-600">Content type deactivation rules will appear here once they are created.</p>
          </div>
        </div>
      ) : (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">Content Type</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Created At</th>
                <th className="sw-th">Updated At</th>
                <th className="sw-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {rules.map((rule) => (
                <tr key={rule.id} className="sw-tr">
                  <td className="sw-td">
                    <div className="text-sm font-medium text-gray-900">{rule.content_type}</div>
                  </td>
                  <td className="sw-td">
                    <div className="flex items-center">
                      {rule.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${rule.is_active ? 'text-green-600' : 'text-red-600'}`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {new Date(rule.created_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-600">
                      {new Date(rule.updated_at).toLocaleString()}
                    </div>
                  </td>
                  <td className="sw-td whitespace-nowrap text-sm font-medium text-center">
                    <button
                      onClick={() => handleDeleteRule(rule)}
                      disabled={deleteLoading}
                      className="px-2 py-2 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-colors flex items-center justify-center"
                      title="Delete Rule"
                    >
                      {deleteLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ContentTypeDeactivationModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        loading={createLoading}
        error={error}
      />
    </div>
  );
};

export default ContentTypeDeactivationPage;

