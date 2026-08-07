'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MagnifyingGlassIcon, 
  AdjustmentsHorizontalIcon, 
  XMarkIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton, HeroSkeleton } from '@/components/common/LoadingSkeleton';

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
        <div className="card-textile h-full hover:border-textile-gold/40 group">
          <div className="relative h-56 overflow-hidden rounded-xl">
            <img
              src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400'}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            {product.featured && (
              <span className="absolute top-3 right-3 badge-textile-gold">
                ⭐ Featured
              </span>
            )}
            {product.stock === 0 && (
              <span className="absolute top-3 left-3 badge-textile-gold bg-textile-terracotta/10 border-textile-terracotta text-textile-terracotta">
                Out of Stock
              </span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-textile-brown truncate">{product.name}</h3>
            <p className="text-sm text-textile-brown/60">{product.category}</p>
            
            {/* ✅ Seller Name */}
            <div className="mt-1 flex items-center gap-1.5">
              <UserCircleIcon className="w-3.5 h-3.5 text-textile-brown/40" />
              <span className="text-xs text-textile-brown/40">by</span>
              <span className="text-xs font-medium text-textile-indigo truncate">
                {sellerName}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold gradient-textile">${product.price?.toFixed(2)}</span>
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${
                product.stock > 0 
                  ? 'bg-green-100/50 text-green-700 border-green-200' 
                  : 'bg-red-100/50 text-red-700 border-red-200'
              }`}>
                {product.stock > 0 ? '✅ In Stock' : '❌ Out of Stock'}
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
            : 'bg-textile-cream text-textile-brown border-textile-gold/30 hover:border-textile-gold'
        }`}
      >
        All
      </button>
      {categories.slice(0, 10).map((category) => (
        <button
          key={category}
          onClick={() => onChange(category)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 border-2 ${
            selected === category 
              ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white border-transparent shadow-md' 
              : 'bg-textile-cream text-textile-brown border-textile-gold/30 hover:border-textile-gold'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, delay }: { icon: string; title: string; description: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="text-center p-6 card-textile-warm hover:shadow-textile-hover"
    >
      <div className="text-5xl mb-4 animate-float">{icon}</div>
      <h3 className="text-lg font-semibold text-textile-brown mb-2">{title}</h3>
      <p className="text-textile-brown/70">{description}</p>
    </motion.div>
  );
}

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [fabricTypes, setFabricTypes] = useState<string[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedFabric, setSelectedFabric] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Load initial filters from URL
  useEffect(() => {
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';
    if (category) setSelectedCategory(category);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    fetchCategories();
    fetchProducts();
  }, []);

  // Fetch products when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isSearching || searchQuery) {
        fetchProducts();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialLoad) {
      fetchProducts();
    }
  }, [selectedCategory, selectedFabric, minPrice, maxPrice, sortBy, sortOrder]);

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
      
      const params: any = {};
      if (searchQuery) params.search = searchQuery;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedFabric) params.fabricType = selectedFabric;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;
      if (sortBy) params.sortBy = sortBy;
      if (sortOrder) params.sortOrder = sortOrder;
      params.limit = 50;

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/products?${queryString}`);
      setProducts(response.data.products || []);
      setIsInitialLoad(false);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    fetchProducts();
    setIsSearching(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedFabric('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('createdAt');
    setSortOrder('desc');
    setShowFilters(false);
    setTimeout(() => fetchProducts(), 100);
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
  };

  return (
    <PageTransition>
      <Navbar />
      <div className="pt-16">
        {/* Hero Section with Search */}
        <section className="hero-textile py-20 relative overflow-hidden">
          {/* Decorative background patterns */}
          <div className="absolute inset-0 bg-weave-pattern bg-weave opacity-10"></div>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-textile-gold/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-textile-indigo/10 rounded-full blur-3xl"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-8"
            >
              <h1 className="text-5xl md:text-6xl font-bold mb-4">
                Premium Textiles, <br />
                <span className="text-textile-gold">Trusted Marketplace</span>
              </h1>
              <p className="text-xl mb-6 max-w-2xl mx-auto text-white/80">
                Connect with verified suppliers and discover high-quality fabrics for your business
              </p>
            </motion.div>

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="max-w-3xl mx-auto"
            >
              <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search for fabrics, categories, or suppliers..."
                    className="w-full px-4 py-3 pl-12 rounded-xl text-textile-brown bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-textile-gold border-2 border-white/20"
                  />
                  <MagnifyingGlassIcon className="absolute left-4 top-3.5 w-5 h-5 text-textile-brown/40" />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-gradient-to-r from-textile-gold to-textile-amber text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
                  >
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className="px-4 py-3 bg-white/20 backdrop-blur-sm text-white font-semibold rounded-xl hover:bg-white/30 transition-all duration-200 border-2 border-white/20"
                  >
                    {showFilters ? 'Hide' : 'Filters'} <AdjustmentsHorizontalIcon className="inline w-4 h-4 ml-1" />
                  </button>
                </div>
              </form>

              {/* Quick Category Links */}
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {categories.slice(0, 6).map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setShowFilters(true);
                    }}
                    className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-sm rounded-full hover:bg-white/30 transition-colors border border-white/10"
                  >
                    {categoryIcons[category] || '🧶'} {category}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Filters Bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-textile-cream/90 backdrop-blur-sm border-b-2 border-textile-gold/20 overflow-hidden"
            >
              <div className="container mx-auto px-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-textile-brown mb-1">Category</label>
                    <CategoryFilter
                      categories={categories}
                      selected={selectedCategory}
                      onChange={setSelectedCategory}
                    />
                  </div>

                  {/* Fabric Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-textile-brown mb-1">Fabric Type</label>
                    <select
                      value={selectedFabric}
                      onChange={(e) => setSelectedFabric(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-textile-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm"
                    >
                      <option value="">All Fabrics</option>
                      {fabricTypes.map((fabric) => (
                        <option key={fabric} value={fabric}>{fabric}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-textile-brown mb-1">Price Range</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Min"
                        className="w-1/2 px-3 py-2 border-2 border-textile-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm"
                      />
                      <input
                        type="number"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Max"
                        className="w-1/2 px-3 py-2 border-2 border-textile-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm"
                      />
                    </div>
                  </div>

                  {/* Sort & Clear */}
                  <div>
                    <label className="block text-sm font-medium text-textile-brown mb-1">Sort by</label>
                    <div className="flex gap-2">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-textile-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm"
                      >
                        <option value="createdAt">Newest</option>
                        <option value="price">Price</option>
                        <option value="name">Name</option>
                      </select>
                      <select
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                        className="flex-1 px-3 py-2 border-2 border-textile-gold/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-textile-gold bg-white/50 backdrop-blur-sm"
                      >
                        <option value="desc">↓ Desc</option>
                        <option value="asc">↑ Asc</option>
                      </select>
                      <button
                        onClick={clearFilters}
                        className="px-3 py-2 bg-textile-terracotta/10 text-textile-terracotta rounded-lg hover:bg-textile-terracotta/20 transition-colors text-sm border border-textile-terracotta/20"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Features Section */}
        <section className="py-16 bg-textile-cream/50">
          <div className="container mx-auto px-4">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl md:text-4xl font-bold text-center text-textile-brown mb-12 gradient-textile"
            >
              Why Choose TextileHub?
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <FeatureCard
                icon="🔍"
                title="Discover Quality"
                description="Browse thousands of premium fabrics from verified suppliers worldwide"
                delay={0.1}
              />
              <FeatureCard
                icon="🤝"
                title="Trusted Network"
                description="Connect with reliable suppliers and build lasting business relationships"
                delay={0.2}
              />
              <FeatureCard
                icon="⚡"
                title="Seamless Experience"
                description="From discovery to delivery, enjoy a smooth and efficient marketplace"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section id="products" className="py-16 bg-textile-warm/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-between items-center mb-8">
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-bold text-textile-brown"
                >
                  {searchQuery || selectedCategory ? 'Search Results' : 'Featured Products'}
                </motion.h2>
                {(searchQuery || selectedCategory || selectedFabric) && (
                  <p className="text-textile-brown/60 text-sm mt-1">
                    {products.length} product{products.length !== 1 ? 's' : ''} found
                  </p>
                )}
              </div>
              {!searchQuery && !selectedCategory && !selectedFabric && (
                <Link href="/marketplace" className="text-textile-indigo hover:text-textile-royal font-medium transition-colors">
                  View All →
                </Link>
              )}
            </div>

            {loading ? (
              <LoadingSkeleton count={8} type="products" />
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product: any, index: number) => (
                  <ProductCard key={product._id} product={product} index={index} />
                ))}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 card-textile"
              >
                <p className="text-6xl mb-4">🔍</p>
                <h3 className="text-xl font-semibold text-textile-brown">No products found</h3>
                <p className="text-textile-brown/60 mt-2">Try adjusting your search or filters</p>
                <button
                  onClick={clearFilters}
                  className="mt-4 px-6 py-2.5 btn-textile-primary"
                >
                  Clear Filters
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="hero-textile py-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-weave-pattern bg-weave opacity-10"></div>
            <div className="container mx-auto px-4 text-center relative z-10">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold mb-4"
              >
                Ready to Start Your Journey?
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xl mb-8 text-white/80 max-w-2xl mx-auto"
              >
                Join thousands of businesses already using TextileHub
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Link
                  href="/register"
                  className="inline-block px-8 py-3 bg-white text-textile-indigo font-semibold rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-200"
                >
                  Create Free Account
                </Link>
              </motion.div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="bg-textile-charcoal text-textile-cream/60 py-8 border-t border-textile-gold/10">
          <div className="container mx-auto px-4 text-center">
            <p className="mb-2 text-textile-cream/80">🧵 TextileHub — B2B Textile Marketplace</p>
            <p className="text-sm">© 2026 All rights reserved</p>
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}