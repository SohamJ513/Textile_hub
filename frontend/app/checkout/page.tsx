'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  HomeIcon,
  UserIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  CreditCardIcon,
  BanknotesIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function CheckoutPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    email: '',
    notes: '',
    paymentMethod: 'cash',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      if (parsed.role !== 'buyer') {
        router.push('/');
        return;
      }

      const cartData = JSON.parse(localStorage.getItem('cart') || '[]');
      if (cartData.length === 0) {
        toast.error('Your cart is empty');
        router.push('/');
        return;
      }
      setCart(cartData);

      if (parsed?.email) {
        setFormData(prev => ({ ...prev, email: parsed.email }));
      }
    } else {
      router.push('/login');
      return;
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const getTotal = () => {
    const subtotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);
    const tax = subtotal * 0.1;
    const shipping = subtotal > 100 ? 0 : 10;
    return {
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = ['street', 'city', 'state', 'zipCode', 'country'];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast.error(`Please enter your ${field}`);
        return;
      }
    }

    if (!formData.phone) {
      toast.error('Please enter your phone number');
      return;
    }

    try {
      setLoading(true);
      
      const orderData = {
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
          email: formData.email || user?.email,
        },
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
      };

      const response = await api.post('/orders', orderData);
      
      localStorage.setItem('cart', '[]');
      window.dispatchEvent(new Event('cartUpdated'));
      
      toast.success('Order placed successfully! 🎉');
      router.push(`/orders/${response.data.order._id}`);
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  const totals = getTotal();

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern flex items-center justify-center">
          <div className="text-center py-12">
            <p className="text-6xl mb-4">🛒</p>
            <h2 className="text-2xl font-bold text-textile-brown mb-2">Your cart is empty</h2>
            <p className="text-textile-brown/60 mb-6">Add some items before checking out</p>
            <Link href="/" className="btn-textile-primary inline-block">
              Start Shopping
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
            className="mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                  Checkout
                </h1>
                <p className="text-textile-brown/70 mt-1">Complete your order</p>
              </div>
              <Link
                href="/cart"
                className="btn-textile-secondary text-sm inline-flex items-center gap-2"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Back to Cart
              </Link>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Order Form */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2"
            >
              <div className="card-textile p-6">
                <h2 className="text-xl font-semibold text-textile-brown mb-6 flex items-center gap-2">
                  <MapPinIcon className="w-6 h-6 text-textile-gold" />
                  Shipping Address
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="street" className="input-label">Street Address *</label>
                    <input
                      id="street"
                      type="text"
                      value={formData.street}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="123 Main St"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="input-label">City *</label>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Mumbai"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="input-label">State *</label>
                      <input
                        id="state"
                        type="text"
                        value={formData.state}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Maharashtra"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="zipCode" className="input-label">Zip Code *</label>
                      <input
                        id="zipCode"
                        type="text"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="400001"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="country" className="input-label">Country *</label>
                      <input
                        id="country"
                        type="text"
                        value={formData.country}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="India"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="input-label">
                        <PhoneIcon className="w-4 h-4 inline mr-2" />
                        Phone Number *
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="+919999999999"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="input-label">
                        <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                        Email (for order updates)
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label htmlFor="paymentMethod" className="input-label">
                      <CreditCardIcon className="w-4 h-4 inline mr-2" />
                      Payment Method *
                    </label>
                    <select
                      id="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleChange}
                      className="input-field"
                      required
                    >
                      <option value="cash">💵 Cash on Delivery</option>
                      <option value="bank_transfer">🏦 Bank Transfer</option>
                      <option value="credit_card">💳 Credit Card</option>
                      <option value="debit_card">💳 Debit Card</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="notes" className="input-label">Order Notes (Optional)</label>
                    <textarea
                      id="notes"
                      rows={3}
                      value={formData.notes}
                      onChange={handleChange}
                      className="input-field"
                      placeholder="Any special instructions for the supplier..."
                    />
                    <p className="input-help">Add delivery instructions or special requests</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-textile-primary py-3 text-base lg:hidden disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Placing Order...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="w-5 h-5" />
                        Place Order • ${totals.total.toFixed(2)}
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1"
            >
              <div className="card-textile p-6 sticky top-24">
                <h2 className="text-xl font-semibold text-textile-brown mb-6 flex items-center gap-2">
                  <TruckIcon className="w-6 h-6 text-textile-gold" />
                  Order Summary
                </h2>
                
                <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 py-2 border-b-2 border-textile-gold/10">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=50&h=50&fit=crop'}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-lg border-2 border-textile-gold/10"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-textile-brown truncate">{item.name}</p>
                        <p className="text-xs text-textile-brown/60">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-textile-brown">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t-2 border-textile-gold/20">
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Subtotal</span>
                    <span className="text-textile-brown">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Tax (10%)</span>
                    <span className="text-textile-brown">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-textile-brown/60">Shipping</span>
                    <span className="text-textile-brown font-medium">
                      {totals.shipping === 0 ? 'FREE' : `$${totals.shipping.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-3 border-t-2 border-textile-gold/20">
                    <span className="text-textile-brown">Total</span>
                    <span className="gradient-textile">${totals.total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="hidden lg:block w-full mt-6 btn-textile-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Placing Order...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Place Order • ${totals.total.toFixed(2)}
                    </>
                  )}
                </button>

                {/* Trust Badges */}
                <div className="mt-4 p-3 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10">
                  <div className="flex items-center justify-center gap-4 text-xs text-textile-brown/60">
                    <span className="flex items-center gap-1">
                      <ShieldCheckIcon className="w-4 h-4 text-textile-gold" />
                      Secure
                    </span>
                    <span className="flex items-center gap-1">
                      <TruckIcon className="w-4 h-4 text-textile-gold" />
                      Fast Delivery
                    </span>
                    <span className="flex items-center gap-1">
                      <BanknotesIcon className="w-4 h-4 text-textile-gold" />
                      Best Price
                    </span>
                  </div>
                </div>

                <p className="text-xs text-textile-brown/40 text-center mt-3">
                  By placing your order, you agree to our terms and conditions
                </p>
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