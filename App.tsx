import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useTranscriptions } from './hooks/useTranscriptions';
import Recorder from './components/Recorder';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';

// Icons
const MicrophoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
    <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5zM18 1.5a.75.75 0 01.728.568l.258 1.036c.236.94.97 1.674 1.91 1.91l1.036.258a.75.75 0 010 1.456l-1.036.258c-.94.236-1.674.97-1.91 1.91l-.258 1.036a.75.75 0 01-1.456 0l-.258-1.036a2.625 2.625 0 00-1.91-1.91l-1.036-.258a.75.75 0 010-1.456l1.036-.258a2.625 2.625 0 001.91-1.91l.258-1.036A.75.75 0 0118 1.5z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const FolderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

const LogOutIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
  </svg>
);

type Page = 'recorder' | 'dashboard';

// Main App Content (needs auth context)
const AppContent: React.FC = () => {
  const { user, loading, initialized, signOut } = useAuth();
  const { transcriptions, createTranscription } = useTranscriptions();
  const [currentPage, setCurrentPage] = useState<Page>('recorder');

  // Show loading while initializing
  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show dashboard
  if (currentPage === 'dashboard') {
    return <Dashboard onBack={() => setCurrentPage('recorder')} />;
  }

  // Save transcription handler
  const handleSaveTranscription = async (content: string, durationSeconds?: number) => {
    try {
      const title = content.substring(0, 50) + '...';
      await createTranscription({
        title,
        transcript_text: content,
        audio_duration_seconds: durationSeconds,
      });
    } catch (err) {
      console.error('Failed to save transcription:', err);
    }
  };

  // Main recorder page
  return (
    <div className="min-h-screen bg-surface-900 text-surface-100 font-sans selection:bg-primary-500 selection:text-white">
      {/* Animated background gradient */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-radial from-primary-900/20 via-transparent to-transparent" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-radial from-accent-900/20 via-transparent to-transparent" />
      </div>

      {/* Navbar */}
      <header className="glass border-b border-surface-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-400 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
              <MicrophoneIcon />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gradient">Vergader Notulist</h1>
              <p className="text-xs text-surface-500 -mt-0.5">AI-powered transcriptie</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="badge-primary hidden sm:flex">
              <SparklesIcon />
              <span>Gemini 2.5</span>
            </div>

            {/* My Transcriptions Button */}
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="btn-ghost relative"
            >
              <FolderIcon />
              <span className="hidden sm:inline">Mijn Transcripties</span>
              {transcriptions.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full text-xs flex items-center justify-center">
                  {transcriptions.length}
                </span>
              )}
            </button>

            {/* User Menu */}
            <div className="flex items-center gap-2 pl-2 border-l border-surface-700">
              <span className="text-sm text-surface-400 hidden md:block truncate max-w-32">
                {user.email}
              </span>
              <button onClick={signOut} className="btn-ghost" title="Uitloggen">
                <LogOutIcon />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="relative z-10 pb-20">
        {/* Hero Section */}
        <section className="pt-16 pb-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-surface-800/50 border border-surface-700 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
              <span className="text-sm text-surface-400">Ingelogd als {user.email?.split('@')[0]}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              <span className="text-white">Vergeet nooit meer</span>
              <br />
              <span className="text-gradient-hero">wat er gezegd is</span>
            </h1>

            <p className="text-lg sm:text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
              Neem Teams, Google Meet of Zoom gesprekken op — zelfs met oortjes in —
              en krijg direct een <span className="text-accent-400 font-medium">transcriptie</span> en
              <span className="text-accent-400 font-medium"> samenvatting</span>.
            </p>
          </div>
        </section>

        {/* Features Pills */}
        <section className="px-4 mb-12">
          <div className="max-w-3xl mx-auto flex flex-wrap justify-center gap-3">
            {[
              { icon: '🎤', text: 'Microfoon + Systeemgeluid' },
              { icon: '🔊', text: 'Stereo Spraakherkenning' },
              { icon: '📝', text: 'Auto Samenvatting' },
              { icon: '💾', text: 'Automatisch Opslaan' },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-surface-800/50 border border-surface-700/50 rounded-full px-4 py-2 text-sm"
              >
                <span>{feature.icon}</span>
                <span className="text-surface-300">{feature.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Main Recorder Component */}
        <Recorder onSave={handleSaveTranscription} />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-surface-800 py-3 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-surface-500">
          <span>© 2024 Vergader Notulist AI</span>
          <div className="flex items-center gap-4">
            <a
              href="mailto:rick@primautomation.com?subject=Feedback%20Vergader%20Notulist&body=Beschrijf%20hier%20je%20feedback%20of%20suggestie%3A%0A%0A"
              className="flex items-center gap-1.5 hover:text-primary-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
              </svg>
              Feedback
            </a>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
              Je transcripties worden veilig opgeslagen
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Root App with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
