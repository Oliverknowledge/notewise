'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vapiService } from '@/lib/vapi';

export default function NoteUploadForm() {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    description: '',
    file: null as File | null,
  });
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialResponse, setInitialResponse] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setInitialResponse(null);

    try {
      if (!formData.file) {
        throw new Error('Please upload a file');
      }

      // Read the file content
      const text = await formData.file.text();

      // Process the notes and get initial response
      const response = await vapiService.processNotes(text);
      setInitialResponse(response);
      setIsSessionActive(true);

      // The tutoring session is already started by processNotes
    } catch (err) {
      console.error('Error starting tutoring session:', err);
      setError(err instanceof Error ? err.message : 'Failed to start tutoring session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, file: e.target.files[0] });
    }
  };

  const endTutoringSession = async () => {
    setIsLoading(true);
    try {
      await vapiService.endSession();
      setIsSessionActive(false);
      setInitialResponse(null);
    } catch (err) {
      console.error('Error ending session:', err);
      setError(err instanceof Error ? err.message : 'Failed to end session');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Study Notes</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {!isSessionActive ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter note title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Enter subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter a brief description of your notes"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload Notes</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileChange}
                required
              />
              <p className="text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX, TXT
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Processing Notes...' : 'Start Tutoring Session'}
            </Button>
          </form>
        ) : (
          <div className="space-y-6">
            {initialResponse && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h2 className="text-lg font-medium text-blue-900 mb-2">Initial Analysis</h2>
                <p className="text-sm text-blue-700">{initialResponse}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Active Session</h2>
              <p className="text-sm text-gray-500">
                Your tutoring session is active. Speak naturally to interact with your AI tutor.
                The AI will analyze your notes and help you understand the material better.
              </p>
            </div>

            <Button
              onClick={endTutoringSession}
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? 'Ending Session...' : 'End Session'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 