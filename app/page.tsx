import Link from 'next/link';
import { AnimatedHeader } from './components/AnimatedHeader';
import { AnimatedMain } from './components/AnimatedMain';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 to-green-100 flex flex-col">
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white/80 shadow">
        <AnimatedHeader />
        <nav className="space-x-4">
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">Login</Link>
          <Link href="/signup" className="text-green-600 font-semibold hover:underline">Sign Up</Link>
        </nav>
      </header>
      <AnimatedMain />
      <footer className="py-6 text-center text-gray-500 bg-white/80">&copy; {new Date().getFullYear()} NoteWise. All rights reserved.</footer>
    </div>
  );
}
