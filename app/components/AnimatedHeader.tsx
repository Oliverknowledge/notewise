'use client';

import { motion as Motion } from 'framer-motion';
import Link from 'next/link';

export function AnimatedHeader() {
  return (
    <Motion.div 
      initial={{ opacity: 0, x: -40 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ duration: 0.7 }} 
      className="text-2xl font-bold text-blue-700"
    >
      <Link href = "/">
      NoteWise
      </Link>
    </Motion.div>
  );
} 