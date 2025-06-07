'use client';

import { motion } from 'framer-motion';
import { Brain, MessageSquare, Target } from 'lucide-react';
import Image from 'next/image';

const stats = [
  {
    icon: <Brain className="w-8 h-8 text-blue-600" />,
    title: "Active recall = 3x better memory",
    description: "Research shows that actively recalling information improves retention by up to 300% compared to passive reading.",
    image: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?q=80&w=2070&auto=format&fit=crop"
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
    title: "Talking boosts focus and engagement",
    description: "Verbalizing concepts increases neural connections and helps cement knowledge in long-term memory.",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
  },
  {
    icon: <Target className="w-8 h-8 text-blue-600" />,
    title: "Personalized quizzes help exam performance",
    description: "Students who practice with personalized quizzes show 20% higher test scores on average.",
    image: "https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=2032&auto=format&fit=crop"
  }
];

export const ScienceSection = () => {
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
            Science-backed memory improvement
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            EchoStudy is built on proven learning science principles
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, index) => (
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
                  src={stat.image}
                  alt={stat.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  {stat.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {stat.title}
                </h3>
                <p className="text-gray-600">
                  {stat.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}; 