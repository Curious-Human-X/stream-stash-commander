
import React from 'react';
import { Button } from '@/components/ui/button';
import { useDownload } from '@/contexts/DownloadContext';
import { QueueItem } from '@/components/QueueItem';
import { Trash2, Download } from 'lucide-react';

export const DownloadQueue: React.FC = () => {
  const { downloads, clearCompleted } = useDownload();

  const activeDownloads = downloads.filter(d => d.status === 'downloading' || d.status === 'paused');
  const completedDownloads = downloads.filter(d => d.status === 'completed');
  const pendingDownloads = downloads.filter(d => d.status === 'pending');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Download Queue
            </h2>
          </div>
          {completedDownloads.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearCompleted}
              className="text-xs"
            >
              <Trash2 className="mr-1 h-3 w-3" />
              Clear Completed
            </Button>
          )}
        </div>
        
        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
              {activeDownloads.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div className="text-lg font-semibold text-green-600 dark:text-green-400">
              {completedDownloads.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Completed</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
              {pendingDownloads.length}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Pending</div>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-auto p-6">
        {downloads.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Download className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No downloads yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add a video URL to start downloading
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {downloads.map((download) => (
              <QueueItem key={download.id} download={download} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
