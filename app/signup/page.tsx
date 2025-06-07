"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase-client";
import { motion } from 'framer-motion';

export default function SignupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;
    const fullName = (form.elements.namedItem("fullName") as HTMLInputElement).value;

    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { email_confirmed: true } }
      });
      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error('No user data returned');
      
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        created_at: new Date().toISOString()
      });

      if (profileError) throw profileError;

      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 40 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.7 }} 
        className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md flex flex-col items-center"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Notewise!</h1>
        <p className="text-gray-600 mb-6">Create your account and start learning smarter.</p>
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-2 w-full text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleSignup} className="w-full flex flex-col gap-4">
          <input 
            id="fullName"
            name="fullName" 
            type="text" 
            placeholder="Full Name" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
            disabled={loading} 
            required
          />
          <input 
            id="email" 
            name="email" 
            type="email" 
            placeholder="Email" 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
            disabled={loading} 
            required
          />
          <input 
            id="password" 
            name="password" 
            type="password" 
            placeholder="Password" 
            minLength={6} 
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg" 
            disabled={loading} 
            required
          />
          <p className="text-sm text-gray-500 mt-1">Password must be at least 6 characters long</p>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors" 
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="mt-6 text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:text-blue-700 transition-colors">
            Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
} 