'use client';

import { motion } from 'framer-motion';
import { BookOpen, Clock, DollarSign } from 'lucide-react';
import Image from 'next/image';

const problems = [
  {
    icon: <BookOpen className="w-8 h-8 text-blue-600" />,
    title: "Passive rereading = poor retention",
    description: "Simply reading notes over and over doesn't help you remember information effectively.",
    image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=2022&auto=format&fit=crop"
  },
  {
    icon: <Clock className="w-8 h-8 text-blue-600" />,
    title: "Study tools don't use your real notes",
    description: "Generic study materials don't match your specific course content and learning style.",
    image: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop"
  },
  {
    icon: <DollarSign className="w-8 h-8 text-blue-600" />,
    title: "Tutors are expensive or unavailable",
    description: "Professional tutors can be costly and aren't always available when you need them.",
    image: "https://images.unsplash.com/photo-1577896851231-70ef18881754?q=80&w=2070&auto=format&fit=crop"
  }
];

export const ProblemSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Why traditional studying doesn't work
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The old ways of studying are inefficient and frustrating. Here's why you need a better solution.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 rounded-xl hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={problem.image}
                  alt={problem.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="mb-4">{problem.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {problem.title}
                </h3>
                <p className="text-gray-600">
                  {problem.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}; 