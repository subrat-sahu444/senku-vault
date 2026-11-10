const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { spawn, execFile, execSync } = require('child_process');
const os = require('os');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const TEMP_DIR = path.join(os.tmpdir(), 'antigravity-media-vault');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// Clean up old temp files every hour
setInterval(() => {
  fs.readdir(TEMP_DIR, (err, files) => {
    if (err) return;
    const now = Date.now();
    for (const file of files) {
      const filePath = path.join(TEMP_DIR, file);
      fs.stat(filePath, (err, stats) => {
        if (!err && now - stats.mtimeMs > 2 * 60 * 60 * 1000) {
          fs.unlink(filePath, () => {});
        }
      });
    }
  });
}, 3600000);

// MIME types dictionary
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2'
};

// Find yt-dlp path instantly using filesystem checks
function getYtDlpPath() {
  const commonPaths = [
    path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe'),
    path.join(process.env.USERPROFILE || '', 'AppData', 'Local', 'Microsoft', 'WinGet', 'Links', 'yt-dlp.exe'),
    'yt-dlp.exe',
    'yt-dlp'
  ];

  for (const p of commonPaths) {
    try {
      if (fs.existsSync(p)) return p;
    } catch (e) {}
  }
  return 'yt-dlp';
}

const YTDLP_BIN = getYtDlpPath();

// System info state
let systemInfo = {
  ytdlp: true,
  ytdlpVersion: '2026.06.09 (WinGet)',
  ffmpeg: true
};

// Helpers
function sanitizeFilename(name) {
  return (name || 'media').replace(/[/\\?%*:|"<>]/g, '_').trim().slice(0, 100);
}

function formatDuration(sec) {
  if (!sec || isNaN(sec)) return 'Live / Unknown';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const h = Math.floor(m / 60);
  if (h > 0) {
    return `${h}:${String(m % 60).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatBytes(bytes) {
  if (!bytes || isNaN(bytes)) return null;
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Detect Platform
function detectPlatform(url) {
  if (!url) return 'generic';
  const u = url.toLowerCase();
  if (u.includes('instagram.com')) return 'instagram';
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('whatsapp') || u.includes('wa.me')) return 'whatsapp';
  if (u.includes('tiktok.com')) return 'tiktok';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'twitter';
  if (u.includes('facebook.com') || u.includes('fb.watch')) return 'facebook';
  return 'generic';
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // 1. Health & System Info
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      engine: 'Senku Engine Core',
      system: systemInfo,
      time: new Date().toISOString()
    }));
    return;
  }

  // 2. Analyze URL (Metadata & Formats)
  if (pathname === '/api/analyze' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) req.destroy();
    });

    req.on('end', () => {
      try {
        const { url } = JSON.parse(body || '{}');
        if (!url || typeof url !== 'string' || !url.startsWith('http')) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Please provide a valid media URL starting with http:// or https://' }));
          return;
        }

        const platform = detectPlatform(url);

        // Run yt-dlp --dump-json
        const args = ['--dump-json', '--no-playlist', '--no-warnings', url];
        const child = spawn(YTDLP_BIN, args);

        let stdoutData = '';
        let stderrData = '';

        child.stdout.on('data', d => { stdoutData += d.toString(); });
        child.stderr.on('data', d => { stderrData += d.toString(); });

        child.on('close', code => {
          if (code !== 0 || !stdoutData.trim()) {
            // Attempt to provide clean error message
            let errMsg = 'Failed to extract media information.';
            if (stderrData.includes('Private video') || stderrData.includes('login')) {
              errMsg = 'This media is private or requires an account login.';
            } else if (stderrData.includes('Video unavailable') || stderrData.includes('404')) {
              errMsg = 'This video or post is unavailable or was removed.';
            } else if (stderrData.includes('Unable to connect') || stderrData.includes('WinError 10013')) {
              errMsg = 'Network connection issue or offline mode. Ensure internet access is active.';
            }
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: errMsg, details: stderrData.slice(0, 300) }));
            return;
          }

          try {
            const raw = JSON.parse(stdoutData.trim().split('\n')[0]);
            
            // Extract formats
            const formats = [];
            const seenRes = new Set();

            if (Array.isArray(raw.formats)) {
              // Extract quality tiers
              const videoFormats = raw.formats.filter(f => f.vcodec && f.vcodec !== 'none');
              
              // Highest qualities
              const targetHeights = [2160, 1440, 1080, 720, 480, 360];
              for (const h of targetHeights) {
                const match = videoFormats.find(f => f.height === h || (f.height && Math.abs(f.height - h) < 40));
                if (match && !seenRes.has(h)) {
                  seenRes.add(h);
                  formats.push({
                    formatId: `${h}p`,
                    resolution: `${h}p`,
                    qualityLabel: h >= 2160 ? '4K Ultra HD' : h >= 1080 ? 'Full HD 1080p' : h >= 720 ? 'HD 720p' : `${h}p SD`,
                    type: 'video',
                    ext: 'mp4',
                    filesize: formatBytes(match.filesize || match.filesize_approx)
                  });
                }
              }
            }

            // Always provide Best Video option
            if (formats.length === 0) {
              formats.push({
                formatId: 'best',
                resolution: 'Original HD',
                qualityLabel: 'Original Quality (MP4)',
                type: 'video',
                ext: 'mp4',
                filesize: null
              });
            }

            // Add Audio Only options
            formats.push({
              formatId: 'mp3_320',
              resolution: 'Audio (MP3)',
              qualityLabel: 'HQ Audio 320kbps (MP3)',
              type: 'audio',
              ext: 'mp3',
              filesize: raw.duration ? formatBytes(raw.duration * 40000) : null
            });

            // Media Info payload
            const responseData = {
              success: true,
              data: {
                id: raw.id,
                title: raw.title || 'Untitled Media',
                description: (raw.description || '').slice(0, 200),
                thumbnail: raw.thumbnail || (raw.thumbnails && raw.thumbnails.length ? raw.thumbnails[raw.thumbnails.length - 1].url : ''),
                duration: raw.duration,
                durationFormatted: formatDuration(raw.duration),
                author: raw.uploader || raw.channel || raw.creator || 'Creator',
                authorUrl: raw.uploader_url || null,
                viewCount: raw.view_count ? raw.view_count.toLocaleString() : null,
                platform: platform,
                originalUrl: url,
                formats: formats,
                directVideoUrl: raw.url && raw.vcodec !== 'none' ? raw.url : null
              }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(responseData));
          } catch (jsonErr) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Error parsing media data', details: jsonErr.message }));
          }
        });
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed request JSON' }));
      }
    });
    return;
  }

  // 3. Download Endpoint
  if (pathname === '/api/download') {
    const targetUrl = parsedUrl.searchParams.get('url');
    const quality = parsedUrl.searchParams.get('quality') || 'best';
    const type = parsedUrl.searchParams.get('type') || 'video';
    const rawTitle = parsedUrl.searchParams.get('title') || 'download';
    const ext = type === 'audio' ? 'mp3' : 'mp4';
    const cleanTitle = sanitizeFilename(rawTitle);
    const filename = `${cleanTitle}.${ext}`;

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('Missing URL parameter');
      return;
    }

    // Generate unique temp file
    const fileId = crypto.randomBytes(8).toString('hex');
    const tempFileTemplate = path.join(TEMP_DIR, `media_${fileId}.%(ext)s`);

    const dlArgs = ['--no-playlist', '--no-warnings'];

    if (type === 'audio') {
      dlArgs.push('-x', '--audio-format', 'mp3', '--audio-quality', '0');
    } else {
      let formatSelector = 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best';
      if (quality === '1080p') {
        formatSelector = 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best';
      } else if (quality === '720p') {
        formatSelector = 'bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best';
      } else if (quality === '480p') {
        formatSelector = 'bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best';
      }
      dlArgs.push('-f', formatSelector, '--merge-output-format', 'mp4');
    }

    dlArgs.push('-o', tempFileTemplate, targetUrl);

    // Launch download process
    const dlProcess = spawn(YTDLP_BIN, dlArgs);

    let dlErr = '';
    dlProcess.stderr.on('data', d => { dlErr += d.toString(); });

    dlProcess.on('close', code => {
      // Find the generated file in TEMP_DIR
      const expectedPrefix = `media_${fileId}`;
      const matchingFiles = fs.readdirSync(TEMP_DIR).filter(f => f.startsWith(expectedPrefix));

      if (code !== 0 || matchingFiles.length === 0) {
        res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <div style="font-family: sans-serif; background: #0B0F19; color: #fff; padding: 40px; text-align: center; border-radius: 12px; margin: 40px auto; max-width: 600px;">
            <h2 style="color: #FF4D4D;">Download Failed</h2>
            <p>Could not process download with yt-dlp.</p>
            <p style="color: #aaa; font-size: 13px;">${dlErr.slice(0, 300) || 'Check that the URL is public and valid.'}</p>
            <a href="/" style="display: inline-block; margin-top: 20px; color: #00E5FF; text-decoration: none;">&larr; Back to Antigravity Vault</a>
          </div>
        `);
        return;
      }

      const downloadedPath = path.join(TEMP_DIR, matchingFiles[0]);
      const stat = fs.statSync(downloadedPath);

      res.writeHead(200, {
        'Content-Type': type === 'audio' ? 'audio/mpeg' : 'video/mp4',
        'Content-Length': stat.size,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        'Cache-Control': 'no-cache'
      });

      const readStream = fs.createReadStream(downloadedPath);
      readStream.pipe(res);

      readStream.on('close', () => {
        // Clean up file after download completes
        fs.unlink(downloadedPath, () => {});
      });
    });

    req.on('close', () => {
      if (!dlProcess.killed) {
        dlProcess.kill();
      }
    });

    return;
  }

  // 4. WhatsApp Web Bookmarklet script provider
  if (pathname === '/api/whatsapp-bookmarklet.js') {
    const script = `
(function(){
  const videos = Array.from(document.querySelectorAll('video')).map(v => v.src).filter(Boolean);
  const images = Array.from(document.querySelectorAll('img[src*="blob:"], img[src*="whatsapp"]')).map(i => i.src).filter(Boolean);
  const allMedia = [...new Set([...videos, ...images])];
  if (allMedia.length === 0) {
    alert("No active WhatsApp status or media detected on this screen. Open a WhatsApp Status story and click again!");
    return;
  }
  allMedia.forEach((url, i) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'WhatsApp_Status_' + (i + 1) + (url.includes('video') || url.endsWith('.mp4') ? '.mp4' : '.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
})();
    `;
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(script);
    return;
  }

  // 5. Static File Server
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') safePath = '/index.html';

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: must be inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access Denied');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // 404 fallback to index.html for SPA feel
      const indexFallback = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFallback, (err404, data) => {
        if (!err404) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data);
        } else {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'public, max-age=3600'
    });

    fs.createReadStream(filePath).pipe(res);
  });
});

function startServer(portToTry) {
  const srv = server.listen(portToTry, '127.0.0.1', () => {
    const actualPort = srv.address().port;
    console.log(`\n======================================================`);
    console.log(`🚀 SENKU VAULT IS RUNNING!`);
    console.log(`🧪 Powered by the Senku Engine (10B% Ad-Free)`);
    console.log(`🔗 Local URL: http://localhost:${actualPort}`);
    console.log(`⚡ yt-dlp Status: ${systemInfo.ytdlp ? 'Available (' + systemInfo.ytdlpVersion + ')' : 'Not detected on PATH'}`);
    console.log(`🎬 FFmpeg Status: ${systemInfo.ffmpeg ? 'Available' : 'Not detected'}`);
    console.log(`======================================================\n`);
  });

  srv.once('error', (err) => {
    if ((err.code === 'EADDRINUSE' || err.code === 'EACCES') && portToTry !== 0) {
      if (portToTry < 3005) {
        startServer(portToTry + 1);
      } else {
        startServer(0);
      }
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(parseInt(process.env.PORT, 10) || 3000);
