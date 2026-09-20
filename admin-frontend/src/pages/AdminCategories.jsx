import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FolderTree,
  Check,
  RefreshCw,
  Upload,
} from 'lucide-react';
import adminService from '../services/adminService';
import { uploadImageToCloudinary, validateImageFile } from '../services/cloudinaryService';
import './AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Category Image Upload state
  const categoryImageRef = useRef(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState('');
  const [imageFileName, setImageFileName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageUrl: '',
    active: true,
  });

  const loadData = () => {
    setLoading(true);
    setError('');

    Promise.all([
      adminService.getAllCategories(),
      adminService.getAllProducts(),
    ])
      .then(([catList, prodList]) => {
        setCategories(catList || []);
        setProducts(prodList || []);
      })
      .catch((err) => {
        console.error('Error loading categories:', err);
        setError(err.userFriendlyMessage || 'Unable to load categories. Please check connection.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      adminService.getAllCategories(),
      adminService.getAllProducts(),
    ])
      .then(([catList, prodList]) => {
        if (!isMounted) return;
        setCategories(catList || []);
        setProducts(prodList || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading categories:', err);
        setError(err.userFriendlyMessage || 'Unable to load categories. Please check connection.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute real product count per category
  const productCountMap = useMemo(() => {
    const map = {};
    products.forEach((p) => {
      if (p.categoryId) {
        map[p.categoryId] = (map[p.categoryId] || 0) + 1;
      }
    });
    return map;
  }, [products]);

  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      imageUrl: '',
      active: true,
    });
    setFormErrors({});
    setImageUploading(false);
    setImageError('');
    setImageFileName('');
    if (categoryImageRef.current) categoryImageRef.current.value = '';
    setModalOpen(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      imageUrl: category.imageUrl || '',
      active: category.active ?? true,
    });
    setFormErrors({});
    setImageUploading(false);
    setImageError('');
    setImageFileName(category.imageUrl ? 'Current category photo' : '');
    if (categoryImageRef.current) categoryImageRef.current.value = '';
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving || imageUploading) return;
    setModalOpen(false);
    setEditingCategory(null);
    setImageUploading(false);
    setImageError('');
    setImageFileName('');
  };

  const handleCategoryImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const validationError = validateImageFile(file);
    if (validationError) {
      setImageError(validationError);
      return;
    }

    setImageError('');
    setImageUploading(true);
    setImageFileName(file.name);

    try {
      const secureUrl = await uploadImageToCloudinary(file, {
        folder: 'rudra/categories',
      });

      setFormData((prev) => ({ ...prev, imageUrl: secureUrl }));
    } catch (err) {
      console.error('Cloudinary upload error for category:', err);
      setImageError(err.message || 'Unable to upload photo. Please try again or choose another photo.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveCategoryImage = () => {
    setFormData((prev) => ({ ...prev, imageUrl: '' }));
    setImageFileName('');
    setImageError('');
    if (categoryImageRef.current) {
      categoryImageRef.current.value = '';
    }
  };

  const triggerCategoryImagePicker = () => {
    if (categoryImageRef.current) {
      categoryImageRef.current.click();
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!formData.name.trim()) {
      errs.name = 'Category name is required.';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        imageUrl: formData.imageUrl.trim(),
        active: formData.active,
      };

      if (editingCategory) {
        await adminService.updateCategory(editingCategory.id, payload);
        setFeedback({
          type: 'success',
          message: `Category "${payload.name}" updated successfully.`,
        });
      } else {
        await adminService.createCategory(payload);
        setFeedback({
          type: 'success',
          message: `Category "${payload.name}" created successfully.`,
        });
      }

      closeModal();
      loadData();
    } catch (err) {
      console.error('Error saving category:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Unable to save category.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleCategoryStatus = async (category) => {
    try {
      const newStatus = !category.active;
      const payload = {
        ...category,
        active: newStatus,
      };
      await adminService.updateCategory(category.id, payload);
      setCategories((prev) =>
        prev.map((c) => (c.id === category.id ? { ...c, active: newStatus } : c))
      );
      setFeedback({
        type: 'success',
        message: `Category "${category.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
      });
    } catch (err) {
      console.error('Error toggling category status:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Failed to update category status.',
      });
    }
  };

  const handleDeleteCategory = async (category) => {
    const count = productCountMap[category.id] || 0;
    if (count > 0) {
      if (
        !window.confirm(
          `Category "${category.name}" contains ${count} product(s). Are you sure you want to deactivate/delete it?`
        )
      ) {
        return;
      }
    } else if (!window.confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return;
    }

    try {
      await adminService.deleteCategory(category.id);
      setCategories((prev) => prev.filter((c) => c.id !== category.id));
      setFeedback({
        type: 'success',
        message: `Category "${category.name}" deleted successfully.`,
      });
    } catch (err) {
      console.error('Error deleting category:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Failed to delete category.',
      });
    }
  };

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Categories Management</h1>
          <p className="admin-page-desc">
            Organize grocery departments and product classification for Sri Rudra storefront
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action"
            onClick={loadData}
            disabled={loading}
            title="Refresh categories"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-admin-primary"
            onClick={openAddModal}
          >
            <Plus size={16} />
            <span>Add New Category</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`admin-alert-banner ${feedback.type}`} role="alert">
          <div className="feedback-content">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            className="btn-close-banner"
            onClick={() => setFeedback({ type: '', message: '' })}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert-banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadData} className="btn-retry-inline">
            Retry
          </button>
        </div>
      )}

      {/* Categories Cards Grid */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <span className="section-title">
            All Categories {error ? '' : `(${categories.length})`}
          </span>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="table-spinner" />
              <span>Loading store categories...</span>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertCircle size={36} className="empty-icon text-error" />
              <p className="empty-title">Failed to load categories</p>
              <p className="empty-desc">{error}</p>
              <button type="button" onClick={loadData} className="btn-admin-action" style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : categories.length === 0 ? (
            <div className="table-empty-state">
              <FolderTree size={36} className="empty-icon" />
              <p className="empty-title">No categories found</p>
              <p className="empty-desc">Click &ldquo;Add New Category&rdquo; to create your first store department.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Products Count</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const prodCount = productCountMap[category.id] || 0;
                  return (
                    <tr key={category.id}>
                      <td>
                        <div className="category-table-item">
                          <div className="category-thumb-wrap">
                            {category.imageUrl ? (
                              <img
                                src={category.imageUrl}
                                alt={category.name}
                                className="category-thumb-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <FolderTree size={20} className="category-thumb-fallback" />
                            )}
                          </div>
                          <span className="category-title">{category.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="category-desc-text">
                          {category.description || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="category-count-badge">
                          {prodCount} {prodCount === 1 ? 'Product' : 'Products'}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`status-toggle-btn ${category.active ? 'active' : 'inactive'}`}
                          onClick={() => toggleCategoryStatus(category)}
                          title="Click to toggle store visibility"
                        >
                          {category.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => openEditModal(category)}
                            title="Edit Category"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteCategory(category)}
                            title="Delete Category"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= Add / Edit Category Modal ================= */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-group">
                <h2 className="admin-modal-title">
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h2>
                <p className="admin-modal-subtitle">
                  Define category name, description, and storefront visibility
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeModal}
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleFormSubmit}>
              <div className="modal-body-scroll">
                {/* Category Name */}
                <div className="admin-form-group">
                  <label className="form-label" htmlFor="cat-name">
                    Category Name *
                  </label>
                  <input
                    id="cat-name"
                    type="text"
                    placeholder="e.g. Traditional Flours & Atta"
                    className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, name: e.target.value }))
                    }
                    disabled={isSaving}
                  />
                  {formErrors.name && (
                    <span className="field-error-msg">{formErrors.name}</span>
                  )}
                </div>

                {/* Description */}
                <div className="admin-form-group">
                  <label className="form-label" htmlFor="cat-desc">
                    Description
                  </label>
                  <textarea
                    id="cat-desc"
                    rows={3}
                    placeholder="Category description or items included in this department..."
                    className="form-input"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={isSaving}
                  />
                </div>

                {/* Category Image Upload */}
                <div className="admin-form-group">
                  <label className="form-label">Category Image</label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={categoryImageRef}
                    accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    onChange={handleCategoryImageSelect}
                    disabled={isSaving || imageUploading}
                  />

                  {formData.imageUrl ? (
                    <div className="category-image-preview-box">
                      <div className="category-image-preview-frame">
                        <img
                          src={formData.imageUrl}
                          alt="Category preview"
                          className="category-image-preview-img"
                          onError={(e) => {
                            e.currentTarget.style.opacity = '0.3';
                          }}
                        />
                      </div>
                      <div className="category-image-controls">
                        <span className="category-image-filename" title={imageFileName || 'Category Photo'}>
                          {imageFileName || 'Current category photo'}
                        </span>
                        <div className="category-image-btn-row">
                          <button
                            type="button"
                            className="btn-slot-action change"
                            onClick={triggerCategoryImagePicker}
                            disabled={isSaving || imageUploading}
                          >
                            <Upload size={13} />
                            <span>Change</span>
                          </button>
                          <button
                            type="button"
                            className="btn-slot-action remove"
                            onClick={handleRemoveCategoryImage}
                            disabled={isSaving || imageUploading}
                          >
                            <Trash2 size={13} />
                            <span>Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`category-image-dropzone ${imageUploading ? 'uploading' : ''}`}
                      onClick={!imageUploading && !isSaving ? triggerCategoryImagePicker : undefined}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !imageUploading && !isSaving) {
                          e.preventDefault();
                          triggerCategoryImagePicker();
                        }
                      }}
                    >
                      {imageUploading ? (
                        <div className="slot-loading-state">
                          <div className="admin-spinner-sm" />
                          <span>Uploading category photo...</span>
                        </div>
                      ) : (
                        <div className="slot-empty-state">
                          <div className="slot-empty-icon">
                            <Upload size={18} />
                          </div>
                          <span className="slot-upload-text">Upload Image</span>
                          <span className="slot-subtext">Choose a category photo from your device</span>
                        </div>
                      )}
                    </div>
                  )}

                  {imageError && (
                    <div className="slot-error-msg mt-1">
                      <AlertCircle size={12} />
                      <span>{imageError}</span>
                    </div>
                  )}
                </div>

                {/* Active Checkbox */}
                <div className="admin-checkbox-wrap">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, active: e.target.checked }))
                      }
                      disabled={isSaving}
                    />
                    <span className="checkbox-label">
                      <strong>Active in Storefront</strong> — Category will appear in navigation & filters
                    </span>
                  </label>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeModal}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <span>Saving Category...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                    </>
                  )}
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
