
-- Create a table to store download history and metadata
CREATE TABLE public.downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  url TEXT NOT NULL,
  title TEXT,
  thumbnail TEXT,
  duration TEXT,
  quality TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('video', 'audio')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'downloading', 'completed', 'error', 'paused')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  file_path TEXT,
  file_size BIGINT,
  subtitles JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.downloads ENABLE ROW LEVEL SECURITY;

-- Create policies for downloads table
CREATE POLICY "Users can view their own downloads" 
  ON public.downloads 
  FOR SELECT 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create downloads" 
  ON public.downloads 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own downloads" 
  ON public.downloads 
  FOR UPDATE 
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own downloads" 
  ON public.downloads 
  FOR DELETE 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Create storage bucket for downloaded files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('downloads', 'downloads', true);

-- Create storage policies
CREATE POLICY "Anyone can view downloaded files" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'downloads');

CREATE POLICY "Anyone can upload downloaded files" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'downloads');

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_downloads_updated_at 
  BEFORE UPDATE ON public.downloads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
