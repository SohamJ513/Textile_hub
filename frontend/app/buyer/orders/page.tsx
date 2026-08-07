'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBagIcon, 
  ClockIcon, 
  TruckIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  EyeIcon,
  TrashIcon,
  StarIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function BuyerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'buyer') {
        router.push('/');
        return;
      }
      fetchOrders();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/buyer');
      const ordersList = response.data.orders || [];
      setOrders(ordersList);
      
      setStats({
        total: ordersList.length,
        pending: ordersList.filter((o: any) => o.status === 'pending').length,
        processing: ordersList.filter((o: any) => o.status === 'processing').length,
        shipped: ordersList.filter((o: any) => o.status === 'shipped').length,
        delivered: ordersList.filter((o: any) => o.status === 'delivered').length,
        cancelled: ordersList.filter((o: any) => o.status === 'cancelled').length,
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
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

  const getStatusDot = (status: string) => {
    const dots: Record<string, string> = {
      pending: 'status-dot-gold',
      processing: 'status-dot-blue',
      shipped: 'status-dot-blue',
      delivered: 'status-dot-green',
      cancelled: 'status-dot-red',
      refunded: 'status-dot',
    };
    return dots[status] || 'status-dot';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredOrders = orders.filter((order: any) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const statCards = [
    { key: 'total', label: 'Total Orders', icon: ShoppingBagIcon, color: 'text-textile-indigo', bgColor: 'bg-textile-indigo/10' },
    { key: 'pending', label: 'Pending', icon: ClockIcon, color: 'text-textile-gold', bgColor: 'bg-textile-gold/10' },
    { key: 'processing', label: 'Processing', icon: ArrowPathIcon, color: 'text-textile-royal', bgColor: 'bg-textile-royal/10' },
    { key: 'shipped', label: 'Shipped', icon: TruckIcon, color: 'text-textile-royal', bgColor: 'bg-textile-royal/10' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'cancelled', label: 'Cancelled', icon: XCircleIcon, color: 'text-textile-terracotta', bgColor: 'bg-textile-terracotta/10' },
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
                  <div className="h-10 bg-textile-gold/10 rounded w-48 animate-pulse"></div>
                  <div className="h-5 bg-textile-gold/10 rounded w-64 mt-2 animate-pulse"></div>
                </div>
                <div className="h-10 bg-textile-gold/10 rounded w-40 animate-pulse"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-textile p-4 animate-pulse">
                  <div className="w-10 h-10 bg-textile-gold/10 rounded-full mx-auto mb-2"></div>
                  <div className="h-6 bg-textile-gold/10 rounded w-12 mx-auto"></div>
                  <div className="h-3 bg-textile-gold/10 rounded w-16 mx-auto mt-1"></div>
                </div>
              ))}
            </div>
            
            {/* Orders Skeleton */}
            <LoadingSkeleton type="orders" count={5} />
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
                  My Orders
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  View and track all your orders
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/marketplace"
                  className="btn-textile-secondary text-sm"
                >
                  <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                  Continue Shopping
                </Link>
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6"
          >
            {statCards.map((stat, index) => (
              <motion.button
                key={stat.key}
                onClick={() => setFilter(stat.key === 'total' ? 'all' : stat.key)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                className={`card-textile p-4 text-center hover:shadow-textile-hover transition-all duration-200 ${
                  (stat.key === 'total' && filter === 'all') || filter === stat.key
                    ? 'border-textile-gold/40 shadow-textile'
                    : 'border-textile-gold/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-full ${stat.bgColor} flex items-center justify-center mx-auto mb-2`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <p className={`text-xl font-bold ${stat.color}`}>
                  {stats[stat.key as keyof typeof stats] || 0}
                </p>
                <p className="text-xs text-textile-brown/60 capitalize">{stat.label}</p>
              </motion.button>
            ))}
          </motion.div>

          {/* Status Filters */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-6"
          >
            <FunnelIcon className="w-5 h-5 text-textile-brown/40 mr-2 self-center" />
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filter === status
                    ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                    : 'bg-white/50 text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                }`}
              >
                {status === 'all' ? 'All Orders' : status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-1 text-xs opacity-70">
                  ({orders.filter((o: any) => status === 'all' || o.status === status).length})
                </span>
              </button>
            ))}
          </motion.div>

          {/* Orders List */}
          <AnimatePresence mode="wait">
            {filteredOrders.length > 0 ? (
              <motion.div
                key="orders-list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {filteredOrders.map((order: any, index: number) => (
                  <motion.div
                    key={order._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-textile hover:shadow-textile-hover transition-all duration-300"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-4">
                      {/* Order Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Link
                            href={`/orders/${order._id}`}
                            className="text-lg font-semibold text-textile-indigo hover:text-textile-royal transition-colors hover:underline"
                          >
                            Order #{order.orderNumber}
                          </Link>
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getStatusDot(order.status)}`}></span>
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                        </div>
                        <p className="text-sm text-textile-brown/60 mt-1">
                          Placed on {formatDate(order.createdAt)}
                        </p>
                        <p className="text-sm text-textile-brown/80 mt-1">
                          {order.items?.length || 0} items • 
                          <span className="font-semibold text-textile-brown ml-1">
                            ${order.total?.toFixed(2) || '0.00'}
                          </span>
                        </p>
                        {order.trackingNumber && (
                          <p className="text-sm text-textile-indigo mt-1">
                            📦 Tracking: {order.trackingNumber} 
                            {order.carrier && ` (${order.carrier})`}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/orders/${order._id}`}
                          className="btn-textile-primary text-sm inline-flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          View Details
                        </Link>
                        {order.status === 'pending' && (
                          <button
                            onClick={async () => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                try {
                                  await api.patch(`/orders/${order._id}/cancel`);
                                  toast.success('Order cancelled successfully');
                                  fetchOrders();
                                } catch (error) {
                                  toast.error('Failed to cancel order');
                                }
                              }
                            }}
                            className="btn-textile-terracotta text-sm inline-flex items-center gap-1"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Cancel Order
                          </button>
                        )}
                        {order.status === 'delivered' && (
                          <Link
                            href={`/reviews/new?productId=${order.items?.[0]?.productId?._id || ''}&orderId=${order._id}`}
                            className="btn-textile-gold text-sm inline-flex items-center gap-1"
                          >
                            <StarIcon className="w-4 h-4" />
                            Write a Review
                          </Link>
                        )}
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
                className="card-textile-warm p-12 text-center"
              >
                <p className="text-6xl mb-4">📦</p>
                <h3 className="text-xl font-semibold text-textile-brown mb-2">No orders found</h3>
                <p className="text-textile-brown/60">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet" 
                    : `You don't have any ${filter} orders`}
                </p>
                {filter !== 'all' && (
                  <button
                    onClick={() => setFilter('all')}
                    className="mt-4 text-textile-indigo hover:text-textile-royal font-medium transition-colors"
                  >
                    View all orders →
                  </button>
                )}
                <div className="mt-6">
                  <Link
                    href="/marketplace"
                    className="btn-textile-primary inline-block"
                  >
                    Browse Products
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
              {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} • 
              {stats.total} total orders
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}