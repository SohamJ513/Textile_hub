'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BuildingOfficeIcon, 
  BriefcaseIcon, 
  TagIcon, 
  CubeIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  CheckCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    businessType: '',
    industry: '',
    categories: [] as string[],
    fabricTypes: [] as string[],
    orderQuantity: '',
    budgetRange: '',
    preferredColors: [] as string[],
    annualPurchaseVolume: '',
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      
      if (parsed.onboardingCompleted) {
        router.push(parsed.role === 'buyer' ? '/buyer/dashboard' : '/supplier/dashboard');
      }
    } else {
      router.push('/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  const handleArrayChange = (e: React.ChangeEvent<HTMLSelectElement>, field: string) => {
    const options = e.target.options;
    const selected: string[] = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setFormData({
      ...formData,
      [field]: selected,
    });
  };

  const handleMultiSelect = (value: string, field: string) => {
    setFormData((prev) => {
      const current = prev[field as keyof typeof prev] as string[];
      const updated = current.includes(value) 
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [field]: updated };
    });
  };

  const nextStep = () => {
    if (step === 1 && !formData.businessType) {
      toast.error('Please select your business type');
      return;
    }
    if (step === 1 && !formData.industry) {
      toast.error('Please enter your industry');
      return;
    }
    if (step === 2 && formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    if (step === 2 && formData.fabricTypes.length === 0) {
      toast.error('Please select at least one fabric type');
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderQuantity) {
      toast.error('Please select your order quantity');
      return;
    }
    if (!formData.budgetRange) {
      toast.error('Please select your budget range');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/onboarding', formData);

      const updatedUser = {
        ...user,
        onboardingCompleted: true,
        onboardingData: response.data.user.onboardingData,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('🎉 Onboarding completed successfully!');
      
      const role = user?.role || 'buyer';
      router.push(role === 'buyer' ? '/buyer/dashboard' : '/supplier/dashboard');
    } catch (error: any) {
      console.error('Onboarding error:', error);
      toast.error(error.response?.data?.error || 'Failed to complete onboarding');
    } finally {
      setLoading(false);
    }
  };

  const businessTypes = [
    { value: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
    { value: 'wholesaler', label: 'Wholesaler', icon: '📦' },
    { value: 'retailer', label: 'Retailer', icon: '🛍️' },
    { value: 'distributor', label: 'Distributor', icon: '🚚' },
    { value: 'exporter', label: 'Exporter', icon: '✈️' },
    { value: 'importer', label: 'Importer', icon: '📥' },
    { value: 'other', label: 'Other', icon: '📌' },
  ];

  const categories = [
    'Cotton', 'Silk', 'Linen', 'Wool', 'Denim', 
    'Satin', 'Velvet', 'Jute', 'Polyester', 'Nylon',
    'Rayon', 'Spandex', 'Bamboo', 'Hemp', 'Organic Cotton'
  ];

  const fabricTypes = [
    'Pure Cotton', 'Cotton Blend', 'Silk Charmeuse', 'Silk Satin',
    'Linen', 'Wool', 'Denim', 'Satin', 'Velvet',
    'Jute', 'Polyester', 'Nylon', 'Rayon', 'Spandex'
  ];

  const orderQuantities = [
    { value: 'small (1-100 units)', label: 'Small (1-100 units)', icon: '📐' },
    { value: 'medium (101-1000 units)', label: 'Medium (101-1000 units)', icon: '📏' },
    { value: 'large (1001-10000 units)', label: 'Large (1001-10000 units)', icon: '📊' },
    { value: 'bulk (10000+ units)', label: 'Bulk (10000+ units)', icon: '🏗️' },
  ];

  const budgetRanges = [
    { value: 'under $500', label: 'Under $500' },
    { value: '$500 - $2000', label: '$500 - $2000' },
    { value: '$2000 - $5000', label: '$2000 - $5000' },
    { value: '$5000 - $10000', label: '$5000 - $10000' },
    { value: '$10000+', label: '$10000+' },
  ];

  const annualPurchaseVolumes = [
    { value: 'under $10,000', label: 'Under $10,000' },
    { value: '$10,000 - $50,000', label: '$10,000 - $50,000' },
    { value: '$50,000 - $100,000', label: '$50,000 - $100,000' },
    { value: '$100,000 - $500,000', label: '$100,000 - $500,000' },
    { value: '$500,000+', label: '$500,000+' },
  ];

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-textile-cream">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner"></div>
          <p className="text-textile-brown/60">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const stepIcons = [
    { icon: BuildingOfficeIcon, label: 'Business' },
    { icon: TagIcon, label: 'Products' },
    { icon: CurrencyDollarIcon, label: 'Budget' },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-20 bg-textile-cream bg-textile-pattern bg-pattern flex items-center justify-center px-4 py-8">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-textile-gold/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-textile-indigo/5 rounded-full blur-3xl"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-3xl relative z-10"
        >
          <div className="card-textile-warm p-8 shadow-textile">
            {/* Header */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.5, type: 'spring' }}
                className="text-6xl mb-4 inline-block"
              >
                🧵
              </motion.div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl font-bold gradient-textile"
              >
                Welcome to TextileHub! 👋
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-2 text-textile-brown/70"
              >
                Tell us about your business to personalize your experience
              </motion.p>
            </div>

            {/* Progress Steps */}
            <div className="mb-8">
              <div className="flex justify-between items-center relative">
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-textile-gold/20 -translate-y-1/2"></div>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="relative z-10 flex flex-col items-center">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        i <= step
                          ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-lg shadow-textile-indigo/30'
                          : 'bg-textile-cream border-2 border-textile-gold/30 text-textile-brown/40'
                      }`}
                    >
                      {i < step ? (
                        <CheckCircleIcon className="w-5 h-5" />
                      ) : (
                        i
                      )}
                    </motion.div>
                    <span className={`text-xs mt-2 font-medium ${
                      i <= step ? 'text-textile-indigo' : 'text-textile-brown/40'
                    }`}>
                      {stepIcons[i - 1].label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Step 1: Business Type & Industry */}
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div>
                      <label htmlFor="businessType" className="input-label">
                        <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
                        Business Type *
                      </label>
                      <select
                        id="businessType"
                        value={formData.businessType}
                        onChange={handleChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select your business type</option>
                        {businessTypes.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.icon} {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="industry" className="input-label">
                        <BriefcaseIcon className="w-4 h-4 inline mr-2" />
                        Industry *
                      </label>
                      <input
                        id="industry"
                        type="text"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g., Textile Manufacturing, Fashion Retail"
                        className="input-field"
                        required
                      />
                      <p className="input-help">Tell us about your primary industry focus</p>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Categories & Fabrics */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="input-label">
                        <TagIcon className="w-4 h-4 inline mr-2" />
                        Product Categories * (Select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 bg-textile-cream/50 rounded-lg border-2 border-textile-gold/20 min-h-[100px]">
                        {categories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => handleMultiSelect(cat, 'categories')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.categories.includes(cat)
                                ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                                : 'bg-white/50 text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                            }`}
                          >
                            {formData.categories.includes(cat) && '✓ '}
                            {cat}
                          </button>
                        ))}
                      </div>
                      <p className="input-help">Click to select/deselect categories</p>
                    </div>

                    <div>
                      <label className="input-label">
                        <CubeIcon className="w-4 h-4 inline mr-2" />
                        Fabric Types * (Select all that apply)
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 bg-textile-cream/50 rounded-lg border-2 border-textile-gold/20 min-h-[100px]">
                        {fabricTypes.map((fabric) => (
                          <button
                            key={fabric}
                            type="button"
                            onClick={() => handleMultiSelect(fabric, 'fabricTypes')}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                              formData.fabricTypes.includes(fabric)
                                ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                                : 'bg-white/50 text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                            }`}
                          >
                            {formData.fabricTypes.includes(fabric) && '✓ '}
                            {fabric}
                          </button>
                        ))}
                      </div>
                      <p className="input-help">Click to select/deselect fabric types</p>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Volume & Budget */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div>
                      <label htmlFor="orderQuantity" className="input-label">
                        <ChartBarIcon className="w-4 h-4 inline mr-2" />
                        Typical Order Quantity *
                      </label>
                      <select
                        id="orderQuantity"
                        value={formData.orderQuantity}
                        onChange={handleChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select your typical order quantity</option>
                        {orderQuantities.map((qty) => (
                          <option key={qty.value} value={qty.value}>
                            {qty.icon} {qty.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="budgetRange" className="input-label">
                        <CurrencyDollarIcon className="w-4 h-4 inline mr-2" />
                        Budget Range *
                      </label>
                      <select
                        id="budgetRange"
                        value={formData.budgetRange}
                        onChange={handleChange}
                        className="input-field"
                        required
                      >
                        <option value="">Select your budget range</option>
                        {budgetRanges.map((budget) => (
                          <option key={budget.value} value={budget.value}>
                            {budget.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="annualPurchaseVolume" className="input-label">
                        <ChartBarIcon className="w-4 h-4 inline mr-2" />
                        Annual Purchase Volume (Optional)
                      </label>
                      <select
                        id="annualPurchaseVolume"
                        value={formData.annualPurchaseVolume}
                        onChange={handleChange}
                        className="input-field"
                      >
                        <option value="">Select your annual purchase volume</option>
                        {annualPurchaseVolumes.map((vol) => (
                          <option key={vol.value} value={vol.value}>
                            {vol.label}
                          </option>
                        ))}
                      </select>
                      <p className="input-help">This helps us suggest suitable suppliers</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex gap-3 pt-4 border-t-2 border-textile-gold/20">
                {step > 1 && (
                  <motion.button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 px-6 py-2.5 btn-textile-secondary flex items-center justify-center gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    Back
                  </motion.button>
                )}
                
                {step < 3 ? (
                  <motion.button
                    type="button"
                    onClick={nextStep}
                    className={`${step > 1 ? 'flex-1' : 'w-full'} px-6 py-2.5 btn-textile-primary flex items-center justify-center gap-2`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    Next
                    <ChevronRightIcon className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 btn-textile-primary text-base relative overflow-hidden group"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="relative z-10">
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Completing Onboarding...
                        </span>
                      ) : (
                        'Complete Onboarding 🚀'
                      )}
                    </span>
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                  </motion.button>
                )}
              </div>

              <p className="text-xs text-textile-brown/40 text-center">
                * Required fields. This helps us personalize your experience.
              </p>
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
                Step {step} of 3 • Tell us about your business
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}