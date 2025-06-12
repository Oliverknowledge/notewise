import Link from 'next/link';
import { HeroSection } from './components/HeroSection';
import { ProblemSection } from './components/ProblemSection';
import { SolutionSection } from './components/SolutionSection';
import { ScienceSection } from './components/ScienceSection';
import { Footer } from './components/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="w-full py-6 px-8 flex justify-between items-center bg-white/80 shadow-sm fixed top-0 left-0 right-0 z-50">
        <Link href="/" className="text-2xl font-bold text-blue-600">
          Notewise
        </Link>
        <nav className="space-x-4">
          <Link href="/login" className="text-gray-600 hover:text-blue-600 transition-colors">
            Login
          </Link>
          <Link href="/signup" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="pt-20">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <ScienceSection />
      </main>

      <Footer />
    </div>
  );
}
