'use client';

import Link from 'next/link';
import { motion as Motion } from 'framer-motion';

const leaderboard = [
  { name: 'Alex', xp: 1200, level: 5, badges: ['Math Whiz', '7-Day Streak'] },
  { name: 'Jamie', xp: 1100, level: 5, badges: ['Science Star', 'First Session'] },
  { name: 'Taylor', xp: 950, level: 4, badges: ['History Buff'] },
  { name: 'Morgan', xp: 800, level: 3, badges: [] },
  { name: 'Jordan', xp: 700, level: 3, badges: ['First Session'] },
];

const medalColors = [
  'bg-gradient-to-r from-yellow-400 to-yellow-200 text-yellow-900',
  'bg-gradient-to-r from-gray-400 to-gray-200 text-gray-900',
  'bg-gradient-to-r from-orange-400 to-orange-200 text-orange-900',
];

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex flex-col">
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white/80 shadow">
        <div className="text-2xl font-bold text-blue-700">NoteWise</div>
        <nav className="space-x-4">
          <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline">Dashboard</Link>
          <Link href="/progress" className="text-green-600 font-semibold hover:underline">Progress</Link>
          <Link href="/logout" className="text-gray-500 font-semibold hover:underline">Logout</Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <Motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl flex flex-col items-center mt-12">
          <h1 className="text-3xl font-bold text-blue-800 mb-6">Leaderboard</h1>
          <div className="w-full flex flex-col gap-4">
            {leaderboard.map((user, i) => (
              <Motion.div
                key={user.name}
                className={`flex items-center justify-between px-4 py-3 rounded-lg shadow-sm ${i < 3 ? medalColors[i] : 'bg-blue-50 text-blue-900'} font-semibold`}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
              >
                <div className="flex items-center gap-3">
                  {i < 3 && <span className="text-2xl">{['🥇','🥈','🥉'][i]}</span>}
                  <span className="text-lg">{user.name}</span>
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Lvl {user.level}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-bold">{user.xp} XP</span>
                  {user.badges.map(badge => (
                    <span key={badge} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold border border-green-300 shadow-sm ml-1">{badge}</span>
                  ))}
                </div>
              </Motion.div>
            ))}
          </div>
        </Motion.div>
      </main>
      <footer className="py-6 text-center text-gray-500 bg-white/80 mt-12">&copy; {new Date().getFullYear()} NoteWise. All rights reserved.</footer>
    </div>
  );
} 