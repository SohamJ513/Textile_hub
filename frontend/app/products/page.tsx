'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  PlusCircleIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PowerIcon,
  FunnelIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  TagIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function SupplierProducts() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'supplier') {
        router.push('/');
        return;
      }
      fetchProducts(parsed.id || parsed._id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchProducts = async (supplierId: string) => {
    try {
      setLoading(true);
      if (!supplierId) {
        setProducts([]);
        return;
      }
      const response = await api.get(`/products/supplier/${supplierId}`);
      setProducts(response.data.products || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load products');
      }
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      toast.success('Product deleted successfully');
      setProducts(products.filter((p: any) => p._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleToggleActive = async (product: any) => {
    try {
      const response = await api.put(`/products/${product._id}`, {
        ...product,
        isActive: !product.isActive,
      });
      toast.success(`Product ${response.data.product.isActive ? 'activated' : 'deactivated'}`);
      fetchProducts(user?.id || user?._id);
    } catch (error) {
      console.error('Error toggling product:', error);
      toast.error('Failed to update product');
    }
  };

  const filteredProducts = products.filter((p: any) => {
    if (filter === 'active') return p.isActive !== false;
    if (filter === 'inactive') return p.isActive === false;
    return true;
  });

  const filterOptions = [
    { key: 'all', label: 'All', icon: ShoppingBagIcon },
    { key: 'active', label: 'Active', icon: CheckCircleIcon },
    { key: 'inactive', label: 'Inactive', icon: ExclamationTriangleIcon },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner"></div>
            <p className="text-textile-brown/60">Loading products...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
        <div className="container-custom py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                  My Products
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  Manage your product listings
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fetchProducts(user?.id || user?._id)}
                  className="btn-textile-secondary text-sm inline-flex items-center gap-1"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Refresh
                </button>
                <Link
                  href="/supplier/products/new"
                  className="btn-textile-primary text-sm inline-flex items-center gap-2"
                >
                  <PlusCircleIcon className="w-4 h-4" />
                  Add New Product
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card-textile p-4 mb-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <FunnelIcon className="w-5 h-5 text-textile-brown/40" />
              {filterOptions.map((option) => {
                const count = products.filter((p: any) => {
                  if (option.key === 'all') return true;
                  if (option.key === 'active') return p.isActive !== false;
                  if (option.key === 'inactive') return p.isActive === false;
                  return true;
                }).length;
                return (
                  <button
                    key={option.key}
                    onClick={() => setFilter(option.key)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 inline-flex items-center gap-2 ${
                      filter === option.key
                        ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                        : 'bg-textile-cream text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    {option.label}
                    <span className={`text-xs ${filter === option.key ? 'text-white/80' : 'text-textile-brown/40'}`}>
                      ({count})
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Products Grid */}
          <AnimatePresence mode="wait">
            {filteredProducts.length > 0 ? (
              <motion.div
                key="products-grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {filteredProducts.map((product: any, index: number) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-textile hover:shadow-textile-hover transition-all duration-300 overflow-hidden group"
                  >
                    {/* Product Image */}
                    <div className="relative h-48 overflow-hidden rounded-xl">
                      <img
                        src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=300&fit=crop'}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      {/* Status Badge */}
                      <div className="absolute top-3 right-3">
                        <span className={`badge ${product.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                          {product.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {/* Stock Badge */}
                      <div className="absolute bottom-3 left-3">
                        <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-textile-brown truncate text-lg">
                        {product.name}
                      </h3>
                      <p className="text-sm text-textile-brown/60">{product.category}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-2xl font-bold gradient-textile">
                          ${product.price?.toFixed(2)}
                        </span>
                        <span className="text-sm text-textile-brown/60">
                          SKU: {product.sku || 'N/A'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t-2 border-textile-gold/20">
                        <Link
                          href={`/products/${product._id}`}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-textile-indigo/10 text-textile-indigo rounded-lg hover:bg-textile-indigo/20 transition-colors text-sm font-medium"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/supplier/products/edit/${product._id}`}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-textile-gold/10 text-textile-gold rounded-lg hover:bg-textile-gold/20 transition-colors text-sm font-medium"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleActive(product)}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm font-medium ${
                            product.isActive !== false
                              ? 'bg-textile-terracotta/10 text-textile-terracotta hover:bg-textile-terracotta/20'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          <PowerIcon className="w-4 h-4" />
                          {product.isActive !== false ? 'Off' : 'On'}
                        </button>
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="card-textile-warm p-12 text-center col-span-full"
              >
                <p className="text-6xl mb-4">📦</p>
                <h3 className="text-xl font-semibold text-textile-brown mb-2">No products yet</h3>
                <p className="text-textile-brown/60">
                  {filter === 'all' 
                    ? "Start adding products to your store" 
                    : `You don't have any ${filter} products`}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="mt-4 text-textile-indigo hover:text-textile-royal font-medium transition-colors"
                  >
                    View all products →
                  </button>
                )}
                <div className="mt-6">
                  <Link
                    href="/supplier/products/new"
                    className="btn-textile-primary inline-block"
                  >
                    <PlusCircleIcon className="w-4 h-4 inline mr-2" />
                    Add Your First Product
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            <p className="text-center text-xs text-textile-brown/40 mt-3">
              {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} • 
              {products.length} total products
            </p>
          </div>
        </div>
      </div>
    </>
  );
}