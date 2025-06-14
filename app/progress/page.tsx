'use client';

import Link from 'next/link';
import { motion as Motion } from 'framer-motion';

const userProgress = {
  xp: 850,
  level: 3,
  streak: 5,
  badges: ['First Session', '7-Day Streak', 'Math Whiz'],
  history: [100, 200, 400, 600, 850], // XP over time
};

function getNextLevelXP(level: number) {
  return (level + 1) ** 2 * 100;
}

export default function ProgressPage() {
  const nextXP = getNextLevelXP(userProgress.level);
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex flex-col">
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white/80 shadow">
        <div className="text-2xl font-bold text-blue-700">NoteWise</div>
        <nav className="space-x-4">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">Dashboard</Link>
          <Link href="/leaderboard" className="text-green-600 font-semibold hover:underline">Leaderboard</Link>
          <Link href="/logout" className="text-gray-500 font-semibold hover:underline">Logout</Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl flex flex-col items-center mt-12">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Your Progress</h1>
          <div className="w-full mb-6">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-blue-700">Level {userProgress.level}</span>
              <span className="text-sm text-gray-500">{userProgress.xp} XP / {nextXP} XP</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-gradient-to-r from-blue-400 to-green-400 h-4 rounded-full transition-all"
                style={{ width: `${(userProgress.xp / nextXP) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex gap-4 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-green-700">{userProgress.streak}</span>
              <span className="text-xs text-gray-500">Day Streak</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold text-blue-700">{userProgress.badges.length}</span>
              <span className="text-xs text-gray-500">Badges</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mb-8">
            {userProgress.badges.map(badge => (
              <span key={badge} className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold border border-green-300 shadow-sm">{badge}</span>
            ))}
          </div>
          <div className="w-full mt-8">
            <h2 className="text-lg font-bold text-blue-700 mb-2">XP Over Time</h2>
            <div className="w-full h-32 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg flex items-end p-4">
              {/* Simple XP bar chart */}
              {userProgress.history.map((xp, i) => (
                <Motion.div key={i} className="flex-1 mx-1 flex flex-col items-center" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}>
                  <div
                    className="w-4 rounded bg-blue-400"
                    style={{ height: `${(xp / nextXP) * 100}%`, minHeight: '10px' }}
                  ></div>
                  <span className="text-xs text-gray-400 mt-1">{xp} XP</span>
                </Motion.div>
              ))}
            </div>
          </div>
        </Motion.div>
      </main>
      <footer className="py-6 text-center text-gray-500 bg-white/80 mt-12">&copy; {new Date().getFullYear()} NoteWise. All rights reserved.</footer>
    </div>
  );
} 