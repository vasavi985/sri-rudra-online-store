import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { OFFICIAL_CATEGORIES, mergeProductsWithCatalog } from '../utils/productCatalog';
import ProductCard from '../components/ProductCard';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  PackageOpen,
  RefreshCw
} from 'lucide-react';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState(() => mergeProductsWithCatalog([]));
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from backend once on mount
  useEffect(() => {
    let isMounted = true;

    // Load active categories from backend
    getCategories()
      .then((catList) => {
        if (!isMounted) return;
        if (Array.isArray(catList) && catList.length > 0) {
          setCategories(catList);
        }
      })
      .catch((err) => {
        console.warn('Backend categories not loaded, using canonical:', err);
      });

    // Load active products from backend
    getProducts()
      .then((remoteList) => {
        if (!isMounted) return;
        if (Array.isArray(remoteList)) {
          setProducts(mergeProductsWithCatalog(remoteList));
        }
      })
      .catch((err) => {
        console.warn('Backend product loading error, rendering canonical catalog:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Category and search state derived directly from searchParams
  const activeCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const [sortBy, setSortBy] = useState('default');

  // Derive categories list (prioritize backend categories, append any non-duplicate canonical categories)
  const displayCategories = useMemo(() => {
    if (!categories || categories.length === 0) return OFFICIAL_CATEGORIES;

    const list = [...categories];
    OFFICIAL_CATEGORIES.forEach((canonicalCat) => {
      const exists = list.some(
        (c) =>
          c.id === canonicalCat.id ||
          c.name.toLowerCase() === canonicalCat.name.toLowerCase() ||
          (canonicalCat.slug && c.name.toLowerCase().includes(canonicalCat.slug))
      );
      if (!exists) {
        list.push(canonicalCat);
      }
    });

    return list;
  }, [categories]);

  const handleCategorySelect = (categoryId) => {
    const next = new URLSearchParams(searchParams);
    if (categoryId === 'all') {
      next.delete('category');
    } else {
      next.set('category', categoryId);
    }
    setSearchParams(next);
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    const next = new URLSearchParams(searchParams);
    if (val) {
      next.set('q', val);
    } else {
      next.delete('q');
    }
    setSearchParams(next, { replace: true });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('q');
    setSearchParams(next);
  };

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let list = products;

    // 1. Category filter
    if (activeCategory !== 'all') {
      list = list.filter((p) => {
        const catId = (p.categoryId || '').toLowerCase();
        const catName = (p.categoryName || '').toLowerCase();
        const target = activeCategory.toLowerCase();

        // Direct ID match (e.g. ASPoAlsjCtqEYr6YEln1)
        if (catId === target) return true;

        // Traditional Flours matching
        if (
          (target === 'aspoalsjctqeyr6yeln1' || target === 'flours') &&
          (catId === 'aspoalsjctqeyr6yeln1' || catName.includes('flour'))
        ) {
          return true;
        }

        // Dal & Pulses matching
        if (
          (target === 'wuhiminuuecsno1ojnkh' || target === 'dal-and-pulses') &&
          (catId === 'wuhiminuuecsno1ojnkh' || catName.includes('dal') || catName.includes('pulse'))
        ) {
          return true;
        }

        if (target === 'ravva-semolina' && (catName.includes('ravva') || catName.includes('semolina'))) return true;
        if (target === 'other-grocery' && (catName.includes('grocery') || catName.includes('other'))) return true;

        return false;
      });
    }

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q) ||
        (p.categoryName || '').toLowerCase().includes(q)
      );
    }

    // 3. Sorting
    const getMinPrice = (p) => {
      const priced = p.variants?.filter((v) => typeof v.price === 'number' && v.price > 0 && v.active !== false);
      if (!priced || priced.length === 0) return Infinity;
      return Math.min(...priced.map((v) => v.price));
    };

    if (sortBy === 'price-asc') {
      list = [...list].sort((a, b) => getMinPrice(a) - getMinPrice(b));
    } else if (sortBy === 'price-desc') {
      list = [...list].sort((a, b) => getMinPrice(b) - getMinPrice(a));
    } else if (sortBy === 'name-asc') {
      list = [...list].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }

    return list;
  }, [products, activeCategory, searchQuery, sortBy]);

  const activeCategoryObj = displayCategories.find((c) => c.id === activeCategory);

  return (
    <div className="products-page">
      {/* 1. Header Hero Banner */}
      <section className="products-page-header">
        <div className="container">
          <div className="products-eyebrow">
            <Sparkles size={14} className="eyebrow-icon" />
            <span>MUNAGA ANILKUMAR TRADERS • RAJAHMUNDRY</span>
          </div>
          <h1 className="products-main-heading">Our Products</h1>
          <p className="products-header-subtext">
            Discover our full range of pure flours, nutritious dals, traditional ravva varieties, and kitchen essentials.
          </p>
        </div>
      </section>

      {/* 2. Main Storefront Content */}
      <div className="container products-page-container">
        {/* Category Pill Filters Bar */}
        <nav className="products-category-bar" aria-label="Filter products by category">
          <div className="category-bar-label">
            <SlidersHorizontal size={15} />
            <span>Categories:</span>
          </div>

          <div className="category-pills-row" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === 'all'}
              className={`category-pill-btn ${activeCategory === 'all' ? 'active' : ''}`}
              onClick={() => handleCategorySelect('all')}
            >
              All Products
            </button>

            {displayCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={activeCategory === cat.id}
                className={`category-pill-btn ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => handleCategorySelect(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Search & Sort Toolbar */}
        <div className="products-toolbar">
          {/* Live Search Input */}
          <div className="toolbar-search-box">
            <Search size={16} className="toolbar-search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="toolbar-search-input"
              aria-label="Search products"
            />
            {searchQuery && (
              <button
                type="button"
                className="toolbar-clear-btn"
                onClick={clearSearch}
                aria-label="Clear search text"
              >
                &times;
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="toolbar-sort-box">
            <ArrowUpDown size={15} className="toolbar-sort-icon" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="toolbar-sort-select"
              aria-label="Sort products"
            >
              <option value="default">Sort by: Featured</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {/* Category Description Banner if active */}
        {activeCategoryObj && (
          <div className="category-info-banner">
            <h3 className="category-info-title">{activeCategoryObj.name}</h3>
            <p className="category-info-desc">{activeCategoryObj.description}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="products-loading-card">
            <div className="spinner" />
            <p className="loading-text">Loading Sri Rudra products...</p>
          </div>
        )}

        {/* Empty State when filter yields 0 items */}
        {!loading && filteredProducts.length === 0 && (
          <div className="products-empty-card">
            <div className="empty-icon-wrap">
              <PackageOpen size={48} />
            </div>
            <h3 className="empty-title">No matching products found</h3>
            <p className="empty-desc">
              We couldn't find any products matching your current search or category filter.
            </p>
            <button
              type="button"
              className="btn btn-outline empty-reset-btn"
              onClick={() => {
                clearSearch();
                handleCategorySelect('all');
              }}
            >
              <RefreshCw size={15} />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* Product Cards Grid */}
        {!loading && filteredProducts.length > 0 && (
          <div className="products-catalog-section">
            <div className="products-count-line">
              <span>
                Showing <strong>{filteredProducts.length}</strong> {filteredProducts.length === 1 ? 'product' : 'products'}
                {activeCategory !== 'all' ? ` in ${activeCategoryObj?.name || activeCategory}` : ''}
              </span>
            </div>

            <div className="products-cards-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
