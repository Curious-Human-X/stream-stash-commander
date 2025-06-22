
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { url, quality, format, downloadId } = await req.json()

    console.log('Starting download for:', { url, quality, format, downloadId })

    // Update status to downloading
    await supabase
      .from('downloads')
      .update({ status: 'downloading', progress: 0 })
      .eq('id', downloadId)

    // Prepare yt-dlp command
    const ytdlpArgs = [
      'yt-dlp',
      '--no-playlist',
      '--extract-flat', 'false',
      '--write-info-json',
      '--write-subs',
      '--write-auto-subs',
      '--sub-langs', 'en,es,fr,de,it,pt,ru,ja,ko,zh',
      '--output', `/tmp/downloads/%(title)s.%(ext)s`,
    ]

    if (format === 'audio') {
      ytdlpArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '320K')
    } else {
      ytdlpArgs.push('-f', `best[height<=${quality.replace('p', '')}]`)
    }

    ytdlpArgs.push(url)

    console.log('Executing yt-dlp with args:', ytdlpArgs)

    // Create downloads directory
    await Deno.mkdir('/tmp/downloads', { recursive: true })

    // Execute yt-dlp
    const process = new Deno.Command(ytdlpArgs[0], {
      args: ytdlpArgs.slice(1),
      stdout: 'piped',
      stderr: 'piped',
    })

    const child = process.spawn()
    
    // Read stdout and stderr
    const [stdout, stderr] = await Promise.all([
      child.stdout.getReader().read(),
      child.stderr.getReader().read(),
    ])

    const { success } = await child.status

    if (!success) {
      const errorMessage = new TextDecoder().decode(stderr.value)
      console.error('yt-dlp error:', errorMessage)
      
      await supabase
        .from('downloads')
        .update({ 
          status: 'error', 
          error_message: errorMessage,
          progress: 0
        })
        .eq('id', downloadId)

      return new Response(
        JSON.stringify({ error: 'Download failed', details: errorMessage }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // List downloaded files
    const downloadedFiles = []
    for await (const dirEntry of Deno.readDir('/tmp/downloads')) {
      if (dirEntry.isFile) {
        downloadedFiles.push(dirEntry.name)
      }
    }

    console.log('Downloaded files:', downloadedFiles)

    // Upload files to Supabase Storage
    const uploadedFiles = []
    for (const fileName of downloadedFiles) {
      const filePath = `/tmp/downloads/${fileName}`
      const fileData = await Deno.readFile(filePath)
      
      const { data, error } = await supabase.storage
        .from('downloads')
        .upload(`${downloadId}/${fileName}`, fileData, {
          contentType: fileName.endsWith('.mp4') ? 'video/mp4' : 
                      fileName.endsWith('.mp3') ? 'audio/mpeg' :
                      fileName.endsWith('.vtt') ? 'text/vtt' :
                      fileName.endsWith('.srt') ? 'text/srt' :
                      'application/octet-stream'
        })

      if (error) {
        console.error('Upload error:', error)
      } else {
        uploadedFiles.push({
          name: fileName,
          path: data.path,
          size: fileData.length
        })
        console.log('Uploaded:', fileName)
      }
    }

    // Extract video info from info.json if available
    let videoInfo = {}
    const infoFiles = downloadedFiles.filter(f => f.endsWith('.info.json'))
    if (infoFiles.length > 0) {
      const infoContent = await Deno.readTextFile(`/tmp/downloads/${infoFiles[0]}`)
      videoInfo = JSON.parse(infoContent)
    }

    // Extract subtitle files
    const subtitleFiles = downloadedFiles.filter(f => 
      f.endsWith('.vtt') || f.endsWith('.srt')
    ).map(f => ({
      language: f.split('.').slice(-2)[0],
      filename: f,
      path: `${downloadId}/${f}`
    }))

    // Update download record with completion
    await supabase
      .from('downloads')
      .update({
        status: 'completed',
        progress: 100,
        title: videoInfo.title || 'Downloaded Video',
        duration: videoInfo.duration_string || '',
        file_size: uploadedFiles.reduce((sum, file) => sum + file.size, 0),
        file_path: uploadedFiles.find(f => f.name.endsWith('.mp4') || f.name.endsWith('.mp3'))?.path,
        subtitles: subtitleFiles
      })
      .eq('id', downloadId)

    // Clean up temporary files
    for (const fileName of downloadedFiles) {
      try {
        await Deno.remove(`/tmp/downloads/${fileName}`)
      } catch (e) {
        console.warn('Could not remove temp file:', fileName, e)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        files: uploadedFiles,
        subtitles: subtitleFiles,
        videoInfo: {
          title: videoInfo.title,
          duration: videoInfo.duration_string
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Download error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
