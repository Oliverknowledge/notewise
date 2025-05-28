'use client';

import { motion } from 'framer-motion';

export function AnimatedHeader() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -40 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.7 }} 
      className="text-2xl font-bold text-blue-700"
    >
      NoteWise
    </motion.div>
  );
} 