import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: Request) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch notes for the current user
    const { data: notes, error: fetchError } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return NextResponse.json(
        { error: 'Error fetching notes' },
        { status: 500 }
      )
    }

    // Get signed URLs for each note's file
    const notesWithUrls = await Promise.all(
      notes.map(async (note) => {
        const { data } = await supabase.storage
          .from('notes')
          .createSignedUrl(note.file_path, 3600) // URL valid for 1 hour

        return {
          ...note,
          file_url: data?.signedUrl || null,
        }
      })
    )

    return NextResponse.json(notesWithUrls)
  } catch (error) {
    console.error('Error in fetch notes route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 