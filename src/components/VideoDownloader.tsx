
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDownload } from '@/contexts/DownloadContext';
import { Download, Youtube, Subtitles } from 'lucide-react';

export const VideoDownloader: React.FC = () => {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('720p');
  const [audioOnly, setAudioOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { addDownload } = useDownload();

  const handleDownload = async () => {
    if (!url.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      await addDownload(url, quality, audioOnly ? 'audio' : 'video');
      setUrl('');
    } finally {
      setIsLoading(false);
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  return (
    <div className="space-y-6">
      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url" className="text-sm font-medium">
          Video or Playlist URL
        </Label>
        <div className="relative">
          <Input
            id="url"
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="pl-10 h-12 text-base"
          />
          <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
        {url && isYouTubeUrl(url) && (
          <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            ✓ Valid YouTube URL detected
          </p>
        )}
      </div>

      {/* Quality Selection */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Video Quality</Label>
          <Select value={quality} onValueChange={setQuality} disabled={audioOnly}>
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2160p">4K (2160p)</SelectItem>
              <SelectItem value="1440p">2K (1440p)</SelectItem>
              <SelectItem value="1080p">Full HD (1080p)</SelectItem>
              <SelectItem value="720p">HD (720p)</SelectItem>
              <SelectItem value="480p">SD (480p)</SelectItem>
              <SelectItem value="360p">Low (360p)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Format</Label>
          <div className="flex items-center space-x-2 h-10 px-3 rounded-md border border-input bg-background">
            <Switch
              id="audio-only"
              checked={audioOnly}
              onCheckedChange={setAudioOnly}
            />
            <Label htmlFor="audio-only" className="text-sm cursor-pointer">
              Audio Only (MP3)
            </Label>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <Button 
        onClick={handleDownload}
        disabled={!url.trim() || isLoading}
        className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
      >
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? 'Processing...' : 'Download'}
      </Button>

      {/* Enhanced Info Text */}
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <p className="flex items-center gap-1">
          <Subtitles className="h-3 w-3" />
          • Automatically downloads available subtitles
        </p>
        <p>• Supports individual videos and playlists</p>
        <p>• Downloads are processed securely on our servers</p>
        <p>• Audio format: MP3 320kbps | Video format: MP4</p>
        <p>• Files are saved to your downloads folder after processing</p>
      </div>
    </div>
  );
};
