import React from 'react';
import Recorder from './components/Recorder';

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

function App() {
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
              <h1 className="text-lg font-bold text-gradient">
                Vergader Notulist
              </h1>
              <p className="text-xs text-surface-500 -mt-0.5">AI-powered transcriptie</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="badge-primary">
              <SparklesIcon />
              <span>Gemini 2.5</span>
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
              <span className="text-sm text-surface-400">Nu met stereo spraakherkenning</span>
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
              { icon: '✅', text: 'Actiepunten Extractie' },
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
        <Recorder />
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 glass border-t border-surface-800 py-3 z-40">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between text-xs text-surface-500">
          <span>© 2024 Vergader Notulist AI</span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-success-500 rounded-full" />
            Privacy-first — audio wordt niet opgeslagen
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
