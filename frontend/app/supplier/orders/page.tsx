'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardDocumentListIcon,
  ClockIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  PlusCircleIcon,
  FunnelIcon,
  XMarkIcon,
  MapPinIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function SupplierOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingData, setTrackingData] = useState({
    trackingNumber: '',
    carrier: '',
    note: ''
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== 'supplier') {
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
      const response = await api.get('/orders/supplier');
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: string, note?: string) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status, note: note || '' });
      toast.success(`Order status updated to ${status}`);
      fetchOrders();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast.error(error.response?.data?.error || 'Failed to update order');
    }
  };

  const addTracking = async () => {
    if (!selectedOrderId) return;
    
    try {
      await api.patch(`/orders/${selectedOrderId}/status`, {
        status: 'shipped',
        trackingNumber: trackingData.trackingNumber,
        carrier: trackingData.carrier,
        note: trackingData.note || `Shipped via ${trackingData.carrier}`
      });
      toast.success('Tracking information added and order shipped');
      setShowTrackingModal(false);
      setTrackingData({ trackingNumber: '', carrier: '', note: '' });
      fetchOrders();
    } catch (error: any) {
      console.error('Error adding tracking:', error);
      toast.error(error.response?.data?.error || 'Failed to add tracking');
    }
  };

  const openTrackingModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowTrackingModal(true);
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

  const filteredOrders = orders.filter((order: any) => {
    if (filter === 'all') return true;
    return order.status === filter;
  });

  const canShip = (order: any) => {
    return order.status === 'processing' && order.paymentStatus === 'paid';
  };

  const statusFilters = [
    { key: 'all', label: 'All Orders', icon: ClipboardDocumentListIcon },
    { key: 'pending', label: 'Pending', icon: ClockIcon },
    { key: 'processing', label: 'Processing', icon: ArrowPathIcon },
    { key: 'shipped', label: 'Shipped', icon: TruckIcon },
    { key: 'delivered', label: 'Delivered', icon: CheckCircleIcon },
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
                <div className="h-10 bg-textile-gold/10 rounded w-32 animate-pulse"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card-textile p-4 animate-pulse">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 bg-textile-gold/10 rounded"></div>
                    <div className="h-6 bg-textile-gold/10 rounded w-8"></div>
                  </div>
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
                  Orders
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  Manage incoming orders
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fetchOrders()}
                  className="btn-textile-secondary text-sm inline-flex items-center gap-1"
                >
                  <ArrowPathIcon className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
          </motion.div>

          {/* Stats Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 mb-6"
          >
            {statusFilters.map((stat, index) => {
              const count = orders.filter((o: any) => stat.key === 'all' || o.status === stat.key).length;
              return (
                <motion.button
                  key={stat.key}
                  onClick={() => setFilter(stat.key)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  className={`card-textile p-4 text-center hover:shadow-textile-hover transition-all duration-200 ${
                    filter === stat.key
                      ? 'border-textile-gold/40 shadow-textile'
                      : 'border-textile-gold/10'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <stat.icon className="w-4 h-4 text-textile-brown/60" />
                    <p className="text-xl font-bold text-textile-brown">{count}</p>
                  </div>
                  <p className="text-xs text-textile-brown/60 capitalize">{stat.label}</p>
                </motion.button>
              );
            })}
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
                    transition={{ delay: index * 0.03 }}
                    className="card-textile hover:shadow-textile-hover transition-all duration-300"
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
                      {/* Order Info */}
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-textile-brown">
                            Order #{order.orderNumber}
                          </h3>
                          <span className={`badge ${getStatusColor(order.status)}`}>
                            <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${getStatusDot(order.status)}`}></span>
                            {getStatusIcon(order.status)} {order.status}
                          </span>
                          {order.trackingNumber && (
                            <span className="badge-info text-xs inline-flex items-center gap-1">
                              📦 Track: {order.trackingNumber}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          <p className="text-textile-brown/60">
                            📅 {new Date(order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-textile-brown/60">
                            📦 {order.items?.length || 0} items
                          </p>
                          <p className="text-textile-brown/60 flex items-center gap-1">
                            <UserIcon className="w-3 h-3" />
                            {order.buyerId?.name || 'Unknown'}
                          </p>
                        </div>
                        
                        <p className="text-2xl font-bold gradient-textile mt-2">
                          ${order.total?.toFixed(2) || '0.00'}
                        </p>
                        
                        {order.notes && (
                          <p className="text-sm text-textile-brown/60 mt-1 italic border-l-2 border-textile-gold/30 pl-3">
                            📝 {order.notes}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <Link
                          href={`/orders/${order._id}`}
                          className="btn-textile-secondary text-sm inline-flex items-center gap-1"
                        >
                          <EyeIcon className="w-4 h-4" />
                          Details
                        </Link>

                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'processing', 'Order being prepared')}
                            className="btn-textile-primary text-sm inline-flex items-center gap-1"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                            Process
                          </button>
                        )}

                        {canShip(order) && (
                          <button
                            onClick={() => openTrackingModal(order._id)}
                            className="btn-textile-gold text-sm inline-flex items-center gap-1"
                          >
                            <TruckIcon className="w-4 h-4" />
                            Ship Order
                          </button>
                        )}

                        {order.status === 'processing' && !order.trackingNumber && (
                          <button
                            onClick={() => openTrackingModal(order._id)}
                            className="btn-textile-gold text-sm inline-flex items-center gap-1"
                          >
                            <PlusCircleIcon className="w-4 h-4" />
                            Add Tracking
                          </button>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'delivered', 'Order delivered to customer')}
                            className="btn-textile-primary text-sm inline-flex items-center gap-1"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                            Mark Delivered
                          </button>
                        )}

                        {['pending', 'processing'].includes(order.status) && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to cancel this order?')) {
                                updateOrderStatus(order._id, 'cancelled', 'Order cancelled by supplier');
                              }
                            }}
                            className="btn-textile-terracotta text-sm inline-flex items-center gap-1"
                          >
                            <XCircleIcon className="w-4 h-4" />
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tracking Info - if available */}
                    {order.trackingNumber && (
                      <div className="mt-4 pt-4 border-t-2 border-textile-gold/20 flex flex-wrap items-center gap-4">
                        <span className="text-sm text-textile-brown/60 flex items-center gap-1">
                          <TruckIcon className="w-4 h-4" />
                          Tracking:
                        </span>
                        <span className="text-sm font-medium text-textile-brown">{order.trackingNumber}</span>
                        <span className="text-sm text-textile-brown/60">via {order.carrier || 'Unknown'}</span>
                        <button
                          onClick={() => window.open(`https://www.google.com/search?q=${order.carrier || 'tracking'}+${order.trackingNumber}`, '_blank')}
                          className="text-sm text-textile-indigo hover:text-textile-royal transition-colors underline"
                        >
                          Track →
                        </button>
                      </div>
                    )}
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
                <p className="text-6xl mb-4">📋</p>
                <h3 className="text-xl font-semibold text-textile-brown mb-2">No orders yet</h3>
                <p className="text-textile-brown/60">
                  {filter === 'all' 
                    ? "Orders will appear here once customers start buying" 
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
              {orders.length} total orders
            </p>
          </div>
        </div>
      </div>

      {/* Tracking Modal */}
      <AnimatePresence>
        {showTrackingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => {
              setShowTrackingModal(false);
              setTrackingData({ trackingNumber: '', carrier: '', note: '' });
            }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 max-w-md w-full shadow-textile border-2 border-textile-gold/20"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold gradient-textile flex items-center gap-2">
                  <TruckIcon className="w-6 h-6 text-textile-indigo" />
                  Add Tracking Information
                </h2>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingData({ trackingNumber: '', carrier: '', note: '' });
                  }}
                  className="p-1 hover:bg-textile-gold/10 rounded-lg transition-colors"
                >
                  <XMarkIcon className="w-6 h-6 text-textile-brown" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="input-label">Carrier *</label>
                  <select
                    value={trackingData.carrier}
                    onChange={(e) => setTrackingData({ ...trackingData, carrier: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Select carrier</option>
                    <option value="FedEx">FedEx</option>
                    <option value="UPS">UPS</option>
                    <option value="DHL">DHL</option>
                    <option value="USPS">USPS</option>
                    <option value="Blue Dart">Blue Dart</option>
                    <option value="DTDC">DTDC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="input-label">Tracking Number *</label>
                  <input
                    type="text"
                    value={trackingData.trackingNumber}
                    onChange={(e) => setTrackingData({ ...trackingData, trackingNumber: e.target.value })}
                    className="input-field"
                    placeholder="Enter tracking number"
                  />
                </div>

                <div>
                  <label className="input-label">Note (Optional)</label>
                  <textarea
                    value={trackingData.note}
                    onChange={(e) => setTrackingData({ ...trackingData, note: e.target.value })}
                    className="input-field"
                    placeholder="Add a note for the customer..."
                    rows={2}
                  />
                  <p className="input-help">This note will be visible to the customer</p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={addTracking}
                  disabled={!trackingData.carrier || !trackingData.trackingNumber}
                  className="flex-1 btn-textile-primary disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  <TruckIcon className="w-4 h-4" />
                  Ship & Add Tracking
                </button>
                <button
                  onClick={() => {
                    setShowTrackingModal(false);
                    setTrackingData({ trackingNumber: '', carrier: '', note: '' });
                  }}
                  className="px-4 py-2 btn-textile-secondary"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}