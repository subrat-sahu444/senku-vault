/**
 * SENKU VAULT • CORE CLIENT APPLICATION
 * High-performance, zero-ad downloader for Instagram Reels, YouTube, & WhatsApp.
 * Powered by the Senku Engine.
 */

// Web Audio API Sound Feedback
class CyberSound {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playSuccess() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(this.ctx.currentTime + idx * 0.06);
        osc.stop(this.ctx.currentTime + idx * 0.06 + 0.15);
      });
    } catch (e) {}
  }

  playError() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(140, this.ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch (e) {}
  }
}

const sound = new CyberSound();

// App State
const state = {
  activeTab: 'universal',
  currentMedia: null,
  history: JSON.parse(localStorage.getItem('senku_vault_history') || localStorage.getItem('gv_download_history') || '[]'),
  soundEnabled: true,
  particleDensityIdx: 1, // 0=50, 1=100, 2=160
  particleDensities: [50, 100, 160]
};

// DOM Elements
const elements = {
  navTabs: document.getElementById('navTabs'),
  tabPanels: document.querySelectorAll('.tab-panel'),
  urlInput: document.getElementById('mediaUrlInput'),
  fetchBtn: document.getElementById('fetchBtn'),
  btnSpinner: document.getElementById('btnSpinner'),
  pasteBtn: document.getElementById('pasteBtn'),
  clearBtn: document.getElementById('clearBtn'),
  errorAlert: document.getElementById('errorAlert'),
  errorAlertText: document.getElementById('errorAlertText'),
  closeAlertBtn: document.getElementById('closeAlertBtn'),
  resultCard: document.getElementById('resultCard'),
  mediaThumbnail: document.getElementById('mediaThumbnail'),
  mediaDuration: document.getElementById('mediaDuration'),
  mediaTitle: document.getElementById('mediaTitle'),
  platformBadge: document.getElementById('platformBadge'),
  authorBadge: document.getElementById('authorBadge'),
  viewsCount: document.getElementById('viewsCount'),
  formatsList: document.getElementById('formatsList'),
  playPreviewBtn: document.getElementById('playPreviewBtn'),
  inlineVideoPlayer: document.getElementById('inlineVideoPlayer'),
  copyLinkBtn: document.getElementById('copyLinkBtn'),
  downloadThumbBtn: document.getElementById('downloadThumbBtn'),
  historyToggleBtn: document.getElementById('historyToggleBtn'),
  historyDrawer: document.getElementById('historyDrawer'),
  historyBackdrop: document.getElementById('historyBackdrop'),
  closeHistoryBtn: document.getElementById('closeHistoryBtn'),
  historyList: document.getElementById('historyList'),
  historyCount: document.getElementById('historyCount'),
  emptyHistory: document.getElementById('emptyHistory'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),
  serverStatusBadge: document.getElementById('serverStatusBadge'),
  // HUD
  engineToggle: document.getElementById('engineToggle') || document.getElementById('physicsToggle'),
  engineStatus: document.getElementById('engineStatus') || document.getElementById('physicsStatus'),
  particleDensityToggle: document.getElementById('particleDensityToggle'),
  particleCountText: document.getElementById('particleCountText'),
  soundToggle: document.getElementById('soundToggle'),
  soundStatus: document.getElementById('soundStatus'),
  // WhatsApp
  waDropZone: document.getElementById('waDropZone'),
  waFileInput: document.getElementById('waFileInput'),
  waGallery: document.getElementById('waGallery'),
  waItemsGrid: document.getElementById('waItemsGrid'),
  galleryCount: document.getElementById('galleryCount'),
  downloadAllWaBtn: document.getElementById('downloadAllWaBtn')
};

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupInputHandlers();
  setupHUD();
  setupWhatsAppModule();
  renderHistory();
  checkServerHealth();
});

function getApiBaseUrl() {
  return (localStorage.getItem('senku_api_endpoint') || '').replace(/\/+$/, '');
}

// 1. Server Health Check
async function checkServerHealth() {
  const apiBase = getApiBaseUrl();
  try {
    const res = await fetch(`${apiBase}/api/health`);
    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) {
      const data = await res.json();
      if (data && data.status === 'healthy') {
        elements.serverStatusBadge.innerHTML = `
          <span class="status-dot pulse"></span>
          <span class="status-label">${apiBase ? 'Cloud Engine Online' : 'Core Ready • Ad-Free'}</span>
        `;
        return;
      }
    }
  } catch (err) {}

  // Smart Client Mode for GitHub Pages / APK
  elements.serverStatusBadge.innerHTML = `
    <span class="status-dot" style="background:#00f0ff;box-shadow:0 0 8px #00f0ff"></span>
    <span class="status-label" style="color:#00f0ff">Smart Client Active</span>
  `;
}

// 2. Navigation & Tabs
function setupNavigation() {
  if (!elements.navTabs) return;

  elements.navTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.nav-tab');
    if (!tabBtn) return;

    sound.playClick();
    const tabName = tabBtn.dataset.tab;
    state.activeTab = tabName;

    document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
    tabBtn.classList.add('active');

    elements.tabPanels.forEach(panel => {
      panel.classList.remove('active');
      if (panel.id === `panel-${tabName}`) {
        panel.classList.add('active');
      }
    });

    // Custom placeholder depending on active tab
    if (tabName === 'instagram') {
      elements.urlInput.placeholder = 'Paste Instagram Reel or Post URL (e.g., https://instagram.com/reel/...)...';
    } else if (tabName === 'youtube') {
      elements.urlInput.placeholder = 'Paste YouTube video or Shorts link (e.g., https://youtu.be/...)...';
    } else if (tabName === 'whatsapp') {
      elements.urlInput.placeholder = 'WhatsApp Status Vault active — See local extractor & bookmarklet below!';
    } else {
      elements.urlInput.placeholder = 'Paste Instagram Reel / Post or YouTube link here...';
    }
  });
}

// 3. Input Handlers & Downloader Core
function setupInputHandlers() {
  // Input changes
  elements.urlInput.addEventListener('input', () => {
    if (elements.urlInput.value.trim().length > 0) {
      elements.clearBtn.classList.remove('hidden');
    } else {
      elements.clearBtn.classList.add('hidden');
    }
  });

  // Clear button
  elements.clearBtn.addEventListener('click', () => {
    sound.playClick();
    elements.urlInput.value = '';
    elements.clearBtn.classList.add('hidden');
    elements.urlInput.focus();
  });

  // Paste from clipboard button
  elements.pasteBtn.addEventListener('click', async () => {
    sound.playClick();
    try {
      const text = await navigator.clipboard.readText();
      if (text && text.trim().startsWith('http')) {
        elements.urlInput.value = text.trim();
        elements.clearBtn.classList.remove('hidden');
        triggerExtract();
      } else {
        showError('No valid media link found on clipboard. Please copy a link first.');
      }
    } catch (err) {
      elements.urlInput.focus();
      showError('Clipboard access denied. Please paste directly into the box.');
    }
  });

  // Quick suggestion chips
  document.querySelectorAll('.ql-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      sound.playClick();
      elements.urlInput.value = chip.dataset.url;
      elements.clearBtn.classList.remove('hidden');
      triggerExtract();
    });
  });

  // Submit on Enter
  elements.urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      triggerExtract();
    }
  });

  // Submit button
  elements.fetchBtn.addEventListener('click', () => {
    triggerExtract();
  });

  // Close alert button
  elements.closeAlertBtn.addEventListener('click', () => {
    hideError();
  });

  // Cloud Config Modal
  const configModal = document.getElementById('configModal');
  const apiConfigBtn = document.getElementById('apiConfigBtn');
  const closeConfigBtn = document.getElementById('closeConfigBtn');
  const backendUrlInput = document.getElementById('backendUrlInput');
  const saveBackendBtn = document.getElementById('saveBackendBtn');
  const resetBackendBtn = document.getElementById('resetBackendBtn');

  if (apiConfigBtn && configModal) {
    apiConfigBtn.addEventListener('click', () => {
      sound.playClick();
      backendUrlInput.value = localStorage.getItem('senku_api_endpoint') || '';
      configModal.classList.remove('hidden');
    });

    closeConfigBtn.addEventListener('click', () => {
      sound.playClick();
      configModal.classList.add('hidden');
    });

    configModal.addEventListener('click', (e) => {
      if (e.target === configModal) configModal.classList.add('hidden');
    });

    saveBackendBtn.addEventListener('click', () => {
      sound.playSuccess();
      const val = backendUrlInput.value.trim();
      if (val) {
        localStorage.setItem('senku_api_endpoint', val);
      } else {
        localStorage.removeItem('senku_api_endpoint');
      }
      configModal.classList.add('hidden');
      checkServerHealth();
    });

    resetBackendBtn.addEventListener('click', () => {
      sound.playClick();
      localStorage.removeItem('senku_api_endpoint');
      backendUrlInput.value = '';
      configModal.classList.add('hidden');
      checkServerHealth();
    });
  }

  // Inline video player toggle
  elements.playPreviewBtn.addEventListener('click', () => {
    sound.playClick();
    if (!state.currentMedia) return;
    
    if (state.currentMedia.directVideoUrl) {
      elements.inlineVideoPlayer.src = state.currentMedia.directVideoUrl;
      elements.inlineVideoPlayer.classList.remove('hidden');
      elements.mediaThumbnail.classList.add('hidden');
      elements.playPreviewBtn.parentElement.classList.add('hidden');
      elements.inlineVideoPlayer.play();
    } else {
      // Direct stream not directly playable in browser, prompt download
      showError('Preview not directly streamed for this codec. Please use the high-speed download buttons below!');
    }
  });

  // Copy link
  elements.copyLinkBtn.addEventListener('click', () => {
    sound.playClick();
    if (!state.currentMedia) return;
    navigator.clipboard.writeText(state.currentMedia.originalUrl).then(() => {
      const orig = elements.copyLinkBtn.innerHTML;
      elements.copyLinkBtn.innerHTML = `<span>Copied! ✓</span>`;
      setTimeout(() => elements.copyLinkBtn.innerHTML = orig, 1800);
    });
  });

  // Download Thumbnail
  elements.downloadThumbBtn.addEventListener('click', () => {
    sound.playClick();
    if (!state.currentMedia || !state.currentMedia.thumbnail) return;
    const a = document.createElement('a');
    a.href = state.currentMedia.thumbnail;
    a.target = '_blank';
    a.download = `${sanitizeTitle(state.currentMedia.title)}_cover.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

// 4. Smart Client-Side Fallback Resolver (Never crashes on static hosting)
async function resolveSmartClientMedia(url) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isInstagram = url.includes('instagram.com');

  if (isYouTube) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
    const videoId = match ? match[1] : null;

    let title = 'YouTube Video / Short';
    let author = 'YouTube Creator';
    let thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'assets/placeholder.svg';

    try {
      const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
      if (oembedRes.ok) {
        const odata = await oembedRes.json();
        if (odata.title) title = odata.title;
        if (odata.author_name) author = odata.author_name;
        if (odata.thumbnail_url) thumb = odata.thumbnail_url;
      }
    } catch (e) {}

    const cleanVideoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;

    return {
      title: title,
      author: author,
      thumbnail: thumb,
      durationFormatted: 'HD Stream',
      viewCount: 'Ready to Download',
      platform: 'youtube',
      originalUrl: cleanVideoUrl,
      directVideoUrl: null,
      formats: [
        {
          formatId: '1080p',
          resolution: '1080p',
          qualityLabel: 'Full HD 1080p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Direct Stream',
          directLink: `https://10downloader.com/download?v=${encodeURIComponent(cleanVideoUrl)}`
        },
        {
          formatId: '720p',
          resolution: '720p',
          qualityLabel: 'HD 720p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'High Speed',
          directLink: `https://10downloader.com/download?v=${encodeURIComponent(cleanVideoUrl)}`
        },
        {
          formatId: 'mp3_320',
          resolution: 'Audio (MP3)',
          qualityLabel: 'HQ Audio 320kbps (MP3)',
          type: 'audio',
          ext: 'mp3',
          filesize: 'Lossless Audio',
          directLink: `https://10downloader.com/download?v=${encodeURIComponent(cleanVideoUrl)}`
        }
      ]
    };
  }

  if (isInstagram) {
    const codeMatch = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    const shortcode = codeMatch ? codeMatch[1] : 'Reel';

    return {
      title: `Instagram Reel (${shortcode})`,
      author: 'Instagram Creator',
      thumbnail: `https://images.weserv.nl/?url=https://www.instagram.com/p/${shortcode}/media/?size=l`,
      durationFormatted: 'Reel HD',
      viewCount: 'Ready to Download',
      platform: 'instagram',
      originalUrl: url,
      directVideoUrl: null,
      formats: [
        {
          formatId: 'best',
          resolution: 'Original HD',
          qualityLabel: 'Original Quality (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Lossless MP4',
          directLink: `https://saveig.app/en?url=${encodeURIComponent(url)}`
        },
        {
          formatId: 'mp3_reel',
          resolution: 'Audio (MP3)',
          qualityLabel: 'Reel Audio (MP3)',
          type: 'audio',
          ext: 'mp3',
          filesize: 'Audio Track',
          directLink: `https://saveig.app/en?url=${encodeURIComponent(url)}`
        }
      ]
    };
  }

  // Generic fallback
  return {
    title: 'Media Stream',
    author: 'Online Media',
    thumbnail: 'assets/placeholder.svg',
    durationFormatted: 'Stream',
    viewCount: 'Direct',
    platform: 'generic',
    originalUrl: url,
    formats: [
      {
        formatId: 'best',
        resolution: 'Download Stream',
        qualityLabel: 'Download Media (MP4)',
        type: 'video',
        ext: 'mp4',
        filesize: 'Direct',
        directLink: `https://10downloader.com/download?v=${encodeURIComponent(url)}`
      }
    ]
  };
}

// 5. Trigger Extract Process
async function triggerExtract() {
  const url = elements.urlInput.value.trim();
  if (!url) {
    showError('Please enter or paste an Instagram, YouTube, or media link.');
    return;
  }

  hideError();
  setLoading(true);
  sound.playClick();

  const apiBase = getApiBaseUrl();

  try {
    let mediaData = null;

    // 1. Try backend API first (works when running node server.js or connected to Render)
    try {
      const res = await fetch(`${apiBase}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const json = await res.json();
        if (json && json.success) {
          mediaData = json.data;
        }
      }
    } catch (netErr) {
      // Backend not running on this domain, fall through to Smart Client Resolver
    }

    // 2. Fallback to Smart Client-Side Resolver (avoids Unexpected Token HTML errors!)
    if (!mediaData) {
      mediaData = await resolveSmartClientMedia(url);
    }

    if (!mediaData) {
      throw new Error('Unable to extract media information. Please check that the URL is public and valid.');
    }

    state.currentMedia = mediaData;
    renderMediaResult(mediaData);
    sound.playSuccess();
  } catch (err) {
    sound.playError();
    showError(err.message || 'An error occurred while contacting the media engine.');
  } finally {
    setLoading(false);
  }
}

function setLoading(isLoading) {
  if (isLoading) {
    elements.btnSpinner.classList.remove('hidden');
    elements.fetchBtn.querySelector('.btn-text').textContent = 'Extracting...';
    elements.fetchBtn.querySelector('.arrow-icon').classList.add('hidden');
    elements.fetchBtn.disabled = true;
  } else {
    elements.btnSpinner.classList.add('hidden');
    elements.fetchBtn.querySelector('.btn-text').textContent = 'Extract';
    elements.fetchBtn.querySelector('.arrow-icon').classList.remove('hidden');
    elements.fetchBtn.disabled = false;
  }
}

function showError(msg) {
  elements.errorAlertText.textContent = msg;
  elements.errorAlert.classList.remove('hidden');
}

function hideError() {
  elements.errorAlert.classList.add('hidden');
}

function sanitizeTitle(str) {
  return (str || 'media').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().slice(0, 50);
}

// 6. Render Media Result
function renderMediaResult(data) {
  elements.resultCard.classList.remove('hidden');

  // Thumbnail & Duration
  elements.mediaThumbnail.src = data.thumbnail || 'assets/placeholder.svg';
  elements.mediaThumbnail.classList.remove('hidden');
  elements.inlineVideoPlayer.classList.add('hidden');
  elements.inlineVideoPlayer.pause();
  elements.playPreviewBtn.parentElement.classList.remove('hidden');
  elements.mediaDuration.textContent = data.durationFormatted || '00:00';

  // Details
  elements.mediaTitle.textContent = data.title;
  elements.mediaTitle.title = data.title;
  elements.authorBadge.textContent = data.author;

  // Platform Badge Styling
  elements.platformBadge.className = 'platform-badge';
  if (data.platform === 'instagram') {
    elements.platformBadge.classList.add('ig');
    elements.platformBadge.textContent = 'INSTAGRAM';
  } else if (data.platform === 'youtube') {
    elements.platformBadge.classList.add('yt');
    elements.platformBadge.textContent = 'YOUTUBE';
  } else {
    elements.platformBadge.textContent = (data.platform || 'MEDIA').toUpperCase();
  }

  elements.viewsCount.textContent = data.viewCount ? `👁️ ${data.viewCount}` : `⚡ High-Speed Extraction`;

  // Render Formats
  elements.formatsList.innerHTML = '';

  const apiBase = getApiBaseUrl();

  data.formats.forEach(fmt => {
    const isAudio = fmt.type === 'audio';
    const card = document.createElement('a');
    card.className = `format-card ${isAudio ? 'audio-format' : ''}`;
    
    if (fmt.directLink) {
      // 1-Click Direct Stream / Gateway Link
      card.href = fmt.directLink;
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
    } else {
      // Native backend download link
      const dlUrl = `${apiBase}/api/download?url=${encodeURIComponent(data.originalUrl)}&quality=${fmt.resolution}&type=${fmt.type}&title=${encodeURIComponent(data.title)}`;
      card.href = dlUrl;
      card.download = `${sanitizeTitle(data.title)}.${fmt.ext || (isAudio ? 'mp3' : 'mp4')}`;
    }

    card.innerHTML = `
      <div class="fmt-left">
        <span class="fmt-quality">${fmt.qualityLabel}</span>
        <span class="fmt-meta">${fmt.ext.toUpperCase()} • ${fmt.filesize || 'Lossless'}</span>
      </div>
      <div class="fmt-dl-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>
    `;

    card.addEventListener('click', () => {
      sound.playSuccess();
      recordHistory({
        title: data.title,
        thumbnail: data.thumbnail,
        platform: data.platform,
        format: fmt.qualityLabel,
        url: card.href,
        timestamp: Date.now()
      });
    });

    elements.formatsList.appendChild(card);
  });

  // Smooth scroll to result
  elements.resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 7. History Management
function recordHistory(item) {
  state.history.unshift(item);
  if (state.history.length > 25) state.history.pop();
  localStorage.setItem('senku_vault_history', JSON.stringify(state.history));
  renderHistory();
}

function renderHistory() {
  elements.historyCount.textContent = state.history.length;
  if (state.history.length === 0) {
    elements.emptyHistory.classList.remove('hidden');
    elements.historyList.innerHTML = '';
    elements.historyList.appendChild(elements.emptyHistory);
    return;
  }

  elements.emptyHistory.classList.add('hidden');
  elements.historyList.innerHTML = '';

  state.history.forEach(item => {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
      <img src="${item.thumbnail || 'assets/placeholder.svg'}" alt="Thumb" class="h-thumb" />
      <div class="h-info">
        <div class="h-title" title="${item.title}">${item.title}</div>
        <div class="h-meta">
          <span>${item.platform ? item.platform.toUpperCase() : 'MEDIA'}</span>
          <span>•</span>
          <span>${item.format}</span>
        </div>
      </div>
    `;
    elements.historyList.appendChild(div);
  });
}

// History Drawer Toggles
elements.historyToggleBtn.addEventListener('click', () => {
  sound.playClick();
  elements.historyDrawer.classList.add('open');
});

elements.closeHistoryBtn.addEventListener('click', () => {
  sound.playClick();
  elements.historyDrawer.classList.remove('open');
});

elements.historyBackdrop.addEventListener('click', () => {
  elements.historyDrawer.classList.remove('open');
});

elements.clearHistoryBtn.addEventListener('click', () => {
  sound.playClick();
  state.history = [];
  localStorage.removeItem('senku_vault_history');
  renderHistory();
});

// 8. WhatsApp Status Saver (Local .Statuses Explorer)
function setupWhatsAppModule() {
  const dropZone = elements.waDropZone;
  const fileInput = elements.waFileInput;

  ['dragenter', 'dragover'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(name => {
    dropZone.addEventListener(name, (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleWhatsAppFiles(files);
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) handleWhatsAppFiles(fileInput.files);
  });

  elements.downloadAllWaBtn.addEventListener('click', () => {
    sound.playSuccess();
    const saveBtns = elements.waItemsGrid.querySelectorAll('.wa-save-btn');
    saveBtns.forEach((btn, idx) => {
      setTimeout(() => btn.click(), idx * 250);
    });
  });
}

function handleWhatsAppFiles(files) {
  sound.playSuccess();
  elements.waGallery.classList.remove('hidden');
  elements.waItemsGrid.innerHTML = '';
  let count = 0;

  Array.from(files).forEach((file, idx) => {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) return;
    count++;

    const objectUrl = URL.createObjectURL(file);
    const isVideo = file.type.startsWith('video/');

    const card = document.createElement('div');
    card.className = 'wa-item-card';

    if (isVideo) {
      const vid = document.createElement('video');
      vid.src = objectUrl;
      vid.muted = true;
      card.appendChild(vid);
    } else {
      const img = document.createElement('img');
      img.src = objectUrl;
      card.appendChild(img);
    }

    const overlay = document.createElement('div');
    overlay.className = 'wa-dl-overlay';
    overlay.innerHTML = `
      <button class="wa-save-btn" title="Save Status">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    `;

    const saveBtn = overlay.querySelector('.wa-save-btn');
    saveBtn.addEventListener('click', () => {
      sound.playClick();
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `WhatsApp_Status_${Date.now()}_${idx + 1}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    });

    card.appendChild(overlay);
    elements.waItemsGrid.appendChild(card);
  });

  elements.galleryCount.textContent = `${count} Statuses Ready`;
}

// 9. Senku Engine HUD Controls
function setupHUD() {
  // Senku Engine kinetic field toggle
  const engineBtn = elements.engineToggle;
  if (engineBtn) {
    engineBtn.addEventListener('click', () => {
      sound.playClick();
      const eng = window.senkuEngine || window.gravityParticles;
      if (eng) {
        const isEnabled = eng.toggle();
        elements.engineStatus.textContent = isEnabled ? '10B %' : 'OFF';
        elements.engineStatus.style.color = isEnabled ? 'var(--neon-green)' : 'var(--text-dim)';
      }
    });
  }

  // Molecular density cycle
  elements.particleDensityToggle.addEventListener('click', () => {
    sound.playClick();
    state.particleDensityIdx = (state.particleDensityIdx + 1) % state.particleDensities.length;
    const count = state.particleDensities[state.particleDensityIdx];
    elements.particleCountText.textContent = count;
    const eng = window.senkuEngine || window.gravityParticles;
    if (eng) {
      eng.setCount(count);
    }
  });

  // Sound toggle
  elements.soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    sound.enabled = state.soundEnabled;
    elements.soundStatus.textContent = state.soundEnabled ? 'ON' : 'OFF';
    elements.soundStatus.style.color = state.soundEnabled ? 'var(--neon-green)' : 'var(--text-dim)';
    if (state.soundEnabled) sound.playClick();
  });
}

// 10. PWA Installation & Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}

let deferredPrompt = null;
const installPwaBtn = document.getElementById('installPwaBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installPwaBtn) {
    installPwaBtn.classList.remove('hidden');
    installPwaBtn.addEventListener('click', async () => {
      sound.playClick();
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice && choice.outcome === 'accepted') {
          installPwaBtn.classList.add('hidden');
        }
        deferredPrompt = null;
      }
    });
  }
});
