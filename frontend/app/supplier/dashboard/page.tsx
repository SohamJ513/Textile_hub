'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  ClockIcon,
  HomeIcon,
  PlusCircleIcon,
  ArrowRightIcon,
  EyeIcon,
  PencilIcon,
  TruckIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton, StatsSkeleton } from '@/components/common/LoadingSkeleton';

export default function SupplierDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    revenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'supplier') {
        router.push('/');
        return;
      }
      fetchDashboardData(parsed.id || parsed._id);
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchDashboardData = async (supplierId: string) => {
    try {
      setLoading(true);
      
      const ordersRes = await api.get('/orders/supplier');
      const orders = ordersRes.data.orders || [];
      setRecentOrders(orders.slice(0, 5));
      
      const totalOrders = orders.length;
      const pendingOrders = orders.filter((o: any) => o.status === 'pending').length;
      const revenue = orders
        .filter((o: any) => o.status === 'delivered' || o.status === 'shipped')
        .reduce((sum: number, o: any) => sum + o.total, 0);

      if (supplierId) {
        try {
          const productsRes = await api.get(`/products/supplier/${supplierId}`);
          const products = productsRes.data.products || [];
          setRecentProducts(products.slice(0, 5));
          
          setStats({
            totalProducts: products.length,
            totalOrders,
            pendingOrders,
            revenue,
          });
        } catch (productError: any) {
          if (productError.response?.status !== 404) {
            console.error('Error fetching products:', productError);
          }
          setStats({
            totalProducts: 0,
            totalOrders,
            pendingOrders,
            revenue,
          });
        }
      } else {
        setStats({
          totalProducts: 0,
          totalOrders,
          pendingOrders,
          revenue,
        });
      }
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'badge-warning',
      processing: 'badge-info',
      shipped: 'badge-info',
      delivered: 'badge-success',
      cancelled: 'badge-danger',
      refunded: 'badge-neutral',
    };
    return colors[status] || 'badge-neutral';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, string> = {
      pending: '⏳',
      processing: '🔄',
      shipped: '📦',
      delivered: '✅',
      cancelled: '❌',
      refunded: '💰',
    };
    return icons[status] || '📋';
  };

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      color: 'text-textile-indigo',
      bgColor: 'bg-textile-indigo/10',
      borderColor: 'border-textile-indigo/20',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ClipboardDocumentListIcon,
      color: 'text-textile-royal',
      bgColor: 'bg-textile-royal/10',
      borderColor: 'border-textile-royal/20',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ClockIcon,
      color: 'text-textile-gold',
      bgColor: 'bg-textile-gold/10',
      borderColor: 'border-textile-gold/20',
    },
    {
      title: 'Total Revenue',
      value: `$${stats.revenue.toFixed(2)}`,
      icon: CurrencyDollarIcon,
      color: 'text-textile-terracotta',
      bgColor: 'bg-textile-terracotta/10',
      borderColor: 'border-textile-terracotta/20',
    },
  ];

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
          <div className="container-custom py-8">
            {/* Header Skeleton */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <div className="h-10 bg-textile-gold/10 rounded w-64 animate-pulse"></div>
                  <div className="h-5 bg-textile-gold/10 rounded w-48 mt-2 animate-pulse"></div>
                </div>
                <div className="h-10 bg-textile-gold/10 rounded w-40 animate-pulse"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <StatsSkeleton />
            
            {/* Tab Content Skeleton */}
            <div className="mt-8">
              <div className="card-textile overflow-hidden">
                <div className="border-b-2 border-textile-gold/20 px-6 py-4">
                  <div className="flex gap-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-10 bg-textile-gold/10 rounded w-24 animate-pulse"></div>
                    ))}
                  </div>
                </div>
                <div className="p-6">
                  <LoadingSkeleton type="orders" count={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

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
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                  Supplier Dashboard
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  Welcome back, {user?.name}! 🏭
                </p>
              </div>
              <Link
                href="/supplier/products/new"
                className="btn-textile-primary text-sm inline-flex items-center gap-2"
              >
                <PlusCircleIcon className="w-4 h-4" />
                Add New Product
              </Link>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + index * 0.1 }}
                className={`card-textile border-2 ${stat.borderColor} hover:shadow-textile-hover transition-all duration-300`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-textile-brown/60">{stat.title}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-textile overflow-hidden"
          >
            <div className="border-b-2 border-textile-gold/20">
              <nav className="flex flex-wrap gap-1 px-6">
                {[
                  { id: 'overview', label: 'Overview', icon: HomeIcon },
                  { id: 'orders', label: 'Orders', icon: ClipboardDocumentListIcon },
                  { id: 'products', label: 'Products', icon: ShoppingBagIcon },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-4 border-b-2 font-medium text-sm transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'border-textile-gold text-textile-indigo'
                        : 'border-transparent text-textile-brown/60 hover:text-textile-brown hover:border-textile-gold/30'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Recent Orders */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-textile-brown flex items-center gap-2">
                          <TruckIcon className="w-5 h-5 text-textile-indigo" />
                          Recent Orders
                        </h3>
                        <Link
                          href="/supplier/orders"
                          className="text-sm text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                        >
                          View All
                          <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                      </div>
                      {recentOrders.length > 0 ? (
                        <div className="space-y-3">
                          {recentOrders.map((order: any, index: number) => (
                            <motion.div
                              key={order._id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10 hover:border-textile-gold/30 transition-all duration-200"
                            >
                              <div>
                                <p className="font-medium text-textile-brown">
                                  Order #{order.orderNumber}
                                </p>
                                <p className="text-sm text-textile-brown/60">
                                  {order.items?.length || 0} items • ${order.total?.toFixed(2) || '0.00'}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                <span className={`badge ${getStatusColor(order.status)}`}>
                                  {getStatusIcon(order.status)} {order.status}
                                </span>
                                <Link
                                  href={`/orders/${order._id}`}
                                  className="text-textile-indigo hover:text-textile-royal text-sm font-medium transition-colors flex items-center gap-1"
                                >
                                  View
                                  <ArrowRightIcon className="w-3 h-3" />
                                </Link>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 card-textile-warm">
                          <p className="text-4xl mb-2">📭</p>
                          <p className="text-textile-brown/60">No orders yet</p>
                        </div>
                      )}
                    </div>

                    {/* Recent Products */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-textile-brown flex items-center gap-2">
                          <ShoppingBagIcon className="w-5 h-5 text-textile-indigo" />
                          Recent Products
                        </h3>
                        <Link
                          href="/supplier/products"
                          className="text-sm text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                        >
                          View All
                          <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                      </div>
                      {recentProducts.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {recentProducts.map((product: any, index: number) => (
                            <motion.div
                              key={product._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className="flex items-center gap-4 p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10 hover:border-textile-gold/30 transition-all duration-200"
                            >
                              <img
                                src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=100&h=100&fit=crop'}
                                alt={product.name}
                                className="w-16 h-16 object-cover rounded-lg"
                                loading="lazy"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-textile-brown truncate">{product.name}</p>
                                <p className="text-sm text-textile-brown/60">
                                  ${product.price?.toFixed(2) || '0.00'} • {product.stock || 0} in stock
                                </p>
                              </div>
                              <span className={`badge ${product.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                                {product.isActive !== false ? 'Active' : 'Inactive'}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 card-textile-warm">
                          <p className="text-4xl mb-2">📦</p>
                          <p className="text-textile-brown/60">No products yet.</p>
                          <Link
                            href="/supplier/products/new"
                            className="mt-3 inline-block btn-textile-primary text-sm"
                          >
                            Add your first product
                          </Link>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                  <motion.div
                    key="orders"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-textile-brown flex items-center gap-2">
                        <ClipboardDocumentListIcon className="w-5 h-5 text-textile-indigo" />
                        All Orders
                      </h3>
                      <Link
                        href="/supplier/orders"
                        className="text-sm text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                      >
                        View All
                        <ArrowRightIcon className="w-3 h-3" />
                      </Link>
                    </div>
                    {recentOrders.length > 0 ? (
                      <div className="space-y-3">
                        {recentOrders.map((order: any, index: number) => (
                          <motion.div
                            key={order._id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10 hover:border-textile-gold/30 transition-all duration-200"
                          >
                            <div>
                              <p className="font-medium text-textile-brown">
                                Order #{order.orderNumber}
                              </p>
                              <p className="text-sm text-textile-brown/60">
                                {new Date(order.createdAt).toLocaleDateString()} • {order.items?.length || 0} items • ${order.total?.toFixed(2) || '0.00'}
                              </p>
                            </div>
                            <div className="flex items-center gap-3 mt-2 sm:mt-0">
                              <span className={`badge ${getStatusColor(order.status)}`}>
                                {getStatusIcon(order.status)} {order.status}
                              </span>
                              <Link
                                href={`/orders/${order._id}`}
                                className="text-textile-indigo hover:text-textile-royal text-sm font-medium transition-colors flex items-center gap-1"
                              >
                                View
                                <ArrowRightIcon className="w-3 h-3" />
                              </Link>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 card-textile-warm">
                        <p className="text-6xl mb-4">📭</p>
                        <p className="text-textile-brown/60">No orders yet</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Products Tab */}
                {activeTab === 'products' && (
                  <motion.div
                    key="products"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-textile-brown flex items-center gap-2">
                        <ShoppingBagIcon className="w-5 h-5 text-textile-indigo" />
                        All Products
                      </h3>
                      <div className="flex gap-2">
                        <Link
                          href="/supplier/products"
                          className="text-sm text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                        >
                          Manage
                          <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                        <Link
                          href="/supplier/products/new"
                          className="text-sm btn-textile-primary inline-flex items-center gap-1"
                        >
                          <PlusCircleIcon className="w-4 h-4" />
                          Add
                        </Link>
                      </div>
                    </div>
                    {recentProducts.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentProducts.map((product: any, index: number) => (
                          <motion.div
                            key={product._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center gap-4 p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10 hover:border-textile-gold/30 transition-all duration-200"
                          >
                            <img
                              src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=100&h=100&fit=crop'}
                              alt={product.name}
                              className="w-16 h-16 object-cover rounded-lg"
                              loading="lazy"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-textile-brown truncate">{product.name}</p>
                              <p className="text-sm text-textile-brown/60">
                                ${product.price?.toFixed(2) || '0.00'} • {product.stock || 0} in stock
                              </p>
                            </div>
                            <span className={`badge ${product.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                              {product.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 card-textile-warm">
                        <p className="text-6xl mb-4">📦</p>
                        <p className="text-textile-brown/60">No products yet</p>
                        <Link
                          href="/supplier/products/new"
                          className="mt-3 inline-block btn-textile-primary text-sm"
                        >
                          Add your first product
                        </Link>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

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
              {stats.totalProducts} products • {stats.totalOrders} orders • ${stats.revenue.toFixed(2)} revenue
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}