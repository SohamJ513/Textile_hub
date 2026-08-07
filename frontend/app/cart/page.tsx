'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCartIcon,
  TrashIcon,
  PlusIcon,
  MinusIcon,
  ArrowLeftIcon,
  CreditCardIcon,
  XMarkIcon,
  ShoppingBagIcon,
  CheckCircleIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function CartPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    loadCart();
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
    setCart(cartData);
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setUpdating(productId);
    const updatedCart = cart.map((item) => {
      if (item.productId === productId) {
        if (newQuantity > item.stock) {
          toast.error(`Only ${item.stock} units available`);
          setUpdating(null);
          return item;
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    });
    
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    setUpdating(null);
  };

  const removeItem = (productId: string) => {
    if (!confirm('Remove this item from cart?')) return;
    
    const updatedCart = cart.filter((item) => item.productId !== productId);
    setCart(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Item removed from cart');
  };

  const clearCart = () => {
    if (!confirm('Clear your entire cart?')) return;
    setCart([]);
    localStorage.setItem('cart', '[]');
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success('Cart cleared');
  };

  const getTotal = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return cart.reduce((count, item) => count + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (!user) {
      toast.error('Please login to checkout');
      router.push('/login');
      return;
    }
    
    if (user.role !== 'buyer') {
      toast.error('Only buyers can checkout');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      return;
    }
    
    router.push('/checkout');
  };

  // Helper to get seller name
  const getSellerName = (item: any) => {
    if (item.supplierName) {
      return item.supplierName;
    }
    // Fallback: try to get from product data if available
    return 'Unknown Seller';
  };

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-textile-warm p-12 text-center max-w-md"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="text-7xl mb-6"
            >
              🛒
            </motion.div>
            <h2 className="text-2xl font-bold text-textile-brown mb-2">Your cart is empty</h2>
            <p className="text-textile-brown/60 mb-6">Browse our marketplace and find something you love!</p>
            <Link
              href="/marketplace"
              className="btn-textile-primary inline-block"
            >
              <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
              Start Shopping
            </Link>
          </motion.div>
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
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-bold gradient-textile flex items-center gap-3">
                <ShoppingCartIcon className="w-8 h-8 text-textile-gold" />
                Shopping Cart
              </h1>
              <p className="text-textile-brown/70 mt-1">
                {getItemCount()} item{getItemCount() !== 1 ? 's' : ''} in your cart
              </p>
            </div>
            <button
              onClick={clearCart}
              className="btn-textile-terracotta text-sm inline-flex items-center gap-2"
            >
              <TrashIcon className="w-4 h-4" />
              Clear Cart
            </button>
          </motion.div>

          {/* Cart Items */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="card-textile overflow-hidden"
          >
            <div className="divide-y-2 divide-textile-gold/10">
              {cart.map((item, index) => (
                <motion.div
                  key={item.productId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-6 flex flex-col md:flex-row items-center gap-6 hover:bg-textile-warm/30 transition-colors"
                >
                  {/* Product Image */}
                  <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-xl border-2 border-textile-gold/10">
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=100&h=100&fit=crop'}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1 w-full">
                    <h3 className="font-semibold text-textile-brown">{item.name}</h3>
                    <p className="text-sm text-textile-brown/60">${item.price.toFixed(2)} each</p>
                    
                    {/* ✅ Seller Name */}
                    <div className="mt-1 flex items-center gap-1.5">
                      <UserCircleIcon className="w-3.5 h-3.5 text-textile-brown/40" />
                      <span className="text-xs text-textile-brown/40">by</span>
                      <span className="text-xs font-medium text-textile-indigo truncate">
                        {getSellerName(item)}
                      </span>
                    </div>
                    
                    <p className="text-xs text-textile-brown/40 mt-0.5">Stock: {item.stock} units</p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={updating === item.productId}
                      className="w-8 h-8 rounded-full bg-textile-warm/50 border-2 border-textile-gold/20 hover:bg-textile-gold/10 hover:border-textile-gold/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <MinusIcon className="w-4 h-4 text-textile-brown" />
                    </button>
                    <span className="w-8 text-center font-medium text-textile-brown">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      disabled={updating === item.productId || item.quantity >= item.stock}
                      className="w-8 h-8 rounded-full bg-textile-warm/50 border-2 border-textile-gold/20 hover:bg-textile-gold/10 hover:border-textile-gold/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <PlusIcon className="w-4 h-4 text-textile-brown" />
                    </button>
                  </div>

                  {/* Price & Remove */}
                  <div className="text-right min-w-[100px] w-full md:w-auto">
                    <p className="text-xl font-bold gradient-textile">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-textile-terracotta hover:text-textile-terracotta/80 text-sm font-medium transition-colors inline-flex items-center gap-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Cart Summary */}
            <div className="bg-textile-warm/50 p-6 border-t-2 border-textile-gold/20">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                  <p className="text-textile-brown/60">
                    Total Items: <span className="font-semibold text-textile-brown">{getItemCount()}</span>
                  </p>
                  <p className="text-3xl font-bold gradient-textile">
                    Total: ${getTotal().toFixed(2)}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link
                    href="/marketplace"
                    className="btn-textile-secondary text-center inline-flex items-center justify-center gap-2"
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                    Continue Shopping
                  </Link>
                  <button
                    onClick={handleCheckout}
                    className="btn-textile-primary text-center inline-flex items-center justify-center gap-2 px-8"
                  >
                    <CreditCardIcon className="w-4 h-4" />
                    Proceed to Checkout →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Continue Shopping Link */}
          <div className="mt-6 text-center">
            <Link href="/marketplace" className="text-textile-indigo hover:text-textile-royal transition-colors font-medium">
              ← Continue Shopping
            </Link>
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