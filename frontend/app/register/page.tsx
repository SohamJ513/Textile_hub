'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon, 
  BuildingOfficeIcon,
  UserCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'buyer',
    businessName: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ field: string; message: string }[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
    setErrors([]);
  };

  // Password strength checker
  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Za-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthText = (password: string) => {
    const strength = getPasswordStrength(password);
    if (strength === 0) return { text: 'Very Weak', color: 'text-gray-400', bar: 'bg-gray-200' };
    if (strength === 1) return { text: 'Weak', color: 'text-red-500', bar: 'bg-red-500' };
    if (strength === 2) return { text: 'Fair', color: 'text-orange-500', bar: 'bg-orange-500' };
    if (strength === 3) return { text: 'Good', color: 'text-blue-500', bar: 'bg-blue-500' };
    return { text: 'Strong', color: 'text-green-500', bar: 'bg-green-500' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    
    if (!formData.email || !formData.password || !formData.name) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!/[A-Za-z]/.test(formData.password)) {
      toast.error('Password must contain at least one letter');
      return;
    }

    if (!/\d/.test(formData.password)) {
      toast.error('Password must contain at least one number');
      return;
    }

    if (!/[^A-Za-z0-9]/.test(formData.password)) {
      toast.error('Password must contain at least one special character (e.g., !@#$%^&*)');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        name: formData.name,
        role: formData.role,
        businessName: formData.businessName,
      });

      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      toast.success('Account created successfully! 🎉');
      
      router.push('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors;
        setErrors(validationErrors);
        validationErrors.forEach((err: any) => {
          toast.error(err.message);
        });
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength(formData.password);
  const strengthInfo = getPasswordStrengthText(formData.password);

  // Validation checks
  const validations = {
    length: formData.password.length >= 6,
    hasLetter: /[A-Za-z]/.test(formData.password),
    hasNumber: /\d/.test(formData.password),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password),
    passwordsMatch: formData.confirmPassword && formData.password === formData.confirmPassword,
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
          <div className="card-textile-warm p-8 shadow-textile max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-6">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-5xl mb-3 inline-block"
              >
                🧵
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold gradient-textile"
              >
                Join TextileHub
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-textile-brown/70"
              >
                Start your textile journey today
              </motion.p>
            </div>

            {/* Error Summary */}
            <AnimatePresence>
              {errors.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-red-50/80 backdrop-blur-sm border-2 border-textile-terracotta/30 rounded-lg p-4 mb-4"
                >
                  <h4 className="text-sm font-medium text-textile-terracotta mb-2">
                    Please fix the following errors:
                  </h4>
                  <ul className="space-y-1">
                    {errors.map((err, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="text-sm text-textile-terracotta/80 flex items-start gap-2"
                      >
                        <span className="mt-0.5">•</span>
                        {err.message}
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Full Name */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label htmlFor="name" className="input-label">
                  <UserIcon className="w-4 h-4 inline mr-2" />
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-field pl-10"
                    placeholder="John Doe"
                  />
                  <UserIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                </div>
              </motion.div>

              {/* Email */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <label htmlFor="email" className="input-label">
                  <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                  Email Address *
                </label>
                <div className="relative">
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-field pl-10"
                    placeholder="you@example.com"
                  />
                  <EnvelopeIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                </div>
              </motion.div>

              {/* Role Selection */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="input-label">
                  <UserCircleIcon className="w-4 h-4 inline mr-2" />
                  I am a *
                </label>
                <div className="flex gap-2 p-1 bg-textile-cream/50 rounded-lg border-2 border-textile-gold/20">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, role: 'buyer' });
                      setErrors([]);
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      formData.role === 'buyer'
                        ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                        : 'text-textile-brown hover:bg-textile-gold/10'
                    }`}
                  >
                    🛍️ Buyer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, role: 'supplier' });
                      setErrors([]);
                    }}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      formData.role === 'supplier'
                        ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                        : 'text-textile-brown hover:bg-textile-gold/10'
                    }`}
                  >
                    🏭 Supplier
                  </button>
                </div>
              </motion.div>

              {/* Business Name */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 }}
              >
                <label htmlFor="businessName" className="input-label">
                  <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
                  Business Name {formData.role === 'supplier' ? '*' : '(Optional)'}
                </label>
                <div className="relative">
                  <input
                    id="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('businessName')}
                    onBlur={() => setFocusedField(null)}
                    required={formData.role === 'supplier'}
                    className="input-field pl-10"
                    placeholder="Your Business Name"
                  />
                  <BuildingOfficeIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                </div>
                {formData.role === 'supplier' && !formData.businessName && (
                  <p className="input-help mt-1">Business name is required for suppliers</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label htmlFor="password" className="input-label">
                  <LockClosedIcon className="w-4 h-4 inline mr-2" />
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className="input-field pl-10 pr-10"
                    placeholder="Min 6 characters with letter, number & special char"
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

                {/* Password Strength Indicator */}
                {formData.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs text-textile-brown/60">Strength:</span>
                        <span className={`text-xs font-medium ${strengthInfo.color}`}>
                          {strengthInfo.text}
                        </span>
                      </div>
                      <span className="text-xs text-textile-brown/40">{formData.password.length}/6+</span>
                    </div>
                    <div className="flex gap-1">
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= 1 ? strengthInfo.bar : 'bg-gray-200'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= 2 ? strengthInfo.bar : 'bg-gray-200'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= 3 ? strengthInfo.bar : 'bg-gray-200'}`} />
                      <div className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${strength >= 4 ? strengthInfo.bar : 'bg-gray-200'}`} />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className={`flex items-center gap-1 transition-colors ${validations.length ? 'text-green-600' : 'text-textile-brown/40'}`}>
                        {validations.length ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                        6+ characters
                      </div>
                      <div className={`flex items-center gap-1 transition-colors ${validations.hasLetter ? 'text-green-600' : 'text-textile-brown/40'}`}>
                        {validations.hasLetter ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                        Letter
                      </div>
                      <div className={`flex items-center gap-1 transition-colors ${validations.hasNumber ? 'text-green-600' : 'text-textile-brown/40'}`}>
                        {validations.hasNumber ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                        Number
                      </div>
                      <div className={`flex items-center gap-1 transition-colors ${validations.hasSpecial ? 'text-green-600' : 'text-textile-brown/40'}`}>
                        {validations.hasSpecial ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />}
                        Special char
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* Confirm Password */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 }}
              >
                <label htmlFor="confirmPassword" className="input-label">
                  <LockClosedIcon className="w-4 h-4 inline mr-2" />
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    onFocus={() => setFocusedField('confirmPassword')}
                    onBlur={() => setFocusedField(null)}
                    required
                    className={`input-field pl-10 pr-10 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? 'border-textile-terracotta focus:ring-textile-terracotta'
                        : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? 'border-green-500 focus:ring-green-500'
                        : ''
                    }`}
                    placeholder="Confirm your password"
                  />
                  <LockClosedIcon className="absolute left-3 top-3 w-5 h-5 text-textile-brown/40" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-textile-brown/40 hover:text-textile-brown transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="w-5 h-5" />
                    ) : (
                      <EyeIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-xs text-textile-terracotta flex items-center gap-1"
                  >
                    <XCircleIcon className="w-3 h-3" /> Passwords do not match
                  </motion.p>
                )}
                {formData.confirmPassword && formData.password === formData.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-1 text-xs text-green-600 flex items-center gap-1"
                  >
                    <CheckCircleIcon className="w-3 h-3" /> Passwords match ✓
                  </motion.p>
                )}
              </motion.div>

              {/* Submit Button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                type="submit"
                disabled={loading}
                className="btn-textile-primary w-full py-3 text-base relative overflow-hidden group mt-2"
              >
                <span className="relative z-10">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account 🧵'
                  )}
                </span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
              </motion.button>

              {/* Login Link */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.55 }}
                className="text-center text-sm text-textile-brown/70"
              >
                Already have an account?{' '}
                <Link 
                  href="/login" 
                  className="font-semibold text-textile-indigo hover:text-textile-royal transition-colors hover:underline"
                >
                  Sign in here
                </Link>
              </motion.p>
            </form>

            {/* Decorative Thread Pattern */}
            <div className="mt-6 pt-6 border-t-2 border-textile-gold/20">
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
                Join the textile community • It's free
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}