'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bars3Icon, 
  XMarkIcon, 
  ShoppingCartIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  Squares2X2Icon,
  ShoppingBagIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    updateCartCount();
    
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((total: number, item: any) => total + item.quantity, 0);
    setCartCount(count);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  // Navigation links with icons
  const navLinks = [
    { name: 'Marketplace', href: '/marketplace', icon: HomeIcon },
    ...(user?.role === 'buyer' ? [
      { name: 'Dashboard', href: '/buyer/dashboard', icon: Squares2X2Icon },
      { name: 'My Orders', href: '/buyer/orders', icon: ClipboardDocumentListIcon },
      { name: 'My Reviews', href: '/buyer/reviews', icon: StarIcon }
    ] : []),
    ...(user?.role === 'supplier' ? [
      { name: 'Dashboard', href: '/supplier/dashboard', icon: Squares2X2Icon },
      { name: 'Orders', href: '/supplier/orders', icon: ClipboardDocumentListIcon },
      { name: 'Products', href: '/supplier/products', icon: ShoppingBagIcon }
    ] : []),
  ];

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
        className={`fixed w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'glass-textile shadow-textile' 
            : 'bg-textile-cream/80 backdrop-blur-sm border-b-2 border-textile-gold/20'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo - Links to Home */}
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
              <motion.span
                whileHover={{ rotate: 15, scale: 1.1 }}
                transition={{ duration: 0.2 }}
                className="text-3xl"
              >
                🧵
              </motion.span>
              <span className="text-xl font-bold gradient-textile">
                TextileHub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-textile-brown hover:text-textile-indigo hover:bg-textile-gold/10 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Desktop Right Side */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Cart - Only for Buyers */}
              {user?.role === 'buyer' && (
                <Link
                  href="/cart"
                  className="relative p-2 text-textile-brown hover:text-textile-indigo hover:bg-textile-gold/10 rounded-full transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                >
                  <ShoppingCartIcon className="w-5 h-5" />
                  {cartCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-textile-gold to-textile-amber text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg"
                    >
                      {cartCount > 9 ? '9+' : cartCount}
                    </motion.span>
                  )}
                </Link>
              )}

              {/* User Section */}
              {user ? (
                <div className="flex items-center gap-3 pl-3 border-l-2 border-textile-gold/30">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-textile-gold to-textile-amber flex items-center justify-center text-white text-sm font-semibold shadow-md">
                      {user.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <span className="text-sm text-textile-brown hidden lg:block">
                      <span className="font-medium">{user.name?.split(' ')[0]}</span>
                    </span>
                  </div>
                  {/* ✅ Updated Logout Button - Shows Modal */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowLogoutModal(true)}
                    className="text-sm px-4 py-1.5 bg-gradient-to-r from-textile-terracotta to-textile-coral text-white rounded-lg hover:shadow-md transition-all duration-200 inline-flex items-center gap-1.5"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                    Logout
                  </motion.button>
                </div>
              ) : (
                <div className="flex items-center gap-2 pl-3 border-l-2 border-textile-gold/30">
                  <Link
                    href="/login"
                    className="px-4 py-1.5 text-sm font-medium text-textile-indigo hover:bg-textile-gold/10 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-textile-indigo to-textile-royal rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-textile-gold/10 transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XMarkIcon className="w-6 h-6 text-textile-brown" />
              ) : (
                <Bars3Icon className="w-6 h-6 text-textile-brown" />
              )}
            </button>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="md:hidden py-4 border-t-2 border-textile-gold/20"
              >
                <div className="flex flex-col space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-textile-brown hover:text-textile-indigo hover:bg-textile-gold/10 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <link.icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  ))}
                  
                  {/* Cart in Mobile */}
                  {user?.role === 'buyer' && (
                    <Link
                      href="/cart"
                      className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-textile-brown hover:text-textile-indigo hover:bg-textile-gold/10 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ShoppingCartIcon className="w-4 h-4" />
                      Cart
                      {cartCount > 0 && (
                        <span className="bg-gradient-to-r from-textile-gold to-textile-amber text-white text-xs rounded-full px-2 py-0.5">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  )}
                  
                  {/* Auth in Mobile - Updated with Modal */}
                  {user ? (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="px-3 py-2 text-sm font-medium text-textile-terracotta hover:bg-textile-terracotta/10 rounded-lg text-left transition-all duration-200 border-2 border-transparent hover:border-textile-terracotta/30 inline-flex items-center gap-2"
                    >
                      <ArrowRightOnRectangleIcon className="w-4 h-4" />
                      Logout
                    </button>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        className="px-3 py-2 text-sm font-medium text-textile-indigo hover:bg-textile-gold/10 rounded-lg transition-all duration-200 border-2 border-transparent hover:border-textile-gold/30"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/register"
                        className="px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-textile-indigo to-textile-royal rounded-lg text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* ✅ Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4"
            onClick={() => setShowLogoutModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ duration: 0.2 }}
              className="card-textile-warm p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.4, type: 'spring' }}
                  className="text-6xl mb-4"
                >
                  🚪
                </motion.div>
                
                <h3 className="text-2xl font-bold text-textile-brown mb-2">
                  Logout Confirmation
                </h3>
                <p className="text-textile-brown/70 mb-6">
                  Are you sure you want to logout? You'll need to sign in again to access your account.
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutModal(false)}
                    className="flex-1 btn-textile-secondary py-2.5"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 btn-textile-terracotta py-2.5 inline-flex items-center justify-center gap-2"
                  >
                    <ArrowRightOnRectangleIcon className="w-5 h-5" />
                    Logout
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}