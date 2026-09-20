import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Package,
  Layers,
  Check,
  RefreshCw,
  Upload,
} from 'lucide-react';
import adminService from '../services/adminService';
import { uploadImageToCloudinary, validateImageFile } from '../services/cloudinaryService';
import './AdminProducts.css';

const generateProductId = () =>
  `prod_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

const DEFAULT_VARIANT = () => ({
  variantId: `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
  weight: '500g',
  price: 100,
  mrp: 120,
  stock: 20,
  active: true,
});

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Delete Confirmation Modal state
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 4 Image Slots State (Image 1 required, Images 2-4 optional)
  const [imageSlots, setImageSlots] = useState(() => [
    { id: 1, label: 'Image 1', required: true, url: '', fileName: '', uploading: false, progress: 0, error: '' },
    { id: 2, label: 'Image 2', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
    { id: 3, label: 'Image 3', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
    { id: 4, label: 'Image 4', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
  ]);
  const fileInputRefs = useRef([]);
  const productIdRef = useRef('');

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    imageUrl: '',
    active: true,
    variants: [DEFAULT_VARIANT()],
  });

  const openAddModal = useCallback((availableCats) => {
    const cats = availableCats || categories;
    const defaultCatId = cats && cats[0] ? cats[0].id : '';
    setEditingProduct(null);
    productIdRef.current = generateProductId();
    setFormData({
      name: '',
      description: '',
      categoryId: defaultCatId,
      imageUrl: '',
      active: true,
      variants: [DEFAULT_VARIANT()],
    });
    setImageSlots([
      { id: 1, label: 'Image 1', required: true, url: '', fileName: '', uploading: false, progress: 0, error: '' },
      { id: 2, label: 'Image 2', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
      { id: 3, label: 'Image 3', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
      { id: 4, label: 'Image 4', required: false, url: '', fileName: '', uploading: false, progress: 0, error: '' },
    ]);
    setFormErrors({});
    if (fileInputRefs.current) {
      fileInputRefs.current.forEach((input) => {
        if (input) input.value = '';
      });
    }
    setModalOpen(true);
  }, [categories]);

  const openEditModal = (product) => {
    setEditingProduct(product);
    productIdRef.current = product.id;

    // Collect all existing images (up to 4)
    let existing = [];
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      existing = product.imageUrls.slice(0, 4);
    } else if (product.imageUrl) {
      existing = [product.imageUrl];
    }

    setFormData({
      name: product.name || '',
      description: product.description || '',
      categoryId: product.categoryId || (categories[0] ? categories[0].id : ''),
      imageUrl: product.imageUrl || existing[0] || '',
      active: product.active ?? true,
      variants:
        product.variants && product.variants.length > 0
          ? product.variants.map((v) => ({
              variantId: v.variantId || `var_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              weight: v.weight || '',
              price: v.price ?? 0,
              mrp: v.mrp ?? 0,
              stock: v.stock ?? 0,
              active: v.active ?? true,
            }))
          : [DEFAULT_VARIANT()],
    });

    setImageSlots([
      { id: 1, label: 'Image 1', required: true, url: existing[0] || '', fileName: existing[0] ? 'Current photo 1' : '', uploading: false, progress: 0, error: '' },
      { id: 2, label: 'Image 2', required: false, url: existing[1] || '', fileName: existing[1] ? 'Current photo 2' : '', uploading: false, progress: 0, error: '' },
      { id: 3, label: 'Image 3', required: false, url: existing[2] || '', fileName: existing[2] ? 'Current photo 3' : '', uploading: false, progress: 0, error: '' },
      { id: 4, label: 'Image 4', required: false, url: existing[3] || '', fileName: existing[3] ? 'Current photo 4' : '', uploading: false, progress: 0, error: '' },
    ]);
    setFormErrors({});
    if (fileInputRefs.current) {
      fileInputRefs.current.forEach((input) => {
        if (input) input.value = '';
      });
    }
    setModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving || imageSlots.some((s) => s.uploading)) return;
    setModalOpen(false);
    setEditingProduct(null);
  };

  const loadData = () => {
    setLoading(true);
    setError('');

    Promise.all([
      adminService.getAllProducts(),
      adminService.getAllCategories(),
    ])
      .then(([prodList, catList]) => {
        setProducts(prodList || []);
        setCategories(catList || []);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setError(err.userFriendlyMessage || 'Unable to load products. Please check connection.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      adminService.getAllProducts(),
      adminService.getAllCategories(),
    ])
      .then(([prodList, catList]) => {
        if (!isMounted) return;
        setProducts(prodList || []);
        setCategories(catList || []);

        if (searchParams.get('action') === 'add') {
          openAddModal(catList);
          setSearchParams({}, { replace: true });
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching products:', err);
        setError(err.userFriendlyMessage || 'Unable to load products. Please check connection.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = (p.name || '').toLowerCase().includes(query);
        const matchesDesc = (p.description || '').toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'ACTIVE' && !p.active) return false;
      if (statusFilter === 'INACTIVE' && p.active) return false;

      return true;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // Variant operations in modal form
  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, DEFAULT_VARIANT()],
    }));
  };

  const removeVariant = (index) => {
    if (formData.variants.length <= 1) {
      alert('A product must have at least one pack size variant.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, variants: updated };
    });
  };

  const validateForm = () => {
    const errs = {};

    if (!formData.name.trim()) {
      errs.name = 'Product name is required.';
    }

    if (!formData.categoryId) {
      errs.categoryId = 'Please select a category.';
    }

    // Image 1 is required as the primary product photo
    if (!imageSlots[0]?.url) {
      errs.image = 'Image 1 is required as the primary product photo.';
    }

    if (!formData.variants || formData.variants.length === 0) {
      errs.variants = 'At least one pack size variant is required.';
    } else {
      formData.variants.forEach((v, idx) => {
        if (!v.weight || !v.weight.trim()) {
          errs[`variant_${idx}_weight`] = 'Pack size required (e.g. 500g).';
        }
        if (typeof v.price !== 'number' || v.price <= 0) {
          errs[`variant_${idx}_price`] = 'Price must be greater than 0.';
        }
        if (typeof v.mrp !== 'number' || v.mrp < v.price) {
          errs[`variant_${idx}_mrp`] = 'MRP must be greater than or equal to price.';
        }
        if (typeof v.stock !== 'number' || v.stock < 0) {
          errs[`variant_${idx}_stock`] = 'Stock cannot be negative.';
        }
      });
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSlotFileSelect = async (slotIndex, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so selecting the same file triggers again
    e.target.value = '';

    const validationError = validateImageFile(file);
    if (validationError) {
      setImageSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          ...next[slotIndex],
          error: validationError,
        };
        return next;
      });
      return;
    }

    // Mark slot as uploading
    setImageSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = {
        ...next[slotIndex],
        uploading: true,
        progress: 0,
        error: '',
        fileName: file.name,
      };
      return next;
    });

    try {
      const secureUrl = await uploadImageToCloudinary(file, {
        folder: 'rudra/products',
        onProgress: (percent) => {
          setImageSlots((prev) => {
            if (!prev[slotIndex]?.uploading) return prev;
            const next = [...prev];
            next[slotIndex] = {
              ...next[slotIndex],
              progress: percent,
            };
            return next;
          });
        },
      });

      setImageSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          ...next[slotIndex],
          url: secureUrl,
          uploading: false,
          progress: 100,
          error: '',
        };
        return next;
      });

      // Clear any general image form error if slot 0 is filled
      if (slotIndex === 0) {
        setFormErrors((prev) => ({ ...prev, image: null }));
      }
    } catch (err) {
      console.error(`Cloudinary upload error for slot ${slotIndex + 1}:`, err);
      setImageSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = {
          ...next[slotIndex],
          uploading: false,
          progress: 0,
          error: err.message || 'Photo upload failed. Please try again.',
        };
        return next;
      });
    } finally {
      // Ensure uploading is definitely false
      setImageSlots((prev) => {
        if (!prev[slotIndex]?.uploading) return prev;
        const next = [...prev];
        next[slotIndex] = {
          ...next[slotIndex],
          uploading: false,
        };
        return next;
      });
    }
  };

  const handleSlotRemove = (slotIndex) => {
    setImageSlots((prev) => {
      const next = [...prev];
      next[slotIndex] = {
        ...next[slotIndex],
        url: '',
        fileName: '',
        uploading: false,
        progress: 0,
        error: '',
      };
      return next;
    });

    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex].value = '';
    }
  };

  const triggerSlotUpload = (slotIndex) => {
    if (fileInputRefs.current[slotIndex]) {
      fileInputRefs.current[slotIndex].click();
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (imageSlots.some((s) => s.uploading)) {
      alert('Please wait for photo upload to complete.');
      return;
    }

    if (!validateForm()) return;

    setIsSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const activeUrls = imageSlots.map((s) => s.url).filter(Boolean);
      const primaryUrl = activeUrls[0] || '';

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        imageUrl: primaryUrl,
        imageUrls: activeUrls,
        active: formData.active,
        variants: formData.variants.map((v) => ({
          variantId: v.variantId,
          weight: v.weight.trim(),
          price: Number(v.price),
          mrp: Number(v.mrp),
          stock: Number(v.stock),
          active: Boolean(v.active),
        })),
      };

      if (editingProduct) {
        await adminService.updateProduct(editingProduct.id, payload);
        setFeedback({ type: 'success', message: `Product "${payload.name}" updated successfully.` });
      } else {
        await adminService.createProduct(payload);
        setFeedback({ type: 'success', message: `Product "${payload.name}" created successfully.` });
      }

      closeModal();
      loadData();
    } catch (err) {
      console.error('Error saving product:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Unable to save product. Please verify fields.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProductStatus = async (product) => {
    try {
      const newStatus = !product.active;
      const payload = {
        ...product,
        active: newStatus,
      };
      await adminService.updateProduct(product.id, payload);
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, active: newStatus } : p))
      );
      setFeedback({
        type: 'success',
        message: `Product "${product.name}" is now ${newStatus ? 'Active' : 'Inactive'}.`,
      });
    } catch (err) {
      console.error('Error toggling product status:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Failed to change product status.',
      });
    }
  };

  const handleDeleteProduct = (product) => {
    setDeleteConfirmProduct(product);
  };

  const handleConfirmPermanentDelete = async () => {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);
    setFeedback({ type: '', message: '' });

    try {
      await adminService.deleteProduct(deleteConfirmProduct.id, true);
      setProducts((prev) => prev.filter((p) => p.id !== deleteConfirmProduct.id));
      setFeedback({
        type: 'success',
        message: 'Product permanently deleted successfully.',
      });
      setDeleteConfirmProduct(null);
    } catch (err) {
      console.error('Error permanently deleting product:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Failed to delete product.',
      });
      setDeleteConfirmProduct(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  const getStockSummary = (variants) => {
    if (!variants || variants.length === 0) return { total: 0, hasOut: true };
    const total = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
    const hasOut = variants.some((v) => (Number(v.stock) || 0) <= 0);
    return { total, hasOut };
  };

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Products Management</h1>
          <p className="admin-page-desc">
            Manage grocery products, pack sizes, pricing, and stock levels
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action"
            onClick={loadData}
            disabled={loading}
            title="Refresh product list"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            className="btn-admin-primary"
            onClick={() => openAddModal()}
          >
            <Plus size={16} />
            <span>Add New Product</span>
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

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-filters-group">
          <select
            className="admin-select-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            className="admin-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Products Table Card */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <span className="section-title">
            All Products {error ? '' : `(${filteredProducts.length})`}
          </span>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="table-spinner" />
              <span>Loading products...</span>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertCircle size={36} className="empty-icon text-error" />
              <p className="empty-title">Failed to load products</p>
              <p className="empty-desc">{error}</p>
              <button type="button" onClick={loadData} className="btn-admin-action" style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="table-empty-state">
              <Package size={36} className="empty-icon" />
              <p className="empty-title">No products match criteria</p>
              <p className="empty-desc">Try clearing filters or click &ldquo;Add New Product&rdquo; to create one.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Pack Sizes / Price</th>
                  <th>Stock Total</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const stockInfo = getStockSummary(product.variants);
                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="product-table-item">
                          <div className="product-thumb-wrap">
                            {product.imageUrl ? (
                              <img
                                src={product.imageUrl}
                                alt={product.name}
                                className="product-thumb-img"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <Package size={20} className="product-thumb-fallback" />
                            )}
                          </div>
                          <div className="product-name-block">
                            <span className="product-title">{product.name}</span>
                            {product.description && (
                              <span className="product-desc-snippet">{product.description}</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="category-pill">
                          {categoryMap[product.categoryId] || 'Uncategorized'}
                        </span>
                      </td>
                      <td>
                        <div className="variants-summary-cell">
                          {product.variants && product.variants.length > 0 ? (
                            product.variants.map((v, idx) => (
                              <span key={v.variantId || idx} className="variant-tag">
                                {v.weight} &bull; {formatCurrency(v.price)}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">No variants</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="stock-cell">
                          <span
                            className={`stock-badge ${
                              stockInfo.total <= 0
                                ? 'out-of-stock'
                                : stockInfo.total <= 5
                                ? 'low-stock'
                                : 'in-stock'
                            }`}
                          >
                            {stockInfo.total} units
                          </span>
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`status-toggle-btn ${product.active ? 'active' : 'inactive'}`}
                          onClick={() => toggleProductStatus(product)}
                          title="Click to toggle store visibility"
                        >
                          {product.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="text-right">
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="btn-action-icon"
                            onClick={() => openEditModal(product)}
                            title="Edit Product"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            onClick={() => handleDeleteProduct(product)}
                            title="Delete Product"
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

      {/* ================= Add / Edit Product Modal ================= */}
      {modalOpen && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div
            className="admin-modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-group">
                <h2 className="admin-modal-title">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <p className="admin-modal-subtitle">
                  Configure product details, pack sizes, MRP, and stock inventory
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
                {/* Basic Details */}
                <div className="form-section-title">Product Details</div>

                <div className="form-row-2">
                  {/* Name */}
                  <div className="admin-form-group">
                    <label className="form-label" htmlFor="prod-name">
                      Product Name *
                    </label>
                    <input
                      id="prod-name"
                      type="text"
                      placeholder="e.g. Sona Masoori Raw Rice"
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

                  {/* Category */}
                  <div className="admin-form-group">
                    <label className="form-label" htmlFor="prod-category">
                      Category *
                    </label>
                    <select
                      id="prod-category"
                      className={`form-input ${formErrors.categoryId ? 'input-error' : ''}`}
                      value={formData.categoryId}
                      onChange={(e) =>
                        setFormData((p) => ({ ...p, categoryId: e.target.value }))
                      }
                      disabled={isSaving}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {formErrors.categoryId && (
                      <span className="field-error-msg">{formErrors.categoryId}</span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="admin-form-group">
                  <label className="form-label" htmlFor="prod-desc">
                    Description
                  </label>
                  <textarea
                    id="prod-desc"
                    rows={3}
                    placeholder="Short product details, sourcing origin, or cooking instructions..."
                    className="form-input"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, description: e.target.value }))
                    }
                    disabled={isSaving}
                  />
                </div>

                {/* Product Images (Up to 4 Images) */}
                <div className="admin-form-group product-images-section">
                  <div className="product-images-header-row">
                    <label className="form-label">
                      Product Images <span className="text-muted">(Upload up to 4 images)</span>
                    </label>
                    <span className="product-images-sublabel">
                      Image 1 is required &bull; Images 2–4 are optional
                    </span>
                  </div>

                  <div className="product-images-grid">
                    {imageSlots.map((slot, index) => (
                      <div
                        key={slot.id}
                        className={`image-slot-card ${slot.url ? 'has-image' : 'empty'} ${
                          slot.required ? 'is-required' : ''
                        }`}
                      >
                        <div className="image-slot-header">
                          <span className="slot-title">{slot.label}</span>
                          {slot.required ? (
                            <span className="slot-badge required">Required</span>
                          ) : (
                            <span className="slot-badge optional">Optional</span>
                          )}
                        </div>

                        {/* Hidden file input for this slot */}
                        <input
                          type="file"
                          ref={(el) => (fileInputRefs.current[index] = el)}
                          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                          style={{ display: 'none' }}
                          onChange={(e) => handleSlotFileSelect(index, e)}
                          disabled={isSaving || slot.uploading}
                        />

                        <div className="image-slot-body">
                          {slot.url ? (
                            <div className="slot-preview-wrap">
                              <img
                                src={slot.url}
                                alt={`${slot.label} preview`}
                                className="slot-preview-img"
                                onError={(e) => {
                                  e.currentTarget.style.opacity = '0.3';
                                }}
                              />
                              <div className="slot-info-footer">
                                <span
                                  className="slot-filename"
                                  title={slot.fileName || `${slot.label}`}
                                >
                                  {slot.fileName || `Photo ${index + 1}`}
                                </span>
                                <div className="slot-actions-row">
                                  <button
                                    type="button"
                                    className="btn-slot-action change"
                                    onClick={() => triggerSlotUpload(index)}
                                    disabled={isSaving || slot.uploading}
                                    title="Change this photo"
                                  >
                                    <Upload size={12} />
                                    <span>Change</span>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-slot-action remove"
                                    onClick={() => handleSlotRemove(index)}
                                    disabled={isSaving || slot.uploading}
                                    title="Remove this photo"
                                  >
                                    <Trash2 size={12} />
                                    <span>Remove</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`slot-dropzone ${slot.uploading ? 'uploading' : ''}`}
                              onClick={
                                !slot.uploading && !isSaving
                                  ? () => triggerSlotUpload(index)
                                  : undefined
                              }
                              role="button"
                              tabIndex={0}
                              onKeyDown={(e) => {
                                if (
                                  (e.key === 'Enter' || e.key === ' ') &&
                                  !slot.uploading &&
                                  !isSaving
                                ) {
                                  e.preventDefault();
                                  triggerSlotUpload(index);
                                }
                              }}
                            >
                              {slot.uploading ? (
                                <div className="slot-loading-state">
                                  <div className="admin-spinner-sm" />
                                  <span>{slot.progress > 0 ? `Uploading... ${slot.progress}%` : 'Uploading...'}</span>
                                </div>
                              ) : (
                                <div className="slot-empty-state">
                                  <div className="slot-empty-icon">
                                    <Upload size={18} />
                                  </div>
                                  <span className="slot-upload-text">Add Photo</span>
                                  <span className="slot-subtext">
                                    {index === 0 ? 'Choose primary photo' : 'Choose photo'}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        {slot.error && (
                          <div className="slot-error-msg">
                            <AlertCircle size={12} />
                            <span>{slot.error}</span>
                            <button
                              type="button"
                              className="btn-slot-retry"
                              onClick={() => triggerSlotUpload(index)}
                              title="Try again"
                            >
                              Try again
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="product-images-hint">
                    Accepted formats: JPG, JPEG, PNG, WEBP (Max 5 MB per image). Maximum 4 images.
                  </p>

                  {formErrors.image && (
                    <div className="image-error-banner" role="alert">
                      <AlertCircle size={15} />
                      <span>{formErrors.image}</span>
                    </div>
                  )}
                </div>

                {/* Active Toggle */}
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
                      <strong>Active in Storefront</strong> — Product will be visible to shopping customers
                    </span>
                  </label>
                </div>

                {/* Variants Management */}
                <div className="variants-header-bar">
                  <div>
                    <div className="form-section-title mb-0">Pack Size Variants</div>
                    <span className="variants-help">
                      Define pack sizes (e.g. 500g, 1kg), selling prices, MRP, and stock inventory
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn-add-variant"
                    onClick={addVariant}
                    disabled={isSaving}
                  >
                    <Plus size={14} />
                    <span>Add Variant</span>
                  </button>
                </div>

                {formErrors.variants && (
                  <span className="field-error-msg mb-2">{formErrors.variants}</span>
                )}

                <div className="variants-cards-list">
                  {formData.variants.map((variant, index) => (
                    <div key={variant.variantId || index} className="variant-edit-card">
                      <div className="variant-card-header">
                        <div className="variant-index-badge">
                          <Layers size={14} />
                          <span>Variant #{index + 1}</span>
                        </div>
                        {formData.variants.length > 1 && (
                          <button
                            type="button"
                            className="btn-remove-variant"
                            onClick={() => removeVariant(index)}
                            disabled={isSaving}
                            title="Remove this pack variant"
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        )}
                      </div>

                      <div className="variant-fields-grid">
                        {/* Weight */}
                        <div className="admin-form-group">
                          <label className="form-label-sub">Pack Size *</label>
                          <input
                            type="text"
                            placeholder="e.g. 500g, 1kg"
                            className={`form-input-sm ${
                              formErrors[`variant_${index}_weight`] ? 'input-error' : ''
                            }`}
                            value={variant.weight}
                            onChange={(e) =>
                              handleVariantChange(index, 'weight', e.target.value)
                            }
                            disabled={isSaving}
                          />
                        </div>

                        {/* Price */}
                        <div className="admin-form-group">
                          <label className="form-label-sub">Selling Price (₹) *</label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            className={`form-input-sm ${
                              formErrors[`variant_${index}_price`] ? 'input-error' : ''
                            }`}
                            value={variant.price}
                            onChange={(e) =>
                              handleVariantChange(index, 'price', parseFloat(e.target.value) || 0)
                            }
                            disabled={isSaving}
                          />
                        </div>

                        {/* MRP */}
                        <div className="admin-form-group">
                          <label className="form-label-sub">MRP (₹) *</label>
                          <input
                            type="number"
                            step="any"
                            min="1"
                            className={`form-input-sm ${
                              formErrors[`variant_${index}_mrp`] ? 'input-error' : ''
                            }`}
                            value={variant.mrp}
                            onChange={(e) =>
                              handleVariantChange(index, 'mrp', parseFloat(e.target.value) || 0)
                            }
                            disabled={isSaving}
                          />
                        </div>

                        {/* Stock */}
                        <div className="admin-form-group">
                          <label className="form-label-sub">Stock Qty *</label>
                          <input
                            type="number"
                            min="0"
                            className={`form-input-sm ${
                              formErrors[`variant_${index}_stock`] ? 'input-error' : ''
                            }`}
                            value={variant.stock}
                            onChange={(e) =>
                              handleVariantChange(index, 'stock', parseInt(e.target.value, 10) || 0)
                            }
                            disabled={isSaving}
                          />
                        </div>

                        {/* Variant Active */}
                        <div className="admin-form-group variant-toggle-col">
                          <label className="form-label-sub">Available</label>
                          <label className="switch-sm">
                            <input
                              type="checkbox"
                              checked={variant.active}
                              onChange={(e) =>
                                handleVariantChange(index, 'active', e.target.checked)
                              }
                              disabled={isSaving}
                            />
                            <span className="slider-sm round" />
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeModal}
                  disabled={isSaving || imageSlots.some((s) => s.uploading)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={isSaving || imageSlots.some((s) => s.uploading)}
                >
                  {isSaving ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Saving Product...</span>
                    </>
                  ) : imageSlots.some((s) => s.uploading) ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Uploading Photos...</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>{editingProduct ? 'Save Changes' : 'Create Product'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= Delete Confirmation Modal ================= */}
      {deleteConfirmProduct && (
        <div
          className="admin-modal-backdrop"
          onClick={() => !isDeleting && setDeleteConfirmProduct(null)}
        >
          <div
            className="admin-modal-dialog modal-confirm"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-confirm-body">
              <div className="modal-confirm-icon-wrap">
                <Trash2 size={22} />
              </div>
              <h3 className="modal-confirm-title">
                Are you sure you want to permanently delete this product?
              </h3>
              <p className="modal-confirm-desc">
                Product: <strong>{deleteConfirmProduct.name}</strong>
              </p>
              <div className="modal-confirm-warning">
                This cannot be undone.
              </div>
            </div>
            <div className="admin-modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setDeleteConfirmProduct(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-modal-danger"
                onClick={handleConfirmPermanentDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <div className="btn-spinner" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={15} />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
