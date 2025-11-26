# Quick Start Guide - Authentication

Get up and running with authentication in 5 minutes.

## 1. Environment Setup (1 minute)

Create `.env` file:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 2. Database Setup (2 minutes)

Copy and run this SQL in Supabase SQL Editor:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Transcriptions table
CREATE TABLE transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript_text TEXT NOT NULL,
  summary TEXT,
  action_items JSONB,
  audio_duration_seconds INTEGER,
  language TEXT DEFAULT 'nl',
  status TEXT DEFAULT 'completed',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own transcriptions" ON transcriptions FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
```

## 3. Wrap App (1 minute)

Update `/index.tsx`:

```tsx
import { AuthProvider } from './contexts/AuthContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
```

## 4. Use in Components (1 minute)

```tsx
import { useAuth } from './contexts/AuthContext';
import { useTranscriptions } from './hooks/useTranscriptions';

function MyComponent() {
  const { user, signInWithGoogle } = useAuth();
  const { transcriptions, createTranscription } = useTranscriptions();

  if (!user) {
    return <button onClick={signInWithGoogle}>Login</button>;
  }

  return <div>Welcome {user.email}!</div>;
}
```

## Common Use Cases

### Save Transcription After Recording
```tsx
const { createTranscription } = useTranscriptions();

await createTranscription({
  title: 'Meeting Title',
  transcript_text: 'Transcription text here...',
  audio_duration_seconds: 120
});
```

### Display User's Transcriptions
```tsx
const { transcriptions, loading } = useTranscriptions();

if (loading) return <div>Loading...</div>;

return (
  <ul>
    {transcriptions.map(t => (
      <li key={t.id}>{t.title}</li>
    ))}
  </ul>
);
```

### Delete Transcription
```tsx
const { deleteTranscription } = useTranscriptions();

<button onClick={() => deleteTranscription(id)}>
  Delete
</button>
```

## Next Steps

- See `AUTH_SETUP.md` for complete documentation
- See `INTEGRATION_EXAMPLE.tsx` for working examples
- See `AUTH_IMPLEMENTATION_SUMMARY.md` for architecture details

## Files Overview

- `/types/database.ts` - TypeScript types
- `/contexts/AuthContext.tsx` - Auth provider & hook
- `/hooks/useTranscriptions.ts` - Transcription CRUD hook

## Need Help?

1. Check environment variables are correct
2. Verify database tables are created
3. Check Supabase logs for errors
4. See troubleshooting in `AUTH_SETUP.md`
