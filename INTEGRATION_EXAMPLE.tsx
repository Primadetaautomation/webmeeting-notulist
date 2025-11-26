/**
 * Integration Example: How to use Auth and Transcriptions in the Recorder component
 *
 * This file demonstrates how to integrate the new authentication and transcription
 * features with the existing Recorder component.
 *
 * IMPORTANT: This is an example file, not meant to be imported directly.
 * Copy the patterns shown here into your actual components.
 */

import React, { useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import { useTranscriptions } from './hooks/useTranscriptions';
import type { TranscriptionResult } from './types';

/**
 * Example: Enhanced Recorder with Auth and Save Functionality
 */
function EnhancedRecorder() {
  const { user, signInWithGoogle, signOut, loading: authLoading } = useAuth();
  const { createTranscription, loading: transcriptionLoading } = useTranscriptions();

  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Handle saving transcription to database
  const handleSaveTranscription = useCallback(async () => {
    if (!transcriptionResult || !user) {
      return;
    }

    setSaveStatus('saving');

    try {
      await createTranscription({
        title: `Vergadering ${new Date().toLocaleDateString('nl-NL', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}`,
        transcript_text: transcriptionResult.text,
        audio_duration_seconds: 120, // You can track this from your recorder
        language: 'nl'
      });

      setSaveStatus('saved');

      // Reset after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Failed to save transcription:', error);
      setSaveStatus('error');
    }
  }, [transcriptionResult, user, createTranscription]);

  // Handle recording completion
  const handleRecordingComplete = useCallback((result: TranscriptionResult) => {
    setTranscriptionResult(result);

    // Auto-save if user is logged in
    if (user) {
      handleSaveTranscription();
    }
  }, [user, handleSaveTranscription]);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Auth Section */}
      <div className="glass rounded-2xl p-6 mb-6 border border-surface-800">
        {user ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-400 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-surface-200">{user.email}</p>
                <p className="text-xs text-surface-500">Ingelogd</p>
              </div>
            </div>
            <button
              onClick={signOut}
              disabled={authLoading}
              className="btn-secondary text-sm"
            >
              Uitloggen
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-surface-400 mb-4">
              Log in om je transcripties automatisch op te slaan
            </p>
            <button
              onClick={signInWithGoogle}
              disabled={authLoading}
              className="btn-primary inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Inloggen met Google
            </button>
          </div>
        )}
      </div>

      {/* Recording Section */}
      <div className="glass rounded-2xl p-8 border border-surface-800">
        <h2 className="text-2xl font-bold mb-6">Opname</h2>

        {/* Your existing Recorder component would go here */}
        <div className="text-center py-12">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`btn-primary w-32 h-32 rounded-full ${
              isRecording ? 'animate-pulse' : ''
            }`}
          >
            {isRecording ? '⏹️' : '🎤'}
          </button>
          <p className="mt-4 text-surface-400">
            {isRecording ? 'Opname bezig...' : 'Klik om op te nemen'}
          </p>
        </div>
      </div>

      {/* Transcription Result */}
      {transcriptionResult && (
        <div className="glass rounded-2xl p-6 mt-6 border border-surface-800">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Transcriptie</h3>

            {user && (
              <button
                onClick={handleSaveTranscription}
                disabled={transcriptionLoading || saveStatus === 'saving'}
                className={`btn-primary text-sm ${
                  saveStatus === 'saved' ? 'bg-success-600' : ''
                } ${saveStatus === 'error' ? 'bg-danger-600' : ''}`}
              >
                {saveStatus === 'idle' && '💾 Opslaan'}
                {saveStatus === 'saving' && '⏳ Bezig...'}
                {saveStatus === 'saved' && '✅ Opgeslagen'}
                {saveStatus === 'error' && '❌ Fout'}
              </button>
            )}

            {!user && (
              <div className="text-sm text-surface-500">
                Log in om op te slaan
              </div>
            )}
          </div>

          <div className="bg-surface-900/50 rounded-lg p-4 border border-surface-700">
            <p className="text-surface-200 whitespace-pre-wrap">
              {transcriptionResult.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Transcriptions History Page
 */
function TranscriptionsHistory() {
  const { user } = useAuth();
  const {
    transcriptions,
    loading,
    error,
    deleteTranscription,
    fetchTranscriptions
  } = useTranscriptions();

  const [searchQuery, setSearchQuery] = useState('');

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-surface-400 text-lg">
          Log in om je transcripties te bekijken
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass rounded-2xl p-6 border border-danger-500/50">
        <p className="text-danger-400">Error: {error.message}</p>
        <button
          onClick={() => fetchTranscriptions()}
          className="btn-primary mt-4"
        >
          Opnieuw proberen
        </button>
      </div>
    );
  }

  const filteredTranscriptions = transcriptions.filter((t) =>
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.transcript_text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Mijn Transcripties</h1>

        {/* Search */}
        <input
          type="text"
          placeholder="Zoeken in transcripties..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-3 bg-surface-800 border border-surface-700 rounded-lg text-surface-100 placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Transcriptions Grid */}
      {filteredTranscriptions.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-surface-400 text-lg">
            {searchQuery
              ? 'Geen transcripties gevonden'
              : 'Je hebt nog geen transcripties'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTranscriptions.map((transcription) => (
            <div
              key={transcription.id}
              className="glass rounded-xl p-6 border border-surface-800 hover:border-primary-500/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-semibold text-surface-100">
                  {transcription.title}
                </h3>
                <button
                  onClick={() => {
                    if (confirm('Weet je zeker dat je deze transcriptie wilt verwijderen?')) {
                      deleteTranscription(transcription.id);
                    }
                  }}
                  className="text-surface-500 hover:text-danger-400 transition-colors"
                >
                  🗑️
                </button>
              </div>

              <p className="text-sm text-surface-400 line-clamp-3 mb-4">
                {transcription.transcript_text}
              </p>

              <div className="flex items-center justify-between text-xs text-surface-500">
                <span>
                  {new Date(transcription.created_at).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                {transcription.audio_duration_seconds && (
                  <span>
                    {Math.floor(transcription.audio_duration_seconds / 60)}m{' '}
                    {transcription.audio_duration_seconds % 60}s
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Example: App.tsx Integration
 *
 * This shows how to wrap your App component with AuthProvider.
 * Update your index.tsx file:
 */
/*
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import './src/styles/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
*/

export { EnhancedRecorder, TranscriptionsHistory };
