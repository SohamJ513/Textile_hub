'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  TruckIcon, 
  CurrencyDollarIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  ArrowRightIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton, StatsSkeleton } from '@/components/common/LoadingSkeleton';

export default function BuyerDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    shippedOrders: 0,
    totalSpent: 0,
  });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'buyer') {
        router.push('/');
        return;
      }
      fetchDashboardData();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const ordersRes = await api.get('/orders/buyer');
      const ordersList = ordersRes.data.orders || [];
      setOrders(ordersList);
      
      const totalOrders = ordersList.length;
      const pendingOrders = ordersList.filter((o: any) => o.status === 'pending').length;
      const shippedOrders = ordersList.filter((o: any) => o.status === 'shipped').length;
      const totalSpent = ordersList
        .filter((o: any) => o.status === 'delivered' || o.status === 'shipped')
        .reduce((sum: number, o: any) => sum + o.total, 0);

      setStats({
        totalOrders,
        pendingOrders,
        shippedOrders,
        totalSpent,
      });
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
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: ShoppingBagIcon,
      color: 'text-textile-indigo',
      bgColor: 'bg-textile-indigo/10',
      borderColor: 'border-textile-indigo/20',
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
      title: 'Shipped Orders',
      value: stats.shippedOrders,
      icon: TruckIcon,
      color: 'text-textile-royal',
      bgColor: 'bg-textile-royal/10',
      borderColor: 'border-textile-royal/20',
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(2)}`,
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
                  Buyer Dashboard
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  Welcome back, {user?.name}! 🧵
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/marketplace"
                  className="btn-textile-secondary text-sm"
                >
                  <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                  Browse Products
                </Link>
              </div>
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
                  { id: 'profile', label: 'Profile', icon: UserCircleIcon },
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
                          <ClipboardDocumentListIcon className="w-5 h-5 text-textile-indigo" />
                          Recent Orders
                        </h3>
                        <Link
                          href="/buyer/orders"
                          className="text-sm text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                        >
                          View All
                          <ArrowRightIcon className="w-3 h-3" />
                        </Link>
                      </div>
                      {orders.length > 0 ? (
                        <div className="space-y-3">
                          {orders.slice(0, 5).map((order: any, index: number) => (
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
                        <div className="text-center py-12 card-textile-warm">
                          <p className="text-6xl mb-4">🛍️</p>
                          <p className="text-textile-brown/60">No orders yet</p>
                          <Link
                            href="/marketplace"
                            className="mt-3 inline-block btn-textile-primary text-sm"
                          >
                            Start Shopping
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Quick Actions */}
                    <div className="border-t-2 border-textile-gold/20 pt-6">
                      <h3 className="text-lg font-semibold text-textile-brown mb-4 flex items-center gap-2">
                        <PlusCircleIcon className="w-5 h-5 text-textile-gold" />
                        Quick Actions
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Link
                          href="/marketplace"
                          className="p-4 bg-textile-indigo/5 rounded-xl text-center hover:bg-textile-indigo/10 transition-all duration-200 border-2 border-textile-indigo/10 hover:border-textile-indigo/30"
                        >
                          <div className="text-3xl mb-1">🛍️</div>
                          <span className="text-sm font-medium text-textile-indigo">Browse Products</span>
                        </Link>
                        <Link
                          href="/buyer/orders"
                          className="p-4 bg-textile-gold/5 rounded-xl text-center hover:bg-textile-gold/10 transition-all duration-200 border-2 border-textile-gold/10 hover:border-textile-gold/30"
                        >
                          <div className="text-3xl mb-1">📋</div>
                          <span className="text-sm font-medium text-textile-gold">View All Orders</span>
                        </Link>
                        <Link
                          href="/cart"
                          className="p-4 bg-textile-terracotta/5 rounded-xl text-center hover:bg-textile-terracotta/10 transition-all duration-200 border-2 border-textile-terracotta/10 hover:border-textile-terracotta/30"
                        >
                          <div className="text-3xl mb-1">🛒</div>
                          <span className="text-sm font-medium text-textile-terracotta">View Cart</span>
                        </Link>
                      </div>
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
                      <span className="text-sm text-textile-brown/60">
                        {orders.length} order{orders.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {orders.length > 0 ? (
                      <div className="space-y-3">
                        {orders.map((order: any, index: number) => (
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

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h3 className="text-lg font-semibold text-textile-brown mb-6 flex items-center gap-2">
                      <UserCircleIcon className="w-5 h-5 text-textile-indigo" />
                      Profile Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10">
                          <p className="text-sm text-textile-brown/60">Full Name</p>
                          <p className="font-medium text-textile-brown text-lg">{user?.name}</p>
                        </div>
                        <div className="p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10">
                          <p className="text-sm text-textile-brown/60">Email</p>
                          <p className="font-medium text-textile-brown text-lg">{user?.email}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10">
                          <p className="text-sm text-textile-brown/60">Role</p>
                          <p className="font-medium text-textile-brown text-lg capitalize flex items-center gap-2">
                            🛍️ {user?.role}
                          </p>
                        </div>
                        {user?.businessName && (
                          <div className="p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10">
                            <p className="text-sm text-textile-brown/60">Business Name</p>
                            <p className="font-medium text-textile-brown text-lg">{user?.businessName}</p>
                          </div>
                        )}
                        <div className="p-4 bg-textile-warm/50 rounded-xl border-2 border-textile-gold/10">
                          <p className="text-sm text-textile-brown/60">Onboarding Status</p>
                          <p className={`font-medium text-lg ${
                            user?.onboardingCompleted ? 'text-green-600' : 'text-textile-gold'
                          }`}>
                            {user?.onboardingCompleted ? '✅ Completed' : '⏳ Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-6 border-t-2 border-textile-gold/20">
                      <Link
                        href="/profile"
                        className="btn-textile-primary text-sm inline-flex items-center gap-2"
                      >
                        <UserCircleIcon className="w-4 h-4" />
                        Edit Profile
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}