
import React, { useState } from 'react';
import { VideoDownloader } from '@/components/VideoDownloader';
import { DownloadQueue } from '@/components/DownloadQueue';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DownloadProvider } from '@/contexts/DownloadContext';
import { Download, Youtube } from 'lucide-react';

const Index = () => {
  return (
    <DownloadProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* Header */}
        <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                <Youtube className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  StreamStash
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Professional Video Downloader
                </p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Download Input Section */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-6">
                  <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Download Video
                  </h2>
                </div>
                <VideoDownloader />
              </div>

              {/* Features Section */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  ✨ Features
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    4K Quality Downloads
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Playlist Support
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Audio Only Mode
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Pause & Resume
                  </div>
                </div>
              </div>
            </div>

            {/* Download Queue Section */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
              <DownloadQueue />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-16 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-6 text-center text-gray-600 dark:text-gray-400">
            <p>© 2024 StreamStash - Professional Video Downloader</p>
          </div>
        </footer>
      </div>
    </DownloadProvider>
  );
};

export default Index;
