'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';

interface ViewStudyMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string | null;
}

interface NoteContent {
  title: string;
  content: string;
  // Add any other fields you want to display here, e.g., 'key_points', 'session_summary'
}

export default function ViewStudyMaterialModal({ isOpen, onClose, materialId }: ViewStudyMaterialModalProps) {
  const [noteContent, setNoteContent] = useState<NoteContent | null>(null);
  const [displayContent, setDisplayContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && materialId) {
      setLoading(true);
      setError(null);
      const fetchNoteContent = async () => {
        try {
          const { data: note, error: fetchError } = await supabase
            .from('notes')
            .select('title, content')
            .eq('id', materialId)
            .single();

          if (fetchError) throw fetchError;
          setNoteContent(note);

          try {
            const parsedContent = JSON.parse(note.content);
            if (parsedContent.summary) {
              setDisplayContent(parsedContent.summary);
            } else {
              setDisplayContent(note.content);
            }
          } catch (jsonError) {
            // If parsing fails, treat content as plain text
            setDisplayContent(note.content);
          }
        } catch (err) {
          console.error('Error fetching note content:', err);
          setError(err instanceof Error ? err.message : 'Failed to load note content.');
        } finally {
          setLoading(false);
        }
      };
      fetchNoteContent();
    } else {
      setNoteContent(null);
      setDisplayContent(null);
      setLoading(false);
      setError(null);
    }
  }, [isOpen, materialId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{loading ? 'Loading...' : noteContent?.title || 'Study Material'}</DialogTitle>
          {noteContent?.title && displayContent !== noteContent?.title && !loading && (
            <DialogDescription className="text-sm text-gray-500">{noteContent.title}</DialogDescription>
          )}
          {error && <DialogDescription className="text-red-500">{error}</DialogDescription>}
        </DialogHeader>
        <div className="flex-1 overflow-hidden py-4">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          ) : displayContent ? (
            <ScrollArea className="h-full p-4 border rounded-md">
              <div className="prose max-w-none whitespace-pre-wrap">
                <p>{displayContent}</p>
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No content available or material not found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 