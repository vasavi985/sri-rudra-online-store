import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Boxes,
  Package,
  Edit2,
  Check,
  RefreshCw,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import adminService from '../services/adminService';
import './AdminInventory.css';

const AdminInventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Quick Stock Edit Modal
  const [editingItem, setEditingItem] = useState(null);
  const [newStockValue, setNewStockValue] = useState(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

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
        console.error('Error loading inventory products:', err);
        setError(err.userFriendlyMessage || 'Unable to retrieve inventory data.');
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
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading inventory products:', err);
        setError(err.userFriendlyMessage || 'Unable to retrieve inventory data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryMap = useMemo(() => {
    const map = {};
    categories.forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [categories]);

  // Flatten products into variant inventory records
  const inventoryRows = useMemo(() => {
    const rows = [];
    products.forEach((product) => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach((v) => {
          const stock = Number(v.stock) || 0;
          let statusTag = 'IN_STOCK';
          if (stock <= 0) {
            statusTag = 'OUT_OF_STOCK';
          } else if (stock <= 5) {
            statusTag = 'LOW_STOCK';
          }

          rows.push({
            productId: product.id,
            productName: product.name,
            productActive: product.active,
            imageUrl: product.imageUrl,
            categoryId: product.categoryId,
            categoryName: categoryMap[product.categoryId] || 'General',
            variantId: v.variantId,
            weight: v.weight,
            price: v.price,
            mrp: v.mrp,
            stock,
            variantActive: v.active,
            statusTag,
            fullProduct: product,
          });
        });
      }
    });
    return rows;
  }, [products, categoryMap]);

  // Inventory KPI Aggregations
  const inventoryMetrics = useMemo(() => {
    let totalUnits = 0;
    let inStockCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventoryRows.forEach((r) => {
      totalUnits += r.stock;
      if (r.statusTag === 'OUT_OF_STOCK') outOfStockCount++;
      else if (r.statusTag === 'LOW_STOCK') lowStockCount++;
      else inStockCount++;
    });

    return {
      totalUnits,
      inStockCount,
      lowStockCount,
      outOfStockCount,
      totalVariants: inventoryRows.length,
    };
  }, [inventoryRows]);

  // Filtered Inventory Rows
  const filteredRows = useMemo(() => {
    return inventoryRows.filter((r) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = (r.productName || '').toLowerCase().includes(q);
        const matchesWeight = (r.weight || '').toLowerCase().includes(q);
        if (!matchesName && !matchesWeight) return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && r.categoryId !== categoryFilter) {
        return false;
      }

      // Stock Status filter
      if (stockStatusFilter !== 'ALL' && r.statusTag !== stockStatusFilter) {
        return false;
      }

      return true;
    });
  }, [inventoryRows, searchQuery, categoryFilter, stockStatusFilter]);

  const openStockEdit = (row) => {
    setEditingItem(row);
    setNewStockValue(row.stock);
  };

  const closeStockEdit = () => {
    if (isUpdatingStock) return;
    setEditingItem(null);
  };

  const handleStockSubmit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsUpdatingStock(true);
    setFeedback({ type: '', message: '' });

    try {
      const product = editingItem.fullProduct;
      const updatedVariants = product.variants.map((v) => {
        if (v.variantId === editingItem.variantId || v.weight === editingItem.weight) {
          return { ...v, stock: Math.max(0, parseInt(newStockValue, 10) || 0) };
        }
        return v;
      });

      const updatedProduct = {
        ...product,
        variants: updatedVariants,
      };

      await adminService.updateProduct(product.id, updatedProduct);

      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? updatedProduct : p))
      );

      setFeedback({
        type: 'success',
        message: `Stock for "${editingItem.productName} (${editingItem.weight})" updated to ${newStockValue} units.`,
      });
      closeStockEdit();
    } catch (err) {
      console.error('Error updating stock level:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Unable to update stock quantity.',
      });
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Inventory Tracking</h1>
          <p className="admin-page-desc">
            Monitor real-time pack variant stock levels, warehouse availability, and restock alerts
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action"
            onClick={loadData}
            disabled={loading}
            title="Refresh stock levels"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
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

      {/* Inventory KPI Summary Cards */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Stock Units</span>
            <div className="kpi-icon-wrap products">
              <Boxes size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : inventoryMetrics.totalUnits}
          </div>
          <span className="kpi-subtext">Across {error ? '—' : inventoryMetrics.totalVariants} pack sizes</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Well Stocked</span>
            <div className="kpi-icon-wrap" style={{ backgroundColor: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value" style={{ color: '#059669' }}>
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : inventoryMetrics.inStockCount}
          </div>
          <span className="kpi-subtext">Variants with &gt; 5 units available</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Low Stock Warning</span>
            <div className="kpi-icon-wrap pending">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className="kpi-value warning">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : inventoryMetrics.lowStockCount}
          </div>
          <span className="kpi-subtext">Variants with 1 to 5 units remaining</span>
        </div>

        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Out of Stock</span>
            <div className="kpi-icon-wrap alert">
              <TrendingDown size={20} />
            </div>
          </div>
          <div className={`kpi-value ${!error && inventoryMetrics.outOfStockCount > 0 ? 'critical' : ''}`}>
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : inventoryMetrics.outOfStockCount}
          </div>
          <span className="kpi-subtext">Requires immediate replenishment</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by product name or pack size (e.g. 500g)..."
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
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value)}
          >
            <option value="ALL">All Stock Levels</option>
            <option value="IN_STOCK">In Stock (&gt; 5)</option>
            <option value="LOW_STOCK">Low Stock (1–5)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
          </select>

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
        </div>
      </div>

      {/* Inventory Table Card */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <span className="section-title">
            Stock Inventory List {error ? '' : `(${filteredRows.length} Items)`}
          </span>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="table-spinner" />
              <span>Loading inventory rows...</span>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertCircle size={36} className="empty-icon text-error" />
              <p className="empty-title">Failed to load inventory</p>
              <p className="empty-desc">{error}</p>
              <button type="button" onClick={loadData} className="btn-admin-action" style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="table-empty-state">
              <Boxes size={36} className="empty-icon" />
              <p className="empty-title">No inventory items found</p>
              <p className="empty-desc">No variants match your search or filter options.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product & Pack Size</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>MRP</th>
                  <th>Current Stock</th>
                  <th>Stock Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, idx) => (
                  <tr key={row.variantId ? `${row.productId}_${row.variantId}` : idx}>
                    <td>
                      <div className="product-table-item">
                        <div className="product-thumb-wrap">
                          {row.imageUrl ? (
                            <img
                              src={row.imageUrl}
                              alt={row.productName}
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
                          <span className="product-title">{row.productName}</span>
                          <span className="variant-tag inline-tag">{row.weight}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-pill">{row.categoryName}</span>
                    </td>
                    <td className="table-cell-amount">{formatCurrency(row.price)}</td>
                    <td className="text-muted">{formatCurrency(row.mrp)}</td>
                    <td>
                      <strong className="stock-qty-text">{row.stock} units</strong>
                    </td>
                    <td>
                      <span
                        className={`stock-badge ${
                          row.statusTag === 'OUT_OF_STOCK'
                            ? 'out-of-stock'
                            : row.statusTag === 'LOW_STOCK'
                            ? 'low-stock'
                            : 'in-stock'
                        }`}
                      >
                        {row.statusTag === 'OUT_OF_STOCK'
                          ? 'Out of Stock'
                          : row.statusTag === 'LOW_STOCK'
                          ? 'Low Stock'
                          : 'In Stock'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        className="btn-update-stock"
                        onClick={() => openStockEdit(row)}
                        title="Quick Stock Update"
                      >
                        <Edit2 size={13} />
                        <span>Update Stock</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= Quick Stock Update Modal ================= */}
      {editingItem && (
        <div className="admin-modal-backdrop" onClick={closeStockEdit}>
          <div
            className="admin-modal-dialog"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-group">
                <h2 className="admin-modal-title">Update Inventory Stock</h2>
                <p className="admin-modal-subtitle">
                  {editingItem.productName} &bull; <strong>{editingItem.weight}</strong>
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeStockEdit}
                disabled={isUpdatingStock}
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleStockSubmit}>
              <div className="modal-body-scroll">
                <div className="stock-modal-current">
                  <div className="stock-info-row">
                    <span className="text-muted">Current On-Hand Stock:</span>
                    <strong>{editingItem.stock} units</strong>
                  </div>
                  <div className="stock-info-row">
                    <span className="text-muted">Pack Size:</span>
                    <span>{editingItem.weight}</span>
                  </div>
                  <div className="stock-info-row">
                    <span className="text-muted">Selling Price:</span>
                    <span>{formatCurrency(editingItem.price)}</span>
                  </div>
                </div>

                <div className="admin-form-group">
                  <label className="form-label" htmlFor="new-stock-input">
                    New Stock Quantity *
                  </label>
                  <input
                    id="new-stock-input"
                    type="number"
                    min="0"
                    step="1"
                    className="form-input"
                    value={newStockValue}
                    onChange={(e) => setNewStockValue(e.target.value)}
                    disabled={isUpdatingStock}
                    required
                  />
                  <span className="form-help-text">
                    Enter the counted physical inventory quantity currently in the store.
                  </span>
                </div>
              </div>

              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeStockEdit}
                  disabled={isUpdatingStock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={isUpdatingStock}
                >
                  {isUpdatingStock ? (
                    <span>Updating...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Stock Quantity</span>
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

export default AdminInventory;
