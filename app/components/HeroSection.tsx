'use client';

import { motion as Motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export const HeroSection = () => {
  return (
    <section className="min-h-[90vh] flex items-center justify-center px-4 py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        <Motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
            Study smarter with your own AI voice tutor
          </h1>
          <p className="text-xl text-gray-600">
            Upload your notes. Talk to your AI tutor. Get confident fast.
          </p>
          <div className="flex gap-4">
            <Link 
              href="/signup" 
              className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </Motion.div>
        
        <Motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="relative h-[500px]"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-2xl transform rotate-3"></div>
          <div className="absolute inset-0 bg-white rounded-2xl shadow-xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
              alt="Students studying together"
              fill
              className="object-cover"
              priority
            />
          </div>
        </Motion.div>
      </div>
    </section>
  );
}; 