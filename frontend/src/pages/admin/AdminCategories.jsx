import { useState, useEffect } from 'react';
import {
  getAdminCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminProducts
} from '../../services/adminService';
import {
  Plus,
  Edit2,
  Trash2,
  FolderTree,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  XCircle
} from 'lucide-react';
import './AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true,
  });
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [cats, prods] = await Promise.all([
        getAdminCategories(),
        getAdminProducts(),
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (err) {
      console.error('Failed to load categories:', err);
      setError('Unable to load categories. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAdminCategories(),
      getAdminProducts(),
    ])
      .then(([cats, prods]) => {
        if (isMounted) {
          setCategories(Array.isArray(cats) ? cats : []);
          setProducts(Array.isArray(prods) ? prods : []);
          setError('');
        }
      })
      .catch((err) => {
        console.error('Failed to load categories:', err);
        if (isMounted) setError('Unable to load categories. Please check server connection.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3500);
  };

  const openCreateModal = () => {
    setEditingCategoryId(null);
    setFormData({
      name: '',
      description: '',
      active: true,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategoryId(category.id);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      active: category.active !== false,
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim()) {
      setModalError('Category Name is required.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      active: formData.active,
    };

    setModalSaving(true);
    try {
      if (editingCategoryId) {
        const updated = await updateCategory(editingCategoryId, payload);
        setCategories((prev) =>
          prev.map((c) => (c.id === editingCategoryId ? updated : c))
        );
        showNotification(`Category "${payload.name}" updated successfully!`);
      } else {
        const created = await createCategory(payload);
        setCategories((prev) => [...prev, created]);
        showNotification(`Category "${payload.name}" created successfully!`);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save category:', err);
      setModalError(err.response?.data?.message || 'Error saving category.');
    } finally {
      setModalSaving(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Deactivate category "${category.name}"?`)) {
      return;
    }
    try {
      await deleteCategory(category.id);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, active: false } : c))
      );
      showNotification(`Category "${category.name}" deactivated.`);
    } catch (err) {
      console.error('Failed to delete category:', err);
      alert('Failed to deactivate category: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleActive = async (category) => {
    const nextStatus = !category.active;
    try {
      const updated = await updateCategory(category.id, {
        ...category,
        active: nextStatus,
      });
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? updated : c))
      );
      showNotification(
        `Category "${category.name}" is now ${nextStatus ? 'Active' : 'Disabled'}.`
      );
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Failed to update category status.');
    }
  };

  const countProductsInCat = (catId) => {
    return products.filter((p) => p.categoryId === catId).length;
  };

  return (
    <div className="admin-categories-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories</h1>
          <p className="admin-page-subtitle">
            Organize traditional grocery lines, whole grains, pulses, and flours.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={loadData}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Category</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="admin-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="admin-alert-error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Loading categories...</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="empty-section-card">
          <FolderTree size={40} className="empty-icon" />
          <p>No categories found. Click "Add Category" above to create one.</p>
        </div>
      ) : (
        <div className="categories-grid-cards">
          {categories.map((cat) => {
            const productCount = countProductsInCat(cat.id);
            return (
              <div key={cat.id} className="category-item-card">
                <div className="category-item-header">
                  <div className="category-icon-box">
                    <FolderTree size={20} />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(cat)}
                    className={`status-toggle-badge ${cat.active ? 'active' : 'inactive'}`}
                    title={cat.active ? 'Click to disable' : 'Click to activate'}
                  >
                    {cat.active ? (
                      <>
                        <CheckCircle2 size={13} />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        <span>Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="category-item-body">
                  <h3 className="category-item-title">{cat.name}</h3>
                  <p className="category-item-desc">
                    {cat.description || 'Traditional food products and staples.'}
                  </p>
                  <span className="category-count-label">
                    <strong>{productCount}</strong> {productCount === 1 ? 'Product' : 'Products'} listed
                  </span>
                </div>

                <div className="category-item-footer">
                  <div className="item-actions-row">
                    <button
                      type="button"
                      className="btn-icon-action btn-edit-action"
                      onClick={() => openEditModal(cat)}
                      title="Edit Category"
                    >
                      <Edit2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="btn-icon-action btn-delete-action"
                      onClick={() => handleDeleteCategory(cat)}
                      title="Deactivate Category"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-container category-modal-width">
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingCategoryId ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div className="admin-alert-error" role="alert">
                <AlertTriangle size={16} />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCategory} className="admin-modal-body">
              <div className="form-group">
                <label htmlFor="cat-name">
                  Category Name <span className="req-star">*</span>
                </label>
                <input
                  id="cat-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Traditional Flours &amp; Atta"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="cat-desc">Description</label>
                <textarea
                  id="cat-desc"
                  className="form-input form-textarea"
                  rows={3}
                  placeholder="Summary of products belonging to this category..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-custom-label">
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Active on Customer Storefront</span>
                </label>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={modalSaving}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={modalSaving}>
                  {modalSaving ? <span>Saving...</span> : <span>Save Category</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
