'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  FunnelIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ArrowPathIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

// Product Card Component
function ProductCard({ product, index }: { product: any; index: number }) {
  // Get seller name from populated supplierId
  const sellerName = product.supplierId?.businessName || product.supplierId?.name || 'Unknown Seller';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
    >
      <Link href={`/products/${product._id}`}>
        <div className="card-textile h-full hover:border-textile-gold/40 group transition-all duration-300 cursor-pointer">
          <div className="relative h-48 overflow-hidden rounded-xl">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=300&fit=crop'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {product.featured && (
              <span className="absolute top-3 right-3 badge-textile-gold text-xs">
                ⭐ Featured
              </span>
            )}
            {product.stock === 0 && (
              <span className="absolute top-3 left-3 badge-textile-gold bg-textile-terracotta/10 border-textile-terracotta text-textile-terracotta text-xs">
                Out of Stock
              </span>
            )}
            {product.stock > 0 && product.stock < 10 && (
              <span className="absolute bottom-3 left-3 badge-warning text-xs">
                Only {product.stock} left
              </span>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-textile-brown line-clamp-1 flex-1">{product.name}</h3>
              {product.averageRating > 0 && (
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <StarIcon className="w-3.5 h-3.5 text-textile-gold" />
                  <span className="text-xs font-medium text-textile-brown">{product.averageRating.toFixed(1)}</span>
                </div>
              )}
            </div>
            <p className="text-sm text-textile-brown/60 line-clamp-1">{product.category}</p>
            
            {/* ✅ Seller Name */}
            <div className="mt-1 flex items-center gap-1.5">
              <UserCircleIcon className="w-3.5 h-3.5 text-textile-brown/40" />
              <span className="text-xs text-textile-brown/40">by</span>
              <span className="text-xs font-medium text-textile-indigo line-clamp-1">
                {sellerName}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold gradient-textile">${product.price?.toFixed(2)}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                product.stock > 0 
                  ? 'bg-green-100/50 text-green-700 border border-green-200' 
                  : 'bg-red-100/50 text-red-700 border border-red-200'
              }`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Category Filter Component
function CategoryFilter({ categories, selected, onChange }: { categories: string[]; selected: string; onChange: (category: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange('')}
        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
          selected === '' 
            ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white border-transparent shadow-md' 
            : 'bg-textile-cream text-textile-brown border-textile-gold/20 hover:border-textile-gold'
        }`}
      >
        All
      </button>
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
            selected === category 
              ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white border-transparent shadow-md' 
              : 'bg-textile-cream text-textile-brown border-textile-gold/20 hover:border-textile-gold'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

// Sort Options
const sortOptions = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'createdAt_asc', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'name_asc', label: 'Name: A to Z' },
  { value: 'name_desc', label: 'Name: Z to A' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'rating_asc', label: 'Lowest Rated' },
];

export default function MarketplacePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [fabricTypes, setFabricTypes] = useState<string[]>([]);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isSearching, setIsSearching] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 20;

  // Load initial filters from URL
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    const fabric = searchParams.get('fabric') || '';
    const sort = searchParams.get('sort') || 'createdAt_desc';
    
    if (category) setSelectedCategory(category);
    if (search) setSearchQuery(search);
    if (fabric) setSelectedFabric(fabric);
    if (sort) setSortBy(sort);
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedFabric, minPrice, maxPrice, sortBy, page]);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/list');
      setCategories(response.data.categories || []);
      setFabricTypes(response.data.fabricTypes || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      
      const [sortField, sortOrder] = sortBy.split('_');
      const params: any = {
        sortBy: sortField,
        sortOrder: sortOrder,
        limit: itemsPerPage,
        page: page,
        isActive: true,
      };
      
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedFabric) params.fabricType = selectedFabric;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (searchQuery) params.search = searchQuery;

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      
      setProducts(response.data.products || []);
      setTotalPages(response.data.pagination?.pages || 1);
      setTotalProducts(response.data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setPage(1);
    fetchProducts();
    setIsSearching(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedFabric('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt_desc');
    setPage(1);
    setShowFilters(false);
    setTimeout(() => fetchProducts(), 100);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSortLabel = () => {
    const option = sortOptions.find(o => o.value === sortBy);
    return option?.label || 'Sort by';
  };

  const categoryIcons: { [key: string]: string } = {
    'Cotton': '🌿',
    'Silk': '🪭',
    'Linen': '🧵',
    'Wool': '🐑',
    'Denim': '👖',
    'Satin': '✨',
    'Velvet': '🔮',
    'Jute': '🌾',
    'Polyester': '🧶',
    'Nylon': '🪢',
    'Rayon': '🌱',
    'Spandex': '💪',
    'Bamboo': '🎋',
    'Hemp': '🌿',
    'Organic Cotton': '🌾',
  };

  return (
    <PageTransition>
      <Navbar />
      <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
        <div className="container-custom py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
              Marketplace
            </h1>
            <p className="text-textile-brown/70 mt-1">
              Browse {totalProducts} premium textile products from verified suppliers
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mb-6"
          >
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for fabrics, categories, or suppliers..."
                  className="w-full px-4 py-3 pl-12 rounded-xl text-textile-brown bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-textile-gold border-2 border-textile-gold/20 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-textile-brown/40" />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-3 p-1 text-textile-brown/40 hover:text-textile-brown transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-textile-indigo to-textile-royal text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                >
                  Search
                </button>
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className="px-4 py-3 bg-white/90 backdrop-blur-sm text-textile-brown font-semibold rounded-xl hover:bg-white border-2 border-textile-gold/20 hover:border-textile-gold/40 transition-all duration-200 inline-flex items-center gap-2"
                >
                  <FunnelIcon className="w-5 h-5" />
                  Filters
                  {(selectedCategory || selectedFabric || minPrice || maxPrice) && (
                    <span className="w-2 h-2 rounded-full bg-textile-gold"></span>
                  )}
                </button>
              </div>
            </form>
          </motion.div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mb-6"
              >
                <div className="card-textile p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-textile-brown mb-1.5">Category</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-textile-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm text-textile-brown"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {categoryIcons[category] || '🧶'} {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Fabric Type Filter */}
                    <div>
                      <label className="block text-sm font-medium text-textile-brown mb-1.5">Fabric Type</label>
                      <select
                        value={selectedFabric}
                        onChange={(e) => setSelectedFabric(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-textile-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm text-textile-brown"
                      >
                        <option value="">All Fabrics</option>
                        {fabricTypes.map((fabric) => (
                          <option key={fabric} value={fabric}>{fabric}</option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-textile-brown mb-1.5">Price Range</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={minPrice}
                          onChange={(e) => setMinPrice(e.target.value)}
                          placeholder="Min"
                          className="w-1/2 px-3 py-2 border-2 border-textile-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm text-textile-brown"
                        />
                        <input
                          type="number"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          placeholder="Max"
                          className="w-1/2 px-3 py-2 border-2 border-textile-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm text-textile-brown"
                        />
                      </div>
                    </div>

                    {/* Sort & Clear */}
                    <div>
                      <label className="block text-sm font-medium text-textile-brown mb-1.5">Sort by</label>
                      <div className="flex gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="flex-1 px-3 py-2 border-2 border-textile-gold/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm text-textile-brown"
                        >
                          {sortOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={clearFilters}
                          className="px-3 py-2 bg-textile-terracotta/10 text-textile-terracotta rounded-lg hover:bg-textile-terracotta/20 transition-colors text-sm border border-textile-terracotta/20"
                          title="Clear all filters"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Filters */}
                  {(selectedCategory || selectedFabric || minPrice || maxPrice) && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t-2 border-textile-gold/20">
                      <span className="text-xs text-textile-brown/60">Active filters:</span>
                      {selectedCategory && (
                        <span className="badge-textile-indigo text-xs inline-flex items-center gap-1">
                          {selectedCategory}
                          <button onClick={() => setSelectedCategory('')} className="hover:text-textile-terracotta">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {selectedFabric && (
                        <span className="badge-textile-indigo text-xs inline-flex items-center gap-1">
                          {selectedFabric}
                          <button onClick={() => setSelectedFabric('')} className="hover:text-textile-terracotta">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      {(minPrice || maxPrice) && (
                        <span className="badge-textile-indigo text-xs inline-flex items-center gap-1">
                          ${minPrice || '0'} - ${maxPrice || '∞'}
                          <button onClick={() => { setMinPrice(''); setMaxPrice(''); }} className="hover:text-textile-terracotta">
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </span>
                      )}
                      <button onClick={clearFilters} className="text-xs text-textile-terracotta hover:underline">
                        Clear all
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-textile-brown/60">
                Showing <span className="font-medium text-textile-brown">{products.length}</span> of {totalProducts} products
              </p>
              {loading && (
                <ArrowPathIcon className="w-4 h-4 text-textile-gold animate-spin" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border-2 border-textile-gold/20 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${
                    viewMode === 'grid' 
                      ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white' 
                      : 'bg-transparent text-textile-brown hover:bg-textile-gold/10'
                  }`}
                >
                  <Squares2X2Icon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 transition-colors ${
                    viewMode === 'list' 
                      ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white' 
                      : 'bg-transparent text-textile-brown hover:bg-textile-gold/10'
                  }`}
                >
                  <ListBulletIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            {loading && products.length === 0 ? (
              <LoadingSkeleton count={8} type="products" />
            ) : products.length > 0 ? (
              <motion.div
                key="products"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
                    : 'grid-cols-1'
                }`}
              >
                {products.map((product: any, index: number) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-textile-warm p-12 text-center"
              >
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-xl font-semibold text-textile-brown mb-2">No products found</h3>
                <p className="text-textile-brown/60 max-w-md mx-auto">
                  We couldn't find any products matching your criteria. Try adjusting your filters or search terms.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2.5 btn-textile-primary"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t-2 border-textile-gold/20">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 btn-textile-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {[...Array(Math.min(totalPages, 5))].map((_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (page <= 3) {
                    pageNumber = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={i}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-10 h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
                        page === pageNumber
                          ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                          : 'bg-white/50 text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-4 py-2 btn-textile-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}

          {/* Decorative Thread Pattern */}
          <div className="mt-8 pt-6 border-t-2 border-textile-gold/20">
            <div className="flex justify-center gap-1">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-gradient-to-r from-textile-gold/30 to-textile-amber/30"
                  style={{ animationDelay: `${i * 0.1}s` }}
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}