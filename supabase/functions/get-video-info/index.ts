
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json()

    console.log('Getting video info for:', url)

    // Use yt-dlp to extract video information
    const process = new Deno.Command('yt-dlp', {
      args: [
        '--no-playlist',
        '--print-json',
        '--no-download',
        url
      ],
      stdout: 'piped',
      stderr: 'piped',
    })

    const child = process.spawn()
    const { success } = await child.status
    
    const [stdout, stderr] = await Promise.all([
      child.stdout.getReader().read(),
      child.stderr.getReader().read(),
    ])

    if (!success) {
      const errorMessage = new TextDecoder().decode(stderr.value)
      console.error('yt-dlp info error:', errorMessage)
      
      return new Response(
        JSON.stringify({ error: 'Could not extract video info', details: errorMessage }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const outputText = new TextDecoder().decode(stdout.value)
    const videoInfo = JSON.parse(outputText)

    const response = {
      title: videoInfo.title || 'Unknown Title',
      thumbnail: videoInfo.thumbnail || '',
      duration: videoInfo.duration_string || videoInfo.duration?.toString() || '',
      fileSize: videoInfo.filesize_approx || 0,
      hasSubtitles: (videoInfo.subtitles && Object.keys(videoInfo.subtitles).length > 0) ||
                   (videoInfo.automatic_captions && Object.keys(videoInfo.automatic_captions).length > 0),
      availableQualities: videoInfo.formats ? 
        [...new Set(videoInfo.formats
          .filter(f => f.height)
          .map(f => `${f.height}p`)
          .sort((a, b) => parseInt(b) - parseInt(a))
        )] : ['720p'],
      subtitleLanguages: videoInfo.subtitles ? Object.keys(videoInfo.subtitles) : [],
      autoSubtitleLanguages: videoInfo.automatic_captions ? Object.keys(videoInfo.automatic_captions) : []
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Video info error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
