import React from 'react';
import Recorder from './components/Recorder';

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white pb-20">
      
      {/* Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-sky-400 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 9.364c.385.154.794.279 1.214.366.883.185 1.782.182 2.658-.052a22.39 22.39 0 005.15-2.003.75.75 0 01.75 1.3 23.903 23.903 0 01-5.617 2.183c-1.423.38-2.935.267-4.288-.236a6.75 6.75 0 01-6.17-8.561V11.25a.75.75 0 01.75-.75z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-sky-200">
                    Vergader Notulist AI
                </h1>
            </div>
            <div className="text-xs font-mono text-slate-500 hidden sm:block">
                Powered by Gemini 2.5 Flash
            </div>
        </div>
      </header>

      <main className="pt-10">
        <div className="text-center mb-10 px-4">
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white mb-4">
                Vergeet nooit meer wat er gezegd is.
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                Neem Teams, Google Meet of Zoom gesprekken op — zelfs met oortjes in — en krijg direct een transcriptie en samenvatting.
            </p>
        </div>
        
        <Recorder />
      </main>

    </div>
  );
}

export default App;