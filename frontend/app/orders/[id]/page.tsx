'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  ShoppingBagIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

// Order Status Timeline Component
function OrderTimeline({ statusHistory, currentStatus }: { statusHistory: any[]; currentStatus: string }) {
  const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
  const currentIndex = statusOrder.indexOf(currentStatus);
  
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-textile-gold',
      processing: 'bg-textile-royal',
      shipped: 'bg-textile-indigo',
      delivered: 'bg-green-500',
      cancelled: 'bg-textile-terracotta',
      refunded: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-300';
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  // If cancelled, show different timeline
  if (currentStatus === 'cancelled') {
    return (
      <div className="card-textile-warm p-6 text-center border-2 border-textile-terracotta/20">
        <p className="text-5xl mb-3">❌</p>
        <p className="font-semibold text-textile-terracotta text-lg">Order Cancelled</p>
        <p className="text-sm text-textile-brown/60 mt-2">
          This order was cancelled on {new Date(
            statusHistory.find((h: any) => h.status === 'cancelled')?.timestamp || Date.now()
          ).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        {statusHistory.find((h: any) => h.status === 'cancelled')?.note && (
          <p className="text-sm text-textile-brown/50 mt-2 italic">
            "{statusHistory.find((h: any) => h.status === 'cancelled')?.note}"
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline Line */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-textile-gold/20"></div>
      
      <div className="space-y-6">
        {statusOrder.map((status, index) => {
          const isCompleted = statusOrder.indexOf(status) <= currentIndex;
          const historyEntry = statusHistory.find((h: any) => h.status === status);
          
          return (
            <motion.div 
              key={status} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative flex items-start gap-4"
            >
              {/* Status Dot */}
              <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                isCompleted ? getStatusColor(status) : 'bg-textile-gold/10'
              } ${isCompleted ? 'shadow-lg shadow-' + status + '/20' : ''}`}>
                <span className="text-xl">{getStatusIcon(status)}</span>
              </div>
              
              {/* Status Content */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center gap-2">
                  <h4 className={`font-semibold ${
                    isCompleted ? 'text-textile-brown' : 'text-textile-brown/40'
                  }`}>
                    {getStatusLabel(status)}
                  </h4>
                  {isCompleted && (
                    <CheckCircleIcon className="w-4 h-4 text-green-500" />
                  )}
                </div>
                
                {historyEntry && (
                  <div className="text-sm text-textile-brown/60">
                    <p className="flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {new Date(historyEntry.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {historyEntry.note && (
                      <p className="text-xs text-textile-brown/40 mt-1 italic pl-4 border-l-2 border-textile-gold/20">
                        "{historyEntry.note}"
                      </p>
                    )}
                  </div>
                )}
                
                {/* Estimated delivery for shipped status */}
                {status === 'shipped' && isCompleted && (
                  <p className="text-xs text-textile-indigo mt-1 flex items-center gap-1">
                    <TruckIcon className="w-3 h-3" />
                    Estimated delivery: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrderDetails() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    } else {
      router.push('/login');
      return;
    }
    
    if (orderId) {
      fetchOrder(orderId);
    }
  }, [orderId]);

  const fetchOrder = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/orders/${id}`);
      setOrder(response.data.order);
    } catch (error: any) {
      console.error('Error fetching order:', error);
      toast.error(error.response?.data?.error || 'Failed to load order details');
      router.push('/');
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

  const handleCancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
      fetchOrder(orderId);
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner"></div>
            <p className="text-textile-brown/60">Loading order details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="card-textile-warm p-12 text-center max-w-md">
            <p className="text-6xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-textile-brown">Order Not Found</h1>
            <Link href="/" className="inline-block mt-6 btn-textile-primary">
              Go Home
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
        <div className="container-custom py-8 max-w-6xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-between items-start gap-4 mb-8"
          >
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                  Order #{order.orderNumber}
                </h1>
                <span className={`badge ${getStatusColor(order.status)} text-sm`}>
                  {getStatusIcon(order.status)} {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <p className="text-textile-brown/60 mt-1 flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <Link
              href={user?.role === 'buyer' ? '/buyer/orders' : '/supplier/orders'}
              className="btn-textile-secondary text-sm inline-flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Orders
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Order Timeline - Left Column */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="card-textile p-6">
                <h2 className="text-xl font-semibold text-textile-brown mb-6 flex items-center gap-2">
                  <ClockIcon className="w-6 h-6 text-textile-gold" />
                  Order Status
                </h2>
                <OrderTimeline 
                  statusHistory={order.statusHistory || [{ status: order.status, timestamp: order.createdAt, note: 'Order created' }]} 
                  currentStatus={order.status}
                />
                
                {/* Tracking Info */}
                {order.trackingNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-textile-indigo/5 rounded-xl border-2 border-textile-indigo/20"
                  >
                    <h3 className="text-sm font-medium text-textile-indigo flex items-center gap-2">
                      <TruckIcon className="w-4 h-4" />
                      Tracking Information
                    </h3>
                    <p className="text-sm text-textile-brown mt-1">
                      <span className="font-medium">{order.carrier || 'Carrier'}:</span> {order.trackingNumber}
                    </p>
                    <button 
                      onClick={() => window.open(`https://www.google.com/search?q=${order.carrier || 'tracking'}+tracking+${order.trackingNumber}`, '_blank')}
                      className="mt-2 text-sm text-textile-indigo hover:text-textile-royal transition-colors underline inline-flex items-center gap-1"
                    >
                      Track Package →
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>

            {/* Order Summary - Right Column */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Order Items */}
              <div className="card-textile p-6">
                <h2 className="text-lg font-semibold text-textile-brown mb-4 flex items-center gap-2">
                  <ShoppingBagIcon className="w-5 h-5 text-textile-gold" />
                  Order Items
                </h2>
                <div className="space-y-3">
                  {order.items.map((item: any, index: number) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 py-2 border-b-2 border-textile-gold/10 last:border-0"
                    >
                      <img
                        src={item.productId?.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=50&h=50&fit=crop'}
                        alt={item.productId?.name || 'Product'}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-textile-gold/10"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-textile-brown truncate">
                          {item.productId?.name || 'Product'}
                        </p>
                        <p className="text-xs text-textile-brown/60">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-textile-brown">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="card-textile p-6">
                <h2 className="text-lg font-semibold text-textile-brown mb-4 flex items-center gap-2">
                  <CreditCardIcon className="w-5 h-5 text-textile-gold" />
                  Summary
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Subtotal</span>
                    <span className="text-textile-brown">${order.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Tax</span>
                    <span className="text-textile-brown">${order.tax?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Shipping</span>
                    <span className="text-textile-brown">${order.shippingCost?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-textile-gold/20">
                    <span className="text-textile-brown">Total</span>
                    <span className="gradient-textile">${order.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>
                {order.paymentMethod && (
                  <p className="text-xs text-textile-brown/40 mt-3 flex items-center gap-1">
                    <CreditCardIcon className="w-3 h-3" />
                    Payment: {order.paymentMethod.replace('_', ' ').toUpperCase()}
                  </p>
                )}
              </div>

              {/* Shipping Address */}
              <div className="card-textile p-6">
                <h2 className="text-lg font-semibold text-textile-brown mb-4 flex items-center gap-2">
                  <MapPinIcon className="w-5 h-5 text-textile-gold" />
                  Shipping Address
                </h2>
                <div className="text-sm text-textile-brown/80 space-y-1">
                  <p className="font-medium text-textile-brown">{order.shippingAddress?.street}</p>
                  <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}</p>
                  <p>{order.shippingAddress?.country}</p>
                  <div className="mt-3 pt-3 border-t-2 border-textile-gold/10 space-y-1">
                    <p className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-textile-brown/40" />
                      {order.shippingAddress?.phone}
                    </p>
                    {order.shippingAddress?.email && (
                      <p className="flex items-center gap-2">
                        <EnvelopeIcon className="w-4 h-4 text-textile-brown/40" />
                        {order.shippingAddress?.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {user?.role === 'buyer' && order.status === 'pending' && (
                  <button
                    onClick={handleCancelOrder}
                    className="w-full btn-textile-terracotta inline-flex items-center justify-center gap-2"
                  >
                    <XCircleIcon className="w-5 h-5" />
                    Cancel Order
                  </button>
                )}
                
                {user?.role === 'buyer' && order.status === 'delivered' && order.items && order.items.length > 0 && (
                  <Link
                    href={`/reviews/new?productId=${order.items[0]?.productId?._id || ''}&orderId=${order._id}`}
                    className="block w-full btn-textile-gold text-center inline-flex items-center justify-center gap-2"
                  >
                    <StarIcon className="w-5 h-5" />
                    Write a Review
                  </Link>
                )}
                
                <Link
                  href="/"
                  className="block w-full btn-textile-secondary text-center inline-flex items-center justify-center gap-2"
                >
                  <ShoppingBagIcon className="w-5 h-5" />
                  Continue Shopping
                </Link>
              </div>
            </motion.div>
          </div>

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
    </>
  );
}