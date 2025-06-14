'use client';

import { motion as Motion } from 'framer-motion';
import { Upload, MessageSquare, Brain } from 'lucide-react';
import Image from 'next/image';

const steps = [
  {
    icon: <Upload className="w-8 h-8 text-blue-600" />,
    title: "Upload your notes/slides",
    description: "Simply upload your course materials in any format - PDFs, PowerPoints, or text files.",
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?q=80&w=2070&auto=format&fit=crop"
  },
  {
    icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
    title: "Talk to your AI tutor",
    description: "Have natural conversations with your AI tutor about your course content.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1976&auto=format&fit=crop"
  },
  {
    icon: <Brain className="w-8 h-8 text-blue-600" />,
    title: "Learn by recalling & explaining",
    description: "Practice active recall and get instant feedback to strengthen your understanding.",
    image: "https://images.unsplash.com/photo-1501504905252-473c47e087f8?q=80&w=1974&auto=format&fit=crop"
  }
];

export const SolutionSection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4">
        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            How Notewise Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Three simple steps to transform your study experience
          </p>
        </Motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-8">
                <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
                  {step.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600">
                  {step.description}
                </p>
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}; 