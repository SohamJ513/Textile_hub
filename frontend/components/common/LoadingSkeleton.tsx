'use client';

import { motion } from 'framer-motion';

interface LoadingSkeletonProps {
  count?: number;
  type?: 'products' | 'orders' | 'reviews' | 'dashboard' | 'cards';
}

export function LoadingSkeleton({ count = 4, type = 'products' }: LoadingSkeletonProps) {
  const getGridCols = () => {
    switch (type) {
      case 'products':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
      case 'orders':
        return 'grid-cols-1';
      case 'reviews':
        return 'grid-cols-1 sm:grid-cols-2';
      case 'dashboard':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      case 'cards':
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
      default:
        return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
  };

  return (
    <div className={`grid ${getGridCols()} gap-6`}>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * 0.04 }}
          className="card-textile animate-pulse"
        >
          {type === 'products' && (
            <>
              <div className="h-48 bg-textile-gold/10 rounded-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-textile-gold/10 rounded w-3/4"></div>
                <div className="h-3 bg-textile-gold/10 rounded w-1/2"></div>
                <div className="flex justify-between">
                  <div className="h-4 bg-textile-gold/10 rounded w-1/4"></div>
                  <div className="h-4 bg-textile-gold/10 rounded w-1/4"></div>
                </div>
              </div>
            </>
          )}

          {type === 'orders' && (
            <div className="p-4 space-y-3">
              <div className="flex justify-between">
                <div className="h-5 bg-textile-gold/10 rounded w-1/3"></div>
                <div className="h-5 bg-textile-gold/10 rounded w-1/4"></div>
              </div>
              <div className="h-3 bg-textile-gold/10 rounded w-1/2"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-textile-gold/10 rounded w-1/4"></div>
                <div className="h-4 bg-textile-gold/10 rounded w-1/4"></div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 bg-textile-gold/10 rounded w-1/3"></div>
                <div className="h-8 bg-textile-gold/10 rounded w-1/3"></div>
                <div className="h-8 bg-textile-gold/10 rounded w-1/3"></div>
              </div>
            </div>
          )}

          {type === 'reviews' && (
            <div className="p-4 space-y-3">
              <div className="flex gap-1">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="w-4 h-4 bg-textile-gold/10 rounded-full"></div>
                ))}
              </div>
              <div className="h-4 bg-textile-gold/10 rounded w-3/4"></div>
              <div className="h-3 bg-textile-gold/10 rounded w-full"></div>
              <div className="h-3 bg-textile-gold/10 rounded w-2/3"></div>
            </div>
          )}

          {type === 'cards' && (
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <div className="h-3 bg-textile-gold/10 rounded w-20"></div>
                  <div className="h-6 bg-textile-gold/10 rounded w-16"></div>
                </div>
                <div className="w-10 h-10 bg-textile-gold/10 rounded-full"></div>
              </div>
            </div>
          )}

          {type === 'dashboard' && (
            <div className="p-4 space-y-3">
              <div className="h-3 bg-textile-gold/10 rounded w-1/3"></div>
              <div className="h-8 bg-textile-gold/10 rounded w-1/2"></div>
              <div className="flex gap-2">
                <div className="h-2 bg-textile-gold/10 rounded flex-1"></div>
                <div className="h-2 bg-textile-gold/10 rounded flex-1"></div>
                <div className="h-2 bg-textile-gold/10 rounded flex-1"></div>
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton for stats cards
export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="card-textile animate-pulse p-6"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-3 bg-textile-gold/10 rounded w-20"></div>
              <div className="h-6 bg-textile-gold/10 rounded w-16"></div>
            </div>
            <div className="w-10 h-10 bg-textile-gold/10 rounded-full"></div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Skeleton for hero section
export function HeroSkeleton() {
  return (
    <div className="hero-textile py-20 animate-pulse">
      <div className="container mx-auto px-4 text-center">
        <div className="h-12 bg-white/10 rounded-lg w-2/3 mx-auto mb-4"></div>
        <div className="h-6 bg-white/10 rounded-lg w-1/2 mx-auto mb-8"></div>
        <div className="flex justify-center gap-3">
          <div className="h-14 bg-white/10 rounded-xl w-1/3"></div>
          <div className="h-14 bg-white/10 rounded-xl w-24"></div>
        </div>
      </div>
    </div>
  );
}

// Skeleton for filter bar
export function FilterSkeleton() {
  return (
    <div className="card-textile p-4 animate-pulse">
      <div className="flex flex-wrap gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 bg-textile-gold/10 rounded-lg w-24"></div>
        ))}
      </div>
    </div>
  );
}