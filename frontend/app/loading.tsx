'use client';

import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="min-h-screen bg-textile-cream bg-textile-pattern bg-pattern flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="loading-spinner mx-auto"></div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-textile-brown/60 mt-4"
        >
          Loading...
        </motion.p>
      </motion.div>
    </div>
  );
}