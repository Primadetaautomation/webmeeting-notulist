# Authentication Setup Guide

This guide explains how to integrate the new authentication system into the Vergader Notulist AI app.

## Files Created

1. **`/types/database.ts`** - TypeScript types for database models
2. **`/contexts/AuthContext.tsx`** - Authentication context provider
3. **`/hooks/useTranscriptions.ts`** - Hook for transcription CRUD operations

## Setup Instructions

### 1. Wrap App with AuthProvider

Update `/index.tsx` to wrap your app with the AuthProvider:

```tsx
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
```

### 2. Configure Supabase Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Get these values from your Supabase project dashboard.

### 3. Set Up Database Tables

Run these SQL commands in your Supabase SQL Editor:

#### Profiles Table

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Transcriptions Table

```sql
-- Create transcriptions table
CREATE TABLE IF NOT EXISTS transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  summary TEXT,
  action_items JSONB,
  audio_duration_seconds INTEGER,
  language TEXT DEFAULT 'nl',
  status TEXT DEFAULT 'completed' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_transcriptions_status ON transcriptions(status);

-- Enable RLS
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own transcriptions"
  ON transcriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transcriptions"
  ON transcriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transcriptions"
  ON transcriptions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transcriptions"
  ON transcriptions FOR DELETE
  USING (auth.uid() = user_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4. Configure Google OAuth (Optional)

If you want to support Google sign-in:

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URLs:
   - Development: `http://localhost:5173/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

## Usage Examples

### Using Authentication

```tsx
import { useAuth } from './contexts/AuthContext';

function LoginPage() {
  const { signInWithGoogle, signInWithEmail, loading, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await signInWithEmail(email, password);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (user) {
    return <div>Welcome {user.email}!</div>;
  }

  return (
    <div>
      <button onClick={signInWithGoogle} disabled={loading}>
        Sign in with Google
      </button>

      <form onSubmit={handleEmailLogin}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit" disabled={loading}>
          Sign in with Email
        </button>
      </form>
    </div>
  );
}
```

### Using Transcriptions Hook

```tsx
import { useTranscriptions } from './hooks/useTranscriptions';
import { useEffect } from 'react';

function TranscriptionsList() {
  const {
    transcriptions,
    loading,
    error,
    fetchTranscriptions,
    createTranscription,
    deleteTranscription
  } = useTranscriptions();

  useEffect(() => {
    fetchTranscriptions();
  }, [fetchTranscriptions]);

  const handleSaveTranscription = async (text: string) => {
    try {
      await createTranscription({
        title: `Vergadering ${new Date().toLocaleDateString('nl-NL')}`,
        transcript_text: text,
        audio_duration_seconds: 120,
        language: 'nl'
      });
    } catch (error) {
      console.error('Failed to save transcription:', error);
    }
  };

  if (loading) {
    return <div>Loading transcriptions...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Your Transcriptions</h2>
      <ul>
        {transcriptions.map((t) => (
          <li key={t.id}>
            <h3>{t.title}</h3>
            <p>{t.transcript_text.substring(0, 100)}...</p>
            <button onClick={() => deleteTranscription(t.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### Protected Routes

```tsx
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, initialized } = useAuth();

  // Wait for auth to initialize
  if (!initialized || loading) {
    return <div>Loading...</div>;
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Usage
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

### Handling Auth State

```tsx
function NavBar() {
  const { user, signOut } = useAuth();

  return (
    <nav>
      {user ? (
        <>
          <span>Welcome, {user.email}</span>
          <button onClick={signOut}>Sign Out</button>
        </>
      ) : (
        <a href="/login">Sign In</a>
      )}
    </nav>
  );
}
```

## Features

### AuthContext Features

- Google OAuth authentication
- Email/password authentication
- Email/password registration
- Session persistence
- Automatic token refresh
- Loading states
- Comprehensive error handling
- TypeScript support

### useTranscriptions Features

- Fetch all user transcriptions
- Get single transcription
- Create new transcription
- Update existing transcription
- Delete transcription
- Optimistic UI updates
- Automatic refetch
- Pagination support
- Search and filtering
- Error handling

## Error Handling

All authentication and database operations throw custom error types:

```tsx
import { AuthError, DatabaseError } from './types/database';

try {
  await signInWithEmail(email, password);
} catch (error) {
  if (error instanceof AuthError) {
    console.error('Auth error:', error.message, error.code);
  } else if (error instanceof DatabaseError) {
    console.error('Database error:', error.message);
  }
}
```

## Security Best Practices

1. **Never expose Supabase service key** - Only use anon key in frontend
2. **Use Row Level Security (RLS)** - All tables have RLS enabled
3. **Validate inputs** - All hooks validate inputs before database calls
4. **Handle errors gracefully** - Never expose sensitive error details to users
5. **Use HTTPS** - Always use HTTPS in production
6. **Sanitize user input** - Prevent XSS attacks

## TypeScript Types

All types are exported from `/types/database.ts`:

```tsx
import type {
  User,
  UserProfile,
  Transcription,
  CreateTranscriptionInput,
  UpdateTranscriptionInput,
  TranscriptionStatus,
  ActionItem,
  DatabaseError,
  AuthError
} from './types/database';
```

## Testing

Test authentication flows:

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { useAuth } from './contexts/AuthContext';
import { AuthProvider } from './contexts/AuthContext';

describe('useAuth', () => {
  it('should initialize with null user', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('should sign in with email', async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.signInWithEmail('test@example.com', 'password123');
    });

    await waitFor(() => {
      expect(result.current.user).not.toBeNull();
    });
  });
});
```

## Troubleshooting

### "Supabase niet geconfigureerd" Error

Make sure your `.env` file contains valid Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Restart your dev server after adding environment variables.

### RLS Policy Errors

If you get "new row violates row-level security policy" errors:

1. Check that RLS policies are created correctly
2. Verify `auth.uid()` matches the user_id in your query
3. Check Supabase logs for detailed error messages

### OAuth Redirect Issues

For Google OAuth:

1. Add redirect URLs in Google Cloud Console
2. Match the redirect URL in Supabase settings
3. Test with exact domain (no trailing slashes)

## Next Steps

1. Create login/signup UI components
2. Add password reset functionality
3. Implement email verification flow
4. Add profile settings page
5. Create transcription detail view
6. Add export functionality (PDF, JSON, etc.)
7. Implement real-time subscriptions for transcription updates

## Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [React Context Best Practices](https://react.dev/reference/react/useContext)
- [TypeScript Type Checking](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html)
