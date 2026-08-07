'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  ChevronLeftIcon,
  StarIcon,
  PhotoIcon,
  XMarkIcon,
  PlusIcon,
  CheckCircleIcon,
  SparklesIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';

export default function WriteReview() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const orderId = searchParams.get('orderId');
  
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      if (parsed.role !== 'buyer') {
        router.push('/');
        return;
      }
    } else {
      router.push('/login');
      return;
    }

    if (!productId) {
      toast.error('Product ID is required');
      router.push('/');
      return;
    }

    fetchProduct(productId);
  }, [router, productId]);

  const fetchProduct = async (id: string) => {
    try {
      setLoading(true);
      const response = await api.get(`/products/${id}`);
      setProduct(response.data.product);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleAddImage = () => {
    if (imageUrl.trim() && images.length < 5) {
      setImages([...images, imageUrl.trim()]);
      setImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      toast.error('Please write a review');
      return;
    }

    try {
      setSubmitting(true);
      
      const reviewData = {
        productId,
        orderId,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
        images: images,
      };

      await api.post('/reviews', reviewData);
      
      toast.success('Review submitted successfully! 🎉');
      router.push(`/products/${productId}`);
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
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

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-textile-cream bg-textile-pattern bg-pattern">
        <div className="container-custom py-8 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <Link
              href={`/products/${productId}`}
              className="text-textile-indigo hover:text-textile-royal transition-colors text-sm inline-flex items-center gap-1"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              Back to Product
            </Link>
            <div className="flex items-center gap-3 mt-2">
              <h1 className="text-3xl md:text-4xl font-bold gradient-textile">
                Write a Review
              </h1>
              <SparklesIcon className="w-8 h-8 text-textile-gold animate-pulse-slow" />
            </div>
            <p className="text-textile-brown/70 mt-1">
              Share your experience with this product
            </p>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="card-textile p-6 mb-6 hover:shadow-textile-hover transition-all duration-300"
          >
            <div className="flex items-center gap-4">
              <img
                src={product?.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=80&h=80&fit=crop'}
                alt={product?.name}
                className="w-20 h-20 object-cover rounded-xl border-2 border-textile-gold/10"
              />
              <div>
                <h2 className="font-semibold text-textile-brown text-lg">{product?.name}</h2>
                <p className="text-sm text-textile-brown/60">{product?.category}</p>
                <p className="text-sm font-bold gradient-textile">${product?.price?.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>

          {/* Review Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="card-textile p-6"
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-textile-brown mb-3">
                  <StarIcon className="w-4 h-4 inline mr-2 text-textile-gold" />
                  Rating *
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <motion.button
                      key={value}
                      type="button"
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.9 }}
                      onMouseEnter={() => setHoveredRating(value)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => handleRatingClick(value)}
                      className="text-4xl focus:outline-none transition-all"
                    >
                      {(hoveredRating || rating) >= value ? (
                        <StarSolid className="w-10 h-10 text-textile-gold drop-shadow-glow" />
                      ) : (
                        <StarIcon className="w-10 h-10 text-textile-gold/20" />
                      )}
                    </motion.button>
                  ))}
                  <motion.span 
                    className="text-sm text-textile-brown/60 ml-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: rating > 0 ? 1 : 0 }}
                  >
                    {rating > 0 ? `${rating} / 5` : 'Select a rating'}
                  </motion.span>
                </div>
              </div>

              {/* Title */}
              <div>
                <label htmlFor="title" className="input-label">
                  <PencilIcon className="w-4 h-4 inline mr-2" />
                  Review Title (Optional)
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Excellent Quality!"
                  maxLength={100}
                  className="input-field"
                />
                <p className="input-help">{title.length}/100 characters</p>
              </div>

              {/* Comment */}
              <div>
                <label htmlFor="comment" className="input-label">
                  <PencilIcon className="w-4 h-4 inline mr-2" />
                  Review *
                </label>
                <textarea
                  id="comment"
                  rows={5}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  maxLength={1000}
                  className="input-field"
                  required
                />
                <div className="flex justify-between mt-1">
                  <p className="input-help">Share your honest experience</p>
                  <p className="text-xs text-textile-brown/40">{comment.length}/1000 characters</p>
                </div>
              </div>

              {/* Images */}
              <div>
                <label className="input-label">
                  <PhotoIcon className="w-4 h-4 inline mr-2" />
                  Add Images (Optional)
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="Image URL (e.g., https://example.com/image.jpg)"
                    className="input-field flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={images.length >= 5}
                    className="btn-textile-primary inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add
                  </button>
                </div>
                {images.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10">
                    {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={img}
                          alt={`Review image ${index + 1}`}
                          className="w-20 h-20 object-cover rounded-lg border-2 border-textile-gold/10 group-hover:border-textile-gold/30 transition-all duration-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-textile-terracotta text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-textile-terracotta/80 transition-colors hover:scale-110"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-textile-warm/30 rounded-xl border-2 border-dashed border-textile-gold/20">
                    <PhotoIcon className="w-8 h-8 text-textile-brown/20 mx-auto mb-1" />
                    <p className="text-xs text-textile-brown/40">No images added yet</p>
                  </div>
                )}
                <p className="input-help">Max 5 images • Add product photos to help others</p>
              </div>

              {/* Submit */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t-2 border-textile-gold/20">
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  className="flex-1 btn-textile-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Submit Review
                    </>
                  )}
                </button>
                <Link
                  href={`/products/${productId}`}
                  className="btn-textile-secondary text-center inline-flex items-center justify-center gap-2"
                >
                  Cancel
                </Link>
              </div>

              {/* Review Guidelines */}
              <div className="mt-4 p-4 bg-textile-warm/30 rounded-xl border-2 border-textile-gold/10">
                <h4 className="text-sm font-medium text-textile-brown mb-2">📝 Review Guidelines</h4>
                <ul className="text-xs text-textile-brown/60 space-y-1">
                  <li>• Be honest and authentic about your experience</li>
                  <li>• Focus on product quality, features, and performance</li>
                  <li>• Avoid offensive language or personal attacks</li>
                  <li>• Include photos to help other buyers make informed decisions</li>
                </ul>
              </div>
            </form>
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