import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
  </svg>
);

export const LoginPage: React.FC = () => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, loading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Google login mislukt');
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setMessage('Check je email voor de bevestigingslink!');
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden');
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
              <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Vergader Notulist AI</h1>
          <p className="text-surface-400 mt-2">
            {isSignUp ? 'Maak een account aan' : 'Log in om je transcripties te beheren'}
          </p>
        </div>

        {/* Login Card */}
        <div className="card p-8">
          {/* Google Sign In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-50 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            <span>Doorgaan met Google</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-surface-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-800 text-surface-500">of</span>
            </div>
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="naam@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-300 mb-1">
                Wachtwoord
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Minimaal 8 tekens"
                minLength={8}
                required
              />
            </div>

            {error && (
              <div className="bg-error-500/10 border border-error-500/30 rounded-lg p-3">
                <p className="text-error-300 text-sm">{error}</p>
              </div>
            )}

            {message && (
              <div className="bg-success-500/10 border border-success-500/30 rounded-lg p-3">
                <p className="text-success-300 text-sm">{message}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              <MailIcon />
              <span>{isSignUp ? 'Account aanmaken' : 'Inloggen'}</span>
            </button>
          </form>

          {/* Toggle Sign Up / Sign In */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
              className="text-sm text-surface-400 hover:text-white transition-colors"
            >
              {isSignUp ? 'Heb je al een account? Log in' : 'Nog geen account? Registreer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
