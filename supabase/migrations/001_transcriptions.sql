-- Transcriptions table for storing user meeting notes
-- Each user can only see/edit/delete their own transcriptions (RLS)

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

-- Enable Row Level Security
ALTER TABLE transcriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own transcriptions
CREATE POLICY "Users can view own transcriptions"
ON transcriptions FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can only INSERT their own transcriptions
CREATE POLICY "Users can create own transcriptions"
ON transcriptions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own transcriptions
CREATE POLICY "Users can update own transcriptions"
ON transcriptions FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Users can only DELETE their own transcriptions
CREATE POLICY "Users can delete own transcriptions"
ON transcriptions FOR DELETE
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_transcriptions_user_id ON transcriptions(user_id);
CREATE INDEX idx_transcriptions_created_at ON transcriptions(created_at DESC);
CREATE INDEX idx_transcriptions_user_created ON transcriptions(user_id, created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcriptions_updated_at
  BEFORE UPDATE ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-generate title from content if null
CREATE OR REPLACE FUNCTION generate_title()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS NULL OR NEW.title = '' THEN
    NEW.title = SUBSTRING(NEW.content FROM 1 FOR 50) || '...';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transcriptions_auto_title
  BEFORE INSERT ON transcriptions
  FOR EACH ROW
  EXECUTE FUNCTION generate_title();
