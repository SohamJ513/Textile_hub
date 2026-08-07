'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon as StarOutline,
  PencilIcon,
  TrashIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import Navbar from '@/components/common/Navbar';
import PageTransition from '@/components/common/PageTransition';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export default function MyReviews() {
  const router = useRouter();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    average: 0,
    fiveStar: 0,
    fourStar: 0,
    threeStar: 0,
    twoStar: 0,
    oneStar: 0,
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
      fetchReviews();
    } else {
      router.push('/login');
    }
  }, [router]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await api.get('/reviews/user');
      const reviewsList = response.data.reviews || [];
      setReviews(reviewsList);
      
      // Calculate stats
      const total = reviewsList.length;
      if (total > 0) {
        const sum = reviewsList.reduce((acc: number, r: any) => acc + r.rating, 0);
        const avg = sum / total;
        
        const fiveStar = reviewsList.filter((r: any) => r.rating === 5).length;
        const fourStar = reviewsList.filter((r: any) => r.rating === 4).length;
        const threeStar = reviewsList.filter((r: any) => r.rating === 3).length;
        const twoStar = reviewsList.filter((r: any) => r.rating === 2).length;
        const oneStar = reviewsList.filter((r: any) => r.rating === 1).length;
        
        setStats({
          total,
          average: avg,
          fiveStar,
          fourStar,
          threeStar,
          twoStar,
          oneStar,
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await api.delete(`/reviews/${reviewId}`);
      toast.success('Review deleted successfully');
      fetchReviews();
    } catch (error) {
      console.error('Error deleting review:', error);
      toast.error('Failed to delete review');
    }
  };

  const renderStars = (rating: number, size: string = 'text-xl') => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={`${size} ${star <= rating ? 'text-textile-gold' : 'text-textile-gold/20'}`}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderRatingBar = (count: number, total: number, label: string) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-textile-brown/60 w-16">{label}</span>
        <div className="flex-1 h-2 bg-textile-gold/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-textile-gold to-textile-amber rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-xs text-textile-brown/60 w-8">{count}</span>
      </div>
    );
  };

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
                <div className="h-10 bg-textile-gold/10 rounded w-40 animate-pulse"></div>
              </div>
            </div>
            
            {/* Stats Skeleton */}
            <div className="card-textile mb-8 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 bg-textile-gold/10 rounded"></div>
                  <div>
                    <div className="h-6 bg-textile-gold/10 rounded w-24"></div>
                    <div className="h-4 bg-textile-gold/10 rounded w-32 mt-1"></div>
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-16 h-3 bg-textile-gold/10 rounded"></div>
                      <div className="flex-1 h-2 bg-textile-gold/10 rounded"></div>
                      <div className="w-8 h-3 bg-textile-gold/10 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Reviews Skeleton */}
            <LoadingSkeleton type="reviews" count={3} />
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
                  My Reviews
                </h1>
                <p className="text-textile-brown/70 mt-1">
                  Manage your product reviews
                </p>
              </div>
              <div className="flex gap-3">
                <Link
                  href="/marketplace"
                  className="btn-textile-secondary text-sm"
                >
                  <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                  Browse Products
                </Link>
              </div>
            </div>
          </motion.div>

          {reviews.length > 0 ? (
            <>
              {/* Stats Summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="card-textile mb-8"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Rating */}
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-3">
                      <div className="text-5xl font-bold text-textile-brown">
                        {stats.average.toFixed(1)}
                      </div>
                      <div>
                        {renderStars(Math.round(stats.average), 'text-2xl')}
                        <p className="text-sm text-textile-brown/60 mt-1">
                          Based on {stats.total} review{stats.total !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rating Bars */}
                  <div className="md:col-span-2 space-y-1.5">
                    {renderRatingBar(stats.fiveStar, stats.total, '5 ★')}
                    {renderRatingBar(stats.fourStar, stats.total, '4 ★')}
                    {renderRatingBar(stats.threeStar, stats.total, '3 ★')}
                    {renderRatingBar(stats.twoStar, stats.total, '2 ★')}
                    {renderRatingBar(stats.oneStar, stats.total, '1 ★')}
                  </div>
                </div>
              </motion.div>

              {/* Reviews List */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="space-y-4"
              >
                {reviews.map((review: any, index: number) => (
                  <motion.div
                    key={review._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="card-textile hover:shadow-textile-hover transition-all duration-300"
                  >
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1 w-full">
                        {/* Product & Rating */}
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <Link
                            href={`/products/${review.productId?._id}`}
                            className="font-semibold text-textile-indigo hover:text-textile-royal transition-colors hover:underline"
                          >
                            {review.productId?.name || 'Product'}
                          </Link>
                          <div className="flex items-center gap-1">
                            {renderStars(review.rating, 'text-lg')}
                            <span className="text-sm font-medium text-textile-brown/60 ml-1">
                              ({review.rating}/5)
                            </span>
                          </div>
                        </div>

                        {/* Review Content */}
                        {review.title && (
                          <h3 className="text-lg font-semibold text-textile-brown">
                            {review.title}
                          </h3>
                        )}
                        <p className="text-textile-brown/80 mt-1">
                          {review.comment}
                        </p>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-textile-brown/50">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <Link
                            href={`/products/${review.productId?._id}`}
                            className="text-textile-indigo hover:text-textile-royal transition-colors flex items-center gap-1"
                          >
                            View Product →
                          </Link>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        <Link
                          href={`/reviews/edit/${review._id}`}
                          className="btn-textile-secondary text-sm inline-flex items-center gap-1"
                        >
                          <PencilIcon className="w-4 h-4" />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(review._id)}
                          className="btn-textile-terracotta text-sm inline-flex items-center gap-1"
                        >
                          <TrashIcon className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer Stats */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-6 pt-6 border-t-2 border-textile-gold/20"
              >
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
                  {stats.total} review{stats.total !== 1 ? 's' : ''} • 
                  Average rating {stats.average.toFixed(1)} ★
                </p>
              </motion.div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="card-textile-warm p-12 text-center"
            >
              <p className="text-6xl mb-4">✍️</p>
              <h3 className="text-xl font-semibold text-textile-brown mb-2">No reviews yet</h3>
              <p className="text-textile-brown/60">
                You haven't written any reviews yet
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/marketplace"
                  className="btn-textile-primary inline-block"
                >
                  <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                  Browse Products
                </Link>
                <Link
                  href="/buyer/orders"
                  className="btn-textile-secondary inline-block"
                >
                  <ShoppingBagIcon className="w-4 h-4 inline mr-2" />
                  View Orders
                </Link>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}