"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import { motion as Motion } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) router.push('/dashboard');
      } catch {}
    };
    checkSession();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session) throw new Error('No session returned');
      form.reset();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <Motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7 }} 
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
        <p className="text-gray-600 mb-6">Log in to continue your learning journey.</p>
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-2 w-full text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Email" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
            disabled={loading} 
          />
          <input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Password" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
            disabled={loading} 
          />
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors" 
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/signup" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Sign Up
          </Link>
        </div>
      </Motion.div>
    </div>
  );
} 