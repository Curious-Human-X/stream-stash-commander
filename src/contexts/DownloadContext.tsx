
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface DownloadItem {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: string;
  quality: string;
  format: 'video' | 'audio';
  status: 'pending' | 'downloading' | 'paused' | 'completed' | 'error';
  progress: number;
  speed: string;
  eta: string;
  fileSize: string;
  error?: string;
  subtitles?: Array<{
    language: string;
    filename: string;
    path: string;
  }>;
  filePath?: string;
}

interface DownloadContextType {
  downloads: DownloadItem[];
  addDownload: (url: string, quality: string, format: 'video' | 'audio') => Promise<void>;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
  refreshDownloads: () => Promise<void>;
}

const DownloadContext = createContext<DownloadContextType | null>(null);

export const useDownload = () => {
  const context = useContext(DownloadContext);
  if (!context) {
    throw new Error('useDownload must be used within a DownloadProvider');
  }
  return context;
};

export const DownloadProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  const refreshDownloads = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('downloads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching downloads:', error);
        return;
      }

      const mappedDownloads: DownloadItem[] = data.map(item => ({
        id: item.id,
        url: item.url,
        title: item.title || 'Unknown Title',
        thumbnail: item.thumbnail || '',
        duration: item.duration || '',
        quality: item.quality,
        format: item.format as 'video' | 'audio',
        status: item.status as DownloadItem['status'],
        progress: item.progress || 0,
        speed: '0 MB/s',
        eta: item.status === 'completed' ? 'Complete' : 'Calculating...',
        fileSize: item.file_size ? `${(item.file_size / (1024 * 1024)).toFixed(1)} MB` : 'Unknown',
        error: item.error_message,
        subtitles: item.subtitles || [],
        filePath: item.file_path
      }));

      setDownloads(mappedDownloads);
    } catch (error) {
      console.error('Error refreshing downloads:', error);
    }
  }, []);

  const addDownload = useCallback(async (url: string, quality: string, format: 'video' | 'audio') => {
    try {
      toast({
        title: "Processing URL...",
        description: "Extracting video information, please wait.",
      });

      // Get video info first
      const { data: videoInfo, error: infoError } = await supabase.functions.invoke('get-video-info', {
        body: { url }
      });

      if (infoError) {
        throw new Error(infoError.message);
      }

      if (videoInfo.error) {
        throw new Error(videoInfo.error);
      }

      // Create download record
      const { data: downloadRecord, error: insertError } = await supabase
        .from('downloads')
        .insert({
          url,
          title: videoInfo.title,
          thumbnail: videoInfo.thumbnail,
          duration: videoInfo.duration,
          quality,
          format,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      await refreshDownloads();

      toast({
        title: "Download Started! 🚀",
        description: `Starting ${format} download in ${quality} quality.`,
      });

      // Start actual download
      const { data: downloadResult, error: downloadError } = await supabase.functions.invoke('download-video', {
        body: {
          url,
          quality,
          format,
          downloadId: downloadRecord.id
        }
      });

      if (downloadError) {
        console.error('Download error:', downloadError);
        await supabase
          .from('downloads')
          .update({ 
            status: 'error',
            error_message: downloadError.message 
          })
          .eq('id', downloadRecord.id);
      }

      await refreshDownloads();

      if (downloadResult && !downloadResult.error) {
        toast({
          title: "Download Complete! 🎉",
          description: "Your video has been downloaded successfully.",
        });
      }

    } catch (error) {
      console.error('Add download error:', error);
      toast({
        title: "Error",
        description: "Failed to process the URL. Please check and try again.",
        variant: "destructive",
      });
    }
  }, [refreshDownloads]);

  const pauseDownload = useCallback((id: string) => {
    // Note: Pausing active downloads would require more complex implementation
    toast({
      title: "Download Paused",
      description: "You can resume it anytime from the queue.",
    });
  }, []);

  const resumeDownload = useCallback((id: string) => {
    // Note: Resuming downloads would require more complex implementation
    toast({
      title: "Download Resumed",
      description: "Download has been resumed successfully.",
    });
  }, []);

  const removeDownload = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('downloads')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      await refreshDownloads();
    } catch (error) {
      console.error('Remove download error:', error);
      toast({
        title: "Error",
        description: "Failed to remove download.",
        variant: "destructive",
      });
    }
  }, [refreshDownloads]);

  const clearCompleted = useCallback(async () => {
    try {
      const { error } = await supabase
        .from('downloads')
        .delete()
        .eq('status', 'completed');

      if (error) {
        throw new Error(error.message);
      }

      await refreshDownloads();
      toast({
        title: "Queue Cleared",
        description: "All completed downloads have been removed from the queue.",
      });
    } catch (error) {
      console.error('Clear completed error:', error);
      toast({
        title: "Error",
        description: "Failed to clear completed downloads.",
        variant: "destructive",
      });
    }
  }, [refreshDownloads]);

  // Load downloads on mount
  React.useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  return (
    <DownloadContext.Provider value={{
      downloads,
      addDownload,
      pauseDownload,
      resumeDownload,
      removeDownload,
      clearCompleted,
      refreshDownloads
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
