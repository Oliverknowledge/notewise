'use client';

import Link from 'next/link';
import { motion as Motion } from 'framer-motion';

export function AnimatedMain() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
      <Motion.section
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-3xl text-center mt-16 mb-12"
      >
        <h1 className="text-5xl md:text-6xl font-extrabold text-blue-800 mb-4 drop-shadow">Supercharge Your Study Sessions</h1>
        <p className="text-xl md:text-2xl text-green-700 mb-8 max-w-2xl mx-auto">
          <span className="font-bold text-blue-700">NoteWise</span> is your AI-powered learning companion. Upload your notes, get instant explanations, track your progress, and stay motivated with gamified learning. Whether you're prepping for exams or mastering new topics, NoteWise helps you learn smarter, not harder.
        </p>
        <Motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4, duration: 0.5 }}>
          <Link href="/signup" className="bg-gradient-to-r from-blue-500 to-green-500 text-white px-10 py-4 rounded-full text-2xl font-bold shadow-lg hover:scale-105 transition">Get Started Free</Link>
        </Motion.div>
      </Motion.section>
      <Motion.section
        className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: {
            transition: {
              staggerChildren: 0.15
            }
          }
        }}
      >
        {[{
          icon: '🤖',
          title: 'AI-Powered Explanations',
          desc: 'Get instant, clear explanations for your notes and questions, tailored to your learning style.',
          color: 'text-green-500',
          titleColor: 'text-blue-700',
        }, {
          icon: '📊',
          title: 'Track Your Progress',
          desc: 'Visualize your learning journey, earn XP, and unlock achievements as you study.',
          color: 'text-blue-500',
          titleColor: 'text-green-700',
        }, {
          icon: '🏆',
          title: 'Gamified Motivation',
          desc: 'Stay motivated with badges, streaks, and friendly competition on the leaderboard.',
          color: 'text-blue-400',
          titleColor: 'text-blue-700',
        }, {
          icon: '🚀',
          title: 'Study Smarter',
          desc: 'Save time, reduce stress, and achieve your academic goals with NoteWise by your side.',
          color: 'text-green-400',
          titleColor: 'text-green-700',
        }].map((feature, i) => (
          <Motion.div
            key={feature.title}
            className="bg-white rounded-lg shadow p-8 flex flex-col items-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + i * 0.15, duration: 0.6 }}
          >
            <div className={`text-4xl mb-2 ${feature.color}`}>{feature.icon}</div>
            <div className={`font-bold text-xl mb-1 ${feature.titleColor}`}>{feature.title}</div>
            <div className="text-gray-600 text-lg text-center">{feature.desc}</div>
          </Motion.div>
        ))}
      </Motion.section>
    </main>
  );
} 