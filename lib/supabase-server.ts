"use server"
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Server-side Supabase instance
export const createServerSupabaseClient = async () =>
  createServerComponentClient({
    cookies,
  }) 