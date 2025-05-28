'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  title: string;
  subject: string;
  description: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }
      const data = await response.json();
      setNotes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading notes...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
        {error}
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No notes uploaded yet. Upload your first note using the form above!
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {notes.map((note) => (
        <Card key={note.id} className="flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg">{note.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <div className="space-y-2">
              <p className="text-sm font-medium">Subject: {note.subject}</p>
              <p className="text-sm text-gray-600">{note.description}</p>
              <p className="text-sm text-gray-500">
                File: {note.file_name}
              </p>
              <p className="text-sm text-gray-500">
                Uploaded: {new Date(note.created_at).toLocaleDateString()}
              </p>
              <Button
                asChild
                className="w-full mt-4"
                variant="outline"
              >
                <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                  Download Note
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 