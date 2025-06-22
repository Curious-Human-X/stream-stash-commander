
import React, { createContext, useContext, useState, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';

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
}

interface DownloadContextType {
  downloads: DownloadItem[];
  addDownload: (url: string, quality: string, format: 'video' | 'audio') => Promise<void>;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  clearCompleted: () => void;
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

  // Simulate video info extraction
  const extractVideoInfo = async (url: string): Promise<Partial<DownloadItem>> => {
    // In a real app, this would call a backend API that uses yt-dlp
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const videoId = Math.random().toString(36).substr(2, 9);
    return {
      id: videoId,
      url,
      title: `Video ${videoId}`,
      thumbnail: `https://via.placeholder.com/320x180?text=Video+${videoId}`,
      duration: '5:23',
      fileSize: '45.2 MB'
    };
  };

  // Simulate download progress
  const simulateDownload = (id: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setDownloads(prev => prev.map(item => 
          item.id === id 
            ? { ...item, status: 'completed' as const, progress: 100, speed: '0 MB/s', eta: 'Complete' }
            : item
        ));
        toast({
          title: "Download Complete! 🎉",
          description: "Your video has been downloaded successfully.",
        });
        return;
      }

      const speed = (Math.random() * 5 + 1).toFixed(1);
      const eta = Math.ceil((100 - progress) / 10);
      
      setDownloads(prev => prev.map(item => 
        item.id === id 
          ? { 
              ...item, 
              progress: Math.floor(progress),
              speed: `${speed} MB/s`,
              eta: `${eta}s`
            }
          : item
      ));
    }, 500);

    return interval;
  };

  const addDownload = useCallback(async (url: string, quality: string, format: 'video' | 'audio') => {
    try {
      toast({
        title: "Processing URL...",
        description: "Extracting video information, please wait.",
      });

      const videoInfo = await extractVideoInfo(url);
      const newDownload: DownloadItem = {
        ...videoInfo,
        quality,
        format,
        status: 'downloading',
        progress: 0,
        speed: '0 MB/s',
        eta: 'Calculating...'
      } as DownloadItem;

      setDownloads(prev => [newDownload, ...prev]);
      
      toast({
        title: "Download Started! 🚀",
        description: `Starting ${format} download in ${quality} quality.`,
      });

      // Start simulated download
      simulateDownload(newDownload.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process the URL. Please check and try again.",
        variant: "destructive",
      });
    }
  }, []);

  const pauseDownload = useCallback((id: string) => {
    setDownloads(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'paused' as const, speed: '0 MB/s' } : item
    ));
    toast({
      title: "Download Paused",
      description: "You can resume it anytime from the queue.",
    });
  }, []);

  const resumeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'downloading' as const } : item
    ));
    simulateDownload(id);
    toast({
      title: "Download Resumed",
      description: "Download has been resumed successfully.",
    });
  }, []);

  const removeDownload = useCallback((id: string) => {
    setDownloads(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearCompleted = useCallback(() => {
    setDownloads(prev => prev.filter(item => item.status !== 'completed'));
    toast({
      title: "Queue Cleared",
      description: "All completed downloads have been removed from the queue.",
    });
  }, []);

  return (
    <DownloadContext.Provider value={{
      downloads,
      addDownload,
      pauseDownload,
      resumeDownload,
      removeDownload,
      clearCompleted
    }}>
      {children}
    </DownloadContext.Provider>
  );
};
