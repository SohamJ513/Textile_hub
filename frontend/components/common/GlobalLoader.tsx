'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function GlobalLoader() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsLoading(true);
      setPrevPathname(pathname);
      
      // Hide loader after page loads
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-gradient-to-r from-textile-indigo via-textile-gold to-textile-royal"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            exit={{ width: '0%' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-textile-indigo via-textile-gold to-textile-royal"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}