import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const title = formData.get('title') as string
    const subject = formData.get('subject') as string
    const description = formData.get('description') as string

    if (!file || !title || !subject || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const { data: fileData, error: uploadError } = await supabase.storage
      .from('notes')
      .upload(fileName, file)

    if (uploadError) {
      return NextResponse.json(
        { error: 'Error uploading file' },
        { status: 500 }
      )
    }

    // Create note record in the database
    const { data: note, error: dbError } = await supabase
      .from('notes')
      .insert([
        {
          user_id: user.id,
          title,
          subject,
          description,
          file_path: fileName,
          file_name: file.name,
        },
      ])
      .select()
      .single()

    if (dbError) {
      // If database insert fails, delete the uploaded file
      await supabase.storage.from('notes').remove([fileName])
      return NextResponse.json(
        { error: 'Error saving note' },
        { status: 500 }
      )
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('Error in upload route:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 