
import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useDownload, DownloadItem } from '@/contexts/DownloadContext';
import { Play, Pause, Trash2, Download, Music, Video, AlertCircle, CheckCircle, Subtitles, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QueueItemProps {
  download: DownloadItem;
}

export const QueueItem: React.FC<QueueItemProps> = ({ download }) => {
  const { pauseDownload, resumeDownload, removeDownload } = useDownload();

  const getStatusIcon = () => {
    switch (download.status) {
      case 'downloading':
        return <Download className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Pause className="h-4 w-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Download className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (download.status) {
      case 'downloading':
        return 'text-blue-600 dark:text-blue-400';
      case 'paused':
        return 'text-orange-600 dark:text-orange-400';
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const handleDownloadFile = async () => {
    if (!download.filePath) return;

    try {
      const { data } = supabase.storage
        .from('downloads')
        .getPublicUrl(download.filePath);
      
      if (data.publicUrl) {
        window.open(data.publicUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0">
          <div className="w-20 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
            {download.thumbnail && (
              <img 
                src={download.thumbnail} 
                alt={download.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              {download.format === 'audio' ? (
                <Music className="h-6 w-6 text-purple-500" />
              ) : (
                <Video className="h-6 w-6 text-blue-500" />
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title and Status */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {download.title}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                {getStatusIcon()}
                <span className={`text-xs font-medium capitalize ${getStatusColor()}`}>
                  {download.status}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {download.quality} • {download.format === 'audio' ? 'MP3' : 'MP4'}
                </span>
                {download.subtitles && download.subtitles.length > 0 && (
                  <>
                    <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                    <div className="flex items-center gap-1">
                      <Subtitles className="h-3 w-3 text-purple-500" />
                      <span className="text-xs text-purple-600 dark:text-purple-400">
                        {download.subtitles.length} subtitles
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 ml-2">
              {download.status === 'completed' && download.filePath && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownloadFile}
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
              )}
              {download.status === 'downloading' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => pauseDownload(download.id)}
                  className="h-8 w-8 p-0"
                >
                  <Pause className="h-3 w-3" />
                </Button>
              )}
              {download.status === 'paused' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resumeDownload(download.id)}
                  className="h-8 w-8 p-0"
                >
                  <Play className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeDownload(download.id)}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          {(download.status === 'downloading' || download.status === 'paused') && (
            <div className="mb-2">
              <Progress value={download.progress} className="h-2" />
            </div>
          )}

          {/* Download Info */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>{download.fileSize}</span>
              <span>{download.duration}</span>
              {download.status === 'downloading' && (
                <>
                  <span>{download.speed}</span>
                  <span>ETA: {download.eta}</span>
                </>
              )}
            </div>
            {download.status === 'downloading' && (
              <span className="font-medium">{download.progress}%</span>
            )}
          </div>

          {/* Subtitles List */}
          {download.subtitles && download.subtitles.length > 0 && download.status === 'completed' && (
            <div className="mt-2 text-xs">
              <div className="flex flex-wrap gap-1">
                {download.subtitles.map((subtitle, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300"
                  >
                    {subtitle.language}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {download.status === 'error' && download.error && (
            <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
              {download.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
