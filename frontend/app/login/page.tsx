'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserCircleIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('buyer');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        email,
        password,
        role
      });

      const { token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      }
      
      toast.success('Welcome back! 🧵');
      
      // Redirect based on role and onboarding status
      if (!user.onboardingCompleted) {
        router.push('/onboarding');
      } else if (user.role === 'buyer') {
        router.push('/buyer/dashboard');
      } else {
        router.push('/supplier/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password Handler - Demo Mode
  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.success('📧 Password reset is not available in demo mode. Please contact support@textilehub.com for assistance.', {
      duration: 5000,
      icon: '🔐',
    });
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 bg-textile-cream bg-textile-pattern bg-pattern flex items-center justify-center px-4">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-textile-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-textile-indigo/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-textile-coral/5 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="card-textile-warm p-8 shadow-textile">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-5xl mb-4 inline-block"
              >
                🧵
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold gradient-textile"
              >
                Welcome Back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-textile-brown/70"
              >
                Sign in to continue your textile journey
              </motion.p>
            </div>

            {/* Role Selector */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex gap-2 p-1 bg-textile-cream/50 rounded-lg border-2 border-textile-gold/20 mb-6"
            >
              <button
                type="button"
                onClick={() => setRole('buyer')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  role === 'buyer'
                    ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                    : 'text-textile-brown hover:bg-textile-gold/10'
                }`}
              >
                🛍️ Buyer
              </button>
              <button
                type="button"
                onClick={() => setRole('supplier')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  role === 'supplier'
                    ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                    : 'text-textile-brown hover:bg-textile-gold/10'
                }`}
              >
                🏭 Supplier
              </button>
            </motion.div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label htmlFor="email" className="input-label">
                  <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                  <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                </div>
              </motion.div>

              {/* Password Field */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="password" className="input-label">
                  <LockClosedIcon className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="••••••••"
                  />
                  <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-textile-brown/40 hover:text-textile-brown transition-colors"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* Remember Me & Forgot Password */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-textile-gold border-textile-gold/30 rounded focus:ring-textile-gold"
                  />
                  <label htmlFor="rememberMe" className="text-sm text-textile-brown/70">
                    Remember me
                  </label>
                </div>
                {/* ✅ Updated Forgot Password Link */}
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-textile-indigo hover:text-textile-royal transition-colors hover:underline cursor-pointer"
                >
                  Forgot password?
                </button>
              </motion.div>

              {/* Role Display (Read-only) */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-2 px-4 py-2 bg-textile-cream/50 rounded-lg border-2 border-textile-gold/20"
              >
                <UserCircleIcon className="w-5 h-5 text-textile-brown/60" />
                <span className="text-sm text-textile-brown/70">
                  Logging in as: <span className="font-semibold text-textile-brown capitalize">{role}</span>
                </span>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                type="submit"
                disabled={loading}
                className="btn-textile-primary w-full py-3 text-base relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </span>
                {/* Shimmer Effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </motion.button>

              {/* Register Link */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-center text-sm text-textile-brown/70"
              >
                Don't have an account?{' '}
                <Link 
                  href="/register" 
                  className="font-semibold text-textile-indigo hover:text-textile-royal transition-colors hover:underline"
                >
                  Create one now
                </Link>
              </motion.p>
            </form>

            {/* Trust Badges */}
            <div className="mt-6 pt-6 border-t-2 border-textile-gold/20">
              <div className="flex justify-center items-center gap-4 text-xs text-textile-brown/40">
                <span className="flex items-center gap-1">
                  <ShieldCheckIcon className="w-4 h-4 text-textile-gold" />
                  Secure Login
                </span>
                <span className="w-px h-4 bg-textile-gold/20"></span>
                <span className="flex items-center gap-1">
                  🔒 Encrypted
                </span>
                <span className="w-px h-4 bg-textile-gold/20"></span>
                <span className="flex items-center gap-1">
                  ✅ Verified
                </span>
              </div>
            </div>

            {/* Decorative Thread Pattern at Bottom */}
            <div className="mt-4 pt-4 border-t-2 border-textile-gold/20">
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
                Secure • Trusted • Textile Marketplace
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}