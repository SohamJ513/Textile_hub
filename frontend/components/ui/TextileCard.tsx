'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TextileCardProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  variant?: 'default' | 'warm';
}

export default function TextileCard({ 
  children, 
  delay = 0, 
  className = '', 
  variant = 'default' 
}: TextileCardProps) {
  const cardClass = variant === 'warm' 
    ? 'card-textile-warm' 
    : 'card-textile';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`${cardClass} ${className} bg-weave-pattern bg-weave`}
    >
      {children}
    </motion.div>
  );
}