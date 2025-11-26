import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTranscriptions } from '../hooks/useTranscriptions';
import { Transcription } from '../types/database';
import ReactMarkdown from 'react-markdown';

// Icons
const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
  </svg>
);

const ChevronUpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
  </svg>
);

const DocumentIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

interface TranscriptionCardProps {
  transcription: Transcription;
  onDelete: (id: string) => void;
}

const TranscriptionCard: React.FC<TranscriptionCardProps> = ({ transcription, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete(transcription.id);
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="card-hover">
      {/* Header */}
      <div
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <DocumentIcon />
          </div>
          <div className="min-w-0">
            <h3 className="font-medium text-white truncate">{transcription.title}</h3>
            <p className="text-xs text-surface-500">{formatDate(transcription.created_at)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className={`p-2 rounded-lg transition-colors ${
              confirmDelete
                ? 'bg-error-500 text-white'
                : 'text-surface-500 hover:text-error-400 hover:bg-error-500/10'
            }`}
            title={confirmDelete ? 'Klik nogmaals om te verwijderen' : 'Verwijderen'}
          >
            <TrashIcon />
          </button>
          <div className="text-surface-500">
            {expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-surface-700 p-4 max-h-96 overflow-y-auto scrollbar-custom">
          <div className="prose-custom text-sm">
            <ReactMarkdown>{transcription.transcript_text}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { transcriptions, loading, error, deleteTranscription } = useTranscriptions();

  const handleDelete = async (id: string) => {
    try {
      await deleteTranscription(id);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-surface-900">
      {/* Header */}
      <header className="glass border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DocumentIcon />
            <h1 className="font-semibold text-white">Mijn Transcripties</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-surface-400 hidden sm:block">
              {user?.email}
            </span>
            <button
              onClick={signOut}
              className="btn-ghost text-surface-400 hover:text-white"
            >
              <LogOutIcon />
              <span className="hidden sm:inline">Uitloggen</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="mb-8">
          <div className="badge-primary">
            {transcriptions.length} transcriptie{transcriptions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 bg-error-500/10 border border-error-500/30 rounded-lg p-4">
            <p className="text-error-300 text-sm">{error.message}</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        )}

        {/* Empty State */}
        {!loading && transcriptions.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <DocumentIcon />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nog geen transcripties</h3>
            <p className="text-surface-400 mb-6">
              Maak een nieuwe opname om je eerste transcriptie te genereren
            </p>
          </div>
        )}

        {/* Transcriptions List */}
        {!loading && transcriptions.length > 0 && (
          <div className="space-y-4">
            {transcriptions.map((t) => (
              <TranscriptionCard
                key={t.id}
                transcription={t}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
