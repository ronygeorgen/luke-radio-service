import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Music, Plus, RefreshCw, Edit3, Trash2, List } from 'lucide-react';
import { 
  fetchCategories, 
  createCategory, 
  updateCategory,
  deleteCategory,
  clearError,
  fetchCategoryTitles,
  clearCurrentCategoryTitles 
} from '../../store/slices/audioManagementSlice';
import CategoryModal from './CategoryModal';
import TitleRulesModal from './TitleRulesModal';

const AudioManagement = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.audioManagement);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isTitleModalOpen, setIsTitleModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchCategories());
  };

  const handleCreateCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
    dispatch(clearError());
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setIsCategoryModalOpen(true);
    dispatch(clearError());
  };

  const handleViewTitles = (category) => {
    setSelectedCategory(category);
    dispatch(fetchCategoryTitles(category.id));
    setIsTitleModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  const handleCloseTitleModal = () => {
    setIsTitleModalOpen(false);
    setSelectedCategory(null);
    dispatch(clearCurrentCategoryTitles());
  };

  const handleDeleteCategory = (category) => {
    if (window.confirm(`Are you sure you want to delete the category "${category.name}"? This action cannot be undone.`)) {
        dispatch(deleteCategory(category.id))
        .unwrap()
        .then(() => {
            // Success - category will be removed from the list automatically
        })
        .catch((error) => {
            console.error('Failed to delete category:', error);
        });
    }
    };

  if (loading && categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="w-full flex justify-end">
          <button
            onClick={handleCreateCategory}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {categories.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">Get started by creating your first audio category.</p>
          </div>
        </div>
      ) : (
        <div className="sw-table-wrap">
          <table className="sw-table">
            <thead className="sw-thead">
              <tr>
                <th className="sw-th">Category</th>
                <th className="sw-th">Channel</th>
                <th className="sw-th">Description</th>
                <th className="sw-th">Status</th>
                <th className="sw-th">Created</th>
                <th className="sw-th text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="sw-tbody">
              {categories.map((category) => (
                <tr key={category.id} className="sw-tr">
                  <td className="sw-td whitespace-nowrap">
                    <div className="flex items-center">
                      {/* <div className="flex-shrink-0 h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <Music className="h-5 w-5 text-purple-600" />
                      </div> */}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{category.name}</div>
                      </div>
                    </div>
                  </td>
                    <td className="sw-td whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                        {category.channel_detail?.name || `Channel ${category.channel}`}
                        </div>
                    </td>
                  <td className="sw-td">
                    <div className="text-sm text-gray-900 max-w-xs truncate">{category.description}</div>
                  </td>
                  <td className="sw-td whitespace-nowrap">
                    <span className={category.is_active ? 'sw-badge-success' : 'sw-badge-danger'}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="sw-td whitespace-nowrap text-sm text-gray-500">
                    {category.created_at}
                  </td>
                  <td className="sw-td whitespace-nowrap text-sm font-medium">
                    <div className="sw-actions">
                    <button
                      onClick={() => handleViewTitles(category)}
                      className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium transition-colors inline-flex items-center"
                    >
                      <List className="h-3 w-3 mr-1" />
                      Titles
                    </button>
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-medium transition-colors inline-flex items-center"
                    >
                      <Edit3 className="h-3 w-3 mr-1" />
                      Edit
                    </button>
                    <button
                        onClick={() => handleDeleteCategory(category)}
                        className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors inline-flex items-center"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Delete
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={handleCloseCategoryModal}
        category={editingCategory}
      />

      <TitleRulesModal
        isOpen={isTitleModalOpen}
        onClose={handleCloseTitleModal}
        category={selectedCategory}
      />
    </div>
  );
};

export default AudioManagement;