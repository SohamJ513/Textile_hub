'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeftIcon,
  ShoppingCartIcon,
  HeartIcon,
  ShareIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  TruckIcon,
  ShieldCheckIcon,
  ArrowPathIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  HomeIcon,
  UserCircleIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function ProductDetails() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    if (productId) {
      fetchProduct(productId);
      fetchReviews(productId);
    }
  }, [productId]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.product);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error(error.response?.data?.error || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (id: string) => {
    try {
      const response = await api.get(`/reviews/product/${id}`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }
    
    if (user.role !== 'buyer') {
      toast.error('Only buyers can add items to cart');
      return;
    }

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.productId === productId);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({
        productId: productId,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || '',
        quantity: quantity,
        stock: product.stock,
        supplierName: typeof product.supplierId === 'object' 
          ? (product.supplierId.businessName || product.supplierId.name || 'Unknown Seller')
          : 'Unknown Seller'
      });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));
    toast.success(`Added ${quantity} item(s) to cart! 🛒`);
  };

  const getAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const sum = reviews.reduce((acc: number, r: any) => acc + r.rating, 0);
    return sum / reviews.length;
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`text-lg ${star <= Math.round(rating) ? 'text-textile-gold' : 'text-textile-gold/20'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  // Get seller details
  const getSellerName = () => {
    if (typeof product.supplierId === 'object') {
      return product.supplierId.businessName || product.supplierId.name || 'Unknown Seller';
    }
    return 'Unknown Seller';
  };

  const getSellerType = () => {
    if (typeof product.supplierId === 'object') {
      return product.supplierId.businessType || '';
    }
    return '';
  };

  const getSellerInitial = () => {
    const name = getSellerName();
    return name.charAt(0).toUpperCase();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-spinner"></div>
            <p className="text-textile-brown/60">Loading product details...</p>
          </div>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16 bg-textile-cream">
          <div className="card-textile-warm p-12 text-center max-w-md">
            <p className="text-6xl mb-4">🔍</p>
            <h1 className="text-2xl font-bold text-textile-brown">Product Not Found</h1>
            <p className="text-textile-brown/60 mt-2">The product you're looking for doesn't exist.</p>
            <Link href="/" className="inline-block mt-6 btn-textile-primary">
              <HomeIcon className="w-4 h-4 inline mr-2" />
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
        <div className="container-custom py-8">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 text-sm text-textile-brown/60 mb-6"
          >
            <Link href="/" className="hover:text-textile-indigo transition-colors">Home</Link>
            <span>›</span>
            <Link href="/marketplace" className="hover:text-textile-indigo transition-colors">Marketplace</Link>
            <span>›</span>
            <span className="text-textile-brown font-medium truncate max-w-[200px]">{product.name}</span>
          </motion.div>

          {/* Product Details */}
          <div className="card-textile overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
              {/* Product Images */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="bg-textile-warm/50 rounded-2xl overflow-hidden border-2 border-textile-gold/10">
                  <img
                    src={product.images?.[selectedImage] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=600&h=600&fit=crop'}
                    alt={product.name}
                    className="w-full h-96 object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                {product.images && product.images.length > 1 && (
                  <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                    {product.images.map((img: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === index
                            ? 'border-textile-gold shadow-md'
                            : 'border-textile-gold/20 hover:border-textile-gold/50'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`${product.name} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>

              {/* Product Info */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2">
                  {product.featured && (
                    <span className="badge-textile-gold">
                      ⭐ Featured
                    </span>
                  )}
                  {product.isActive === false && (
                    <span className="badge-textile-gold bg-textile-terracotta/10 border-textile-terracotta text-textile-terracotta">
                      Inactive
                    </span>
                  )}
                  {product.stock > 0 ? (
                    <span className="badge-success">
                      <CheckCircleIcon className="w-3 h-3 inline mr-1" />
                      In Stock
                    </span>
                  ) : (
                    <span className="badge-danger">
                      <XCircleIcon className="w-3 h-3 inline mr-1" />
                      Out of Stock
                    </span>
                  )}
                </div>

                {/* Name & Category */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-textile-brown">{product.name}</h1>
                  <p className="text-textile-brown/60 mt-1">
                    Category: <span className="font-medium text-textile-brown">{product.category}</span>
                    {product.fabricType && ` • Fabric: ${product.fabricType}`}
                  </p>
                </div>

                {/* Rating */}
                {reviews.length > 0 && (
                  <div className="flex items-center gap-3">
                    {renderStars(getAverageRating())}
                    <span className="text-sm font-medium text-textile-brown">
                      {getAverageRating().toFixed(1)}
                    </span>
                    <span className="text-sm text-textile-brown/60">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-end gap-4">
                  <p className="text-4xl font-bold gradient-textile">
                    ${product.price?.toFixed(2)}
                  </p>
                  <p className="text-sm text-textile-brown/60 mb-1">
                    Stock: {product.stock || 0} units available
                  </p>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-textile-brown/60 mb-1">Description</h3>
                  <p className="text-textile-brown/80 leading-relaxed">{product.description}</p>
                </div>

                {/* Colors */}
                {product.colors && product.colors.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-textile-brown/60 mb-2">Available Colors</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color: string) => (
                        <span
                          key={color}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-textile-warm/50 rounded-full text-sm border-2 border-textile-gold/10"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-textile-gold/20"
                            style={{ backgroundColor: color.toLowerCase() }}
                          />
                          {color}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-textile-brown/60 mb-2">Specifications</h3>
                    <div className="bg-textile-warm/30 rounded-xl p-4 space-y-1 border-2 border-textile-gold/10">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm border-b border-textile-gold/10 pb-1 last:border-0 last:pb-0">
                          <span className="text-textile-brown/60">{key}</span>
                          <span className="text-textile-brown font-medium">{value as string}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Supplier Info - Enhanced with View Supplier link */}
                {product.supplierId && (
                  <div className="flex items-center gap-3 p-4 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10 hover:border-textile-gold/30 transition-all duration-200">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-textile-indigo to-textile-royal flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                      {getSellerInitial()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-textile-brown/60 flex items-center gap-1">
                        <BuildingOfficeIcon className="w-3.5 h-3.5" />
                        Supplier
                      </p>
                      <p className="font-semibold text-textile-brown text-lg truncate">
                        {getSellerName()}
                      </p>
                      {getSellerType() && (
                        <p className="text-xs text-textile-brown/40 capitalize">
                          {getSellerType()}
                        </p>
                      )}
                    </div>
                    <Link
                      href={`/supplier/${product.supplierId._id || product.supplierId}`}
                      className="btn-textile-secondary text-sm whitespace-nowrap inline-flex items-center gap-1"
                    >
                      <UserCircleIcon className="w-4 h-4" />
                      View Supplier
                    </Link>
                  </div>
                )}

                {/* Trust Badges */}
                <div className="flex flex-wrap gap-4 p-4 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-5 h-5 text-textile-gold" />
                    <span className="text-sm text-textile-brown">Verified Seller</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TruckIcon className="w-5 h-5 text-textile-gold" />
                    <span className="text-sm text-textile-brown">Fast Shipping</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowPathIcon className="w-5 h-5 text-textile-gold" />
                    <span className="text-sm text-textile-brown">Secure Payments</span>
                  </div>
                </div>

                {/* Add to Cart - Only for Buyers */}
                {user?.role === 'buyer' && product.isActive !== false && product.stock > 0 && (
                  <div className="border-t-2 border-textile-gold/20 pt-6">
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div>
                        <label htmlFor="quantity" className="block text-sm font-medium text-textile-brown/60 mb-1">
                          Quantity
                        </label>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="p-2 bg-textile-warm/50 rounded-lg hover:bg-textile-gold/10 transition-colors border-2 border-textile-gold/20"
                          >
                            <MinusIcon className="w-4 h-4 text-textile-brown" />
                          </button>
                          <input
                            id="quantity"
                            type="number"
                            min="1"
                            max={product.stock || 0}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.min(Math.max(1, parseInt(e.target.value) || 1), product.stock || 1))}
                            className="w-16 text-center px-2 py-2 border-2 border-textile-gold/20 rounded-lg bg-white/50 focus:outline-none focus:ring-2 focus:ring-textile-gold text-textile-brown"
                          />
                          <button
                            onClick={() => setQuantity(Math.min(product.stock || 1, quantity + 1))}
                            className="p-2 bg-textile-warm/50 rounded-lg hover:bg-textile-gold/10 transition-colors border-2 border-textile-gold/20"
                          >
                            <PlusIcon className="w-4 h-4 text-textile-brown" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0 || product.isActive === false}
                        className="flex-1 py-3 px-6 btn-textile-primary text-base disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                      >
                        <ShoppingCartIcon className="w-5 h-5" />
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Supplier View */}
                {user?.role === 'supplier' && (
                  <div className="border-t-2 border-textile-gold/20 pt-6">
                    <div className="glass-textile p-4 text-center rounded-xl">
                      <p className="text-textile-brown font-medium">
                        👋 You are viewing this product as a supplier
                      </p>
                      <p className="text-sm text-textile-brown/60 mt-1">
                        Buyers will see an "Add to Cart" button here
                      </p>
                      <Link
                        href={`/supplier/products/edit/${productId}`}
                        className="mt-3 inline-block btn-textile-primary text-sm"
                      >
                        <PencilIcon className="w-4 h-4 inline mr-2" />
                        Edit Product
                      </Link>
                    </div>
                  </div>
                )}

                {/* Not logged in */}
                {!user && (
                  <div className="border-t-2 border-textile-gold/20 pt-6">
                    <div className="glass-textile p-4 text-center rounded-xl">
                      <p className="text-textile-brown">
                        Please <Link href="/login" className="text-textile-indigo hover:text-textile-royal font-medium hover:underline">login</Link> to add items to cart
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>

          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex flex-wrap justify-between items-center gap-4"
          >
            <button
              onClick={() => router.back()}
              className="btn-textile-secondary text-sm inline-flex items-center gap-2"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Go Back
            </button>
            {user?.role === 'supplier' && (
              <Link
                href={`/supplier/products/edit/${productId}`}
                className="btn-textile-primary text-sm inline-flex items-center gap-2"
              >
                <PencilIcon className="w-4 h-4" />
                Edit Product
              </Link>
            )}
          </motion.div>

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