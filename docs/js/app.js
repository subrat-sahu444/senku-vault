/**
 * SENKU VAULT • CORE CLIENT APPLICATION
 * High-performance, zero-ad downloader for Instagram Reels, YouTube, & WhatsApp.
 * Powered by the Senku Engine. 100% In-Platform Direct Downloads.
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
  previewOverlay: document.getElementById('previewOverlay'),
  inlineVideoPlayer: document.getElementById('inlineVideoPlayer'),
  inlineIframePlayer: document.getElementById('inlineIframePlayer'),
  closePreviewBtn: document.getElementById('closePreviewBtn'),
  theaterPreviewBtn: document.getElementById('theaterPreviewBtn'),
  mediaLightboxModal: document.getElementById('mediaLightboxModal'),
  closeLightboxBtn: document.getElementById('closeLightboxBtn'),
  lightboxTitle: document.getElementById('lightboxTitle'),
  lightboxBody: document.getElementById('lightboxBody'),
  lightboxMeta: document.getElementById('lightboxMeta'),
  lightboxDlBtn: document.getElementById('lightboxDlBtn'),
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
  downloadAllWaBtn: document.getElementById('downloadAllWaBtn'),
  // Snaptube Mobile Modal & Controls
  snaptubePill: document.getElementById('snaptubePill'),
  snaptubeModal: document.getElementById('snaptubeModal'),
  closeSnaptubeBtn: document.getElementById('closeSnaptubeBtn'),
  snaptubeThumb: document.getElementById('snaptubeThumb'),
  snaptubeTitle: document.getElementById('snaptubeTitle'),
  snaptubeAuthor: document.getElementById('snaptubeAuthor'),
  snaptubeMusicGrid: document.getElementById('snaptubeMusicGrid'),
  snaptubeVideoGrid: document.getElementById('snaptubeVideoGrid'),
  snaptubeStatusBox: document.getElementById('snaptubeStatusBox'),
  snaptubeStatusMsg: document.getElementById('snaptubeStatusMsg'),
  snaptubeTunnel: document.getElementById('snaptubeTunnel')
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

// Auto-detect and resolve active backend URL (Cloud or Localhost)
async function getActiveBackendUrl() {
  const custom = (localStorage.getItem('senku_api_endpoint') || '').replace(/\/+$/, '');
  if (custom) return custom;

  // Try same origin
  try {
    const res = await fetch('/api/health', { method: 'GET' });
    const cType = res.headers.get('content-type') || '';
    if (res.ok && cType.includes('application/json')) {
      return '';
    }
  } catch (e) {}

  // Auto-detect local engine if user is running start.bat on their PC
  try {
    const res2 = await fetch('http://127.0.0.1:3000/api/health', { method: 'GET' });
    if (res2.ok) {
      return 'http://127.0.0.1:3000';
    }
  } catch (e) {}

  return null;
}

// 1. Server Health Check
async function checkServerHealth() {
  const backend = await getActiveBackendUrl();
  if (backend !== null) {
    elements.serverStatusBadge.innerHTML = `
      <span class="status-dot pulse"></span>
      <span class="status-label">${backend ? 'Engine Connected' : 'Core Ready • Ad-Free'}</span>
    `;
  } else {
    elements.serverStatusBadge.innerHTML = `
      <span class="status-dot" style="background:#00f0ff;box-shadow:0 0 8px #00f0ff"></span>
      <span class="status-label" style="color:#00f0ff">Smart Mode Active</span>
    `;
  }
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

  // Open modal from status badge click
  if (elements.serverStatusBadge && configModal) {
    elements.serverStatusBadge.addEventListener('click', () => {
      sound.playClick();
      if (backendUrlInput) backendUrlInput.value = localStorage.getItem('senku_api_endpoint') || '';
      configModal.classList.remove('hidden');
    });
  }

  // Test local engine button in modal
  const testLocalBtn = document.getElementById('testLocalBtn');
  const localStatusText = document.getElementById('localStatusText');
  if (testLocalBtn && localStatusText) {
    testLocalBtn.addEventListener('click', async () => {
      sound.playClick();
      localStatusText.innerHTML = '<span style="color:#00f0ff;">Checking 127.0.0.1:3000...</span>';
      try {
        const res = await fetch('http://127.0.0.1:3000/api/health');
        if (res.ok) {
          localStatusText.innerHTML = '<span style="color:#00ff88;font-weight:bold;">✓ Local Engine Online!</span>';
          sound.playSuccess();
          checkServerHealth();
        } else {
          localStatusText.innerHTML = '<span style="color:#ff4444;">❌ Server responded with error.</span>';
        }
      } catch (e) {
        localStatusText.innerHTML = '<span style="color:#ffaa00;">⚠️ Not detected. Please run start.bat!</span>';
      }
    });
  }

  // Media Preview Controls
  if (elements.playPreviewBtn) {
    elements.playPreviewBtn.addEventListener('click', () => {
      startMediaPreview();
    });
  }

  if (elements.theaterPreviewBtn) {
    elements.theaterPreviewBtn.addEventListener('click', () => {
      openTheaterPreview();
    });
  }

  if (elements.closePreviewBtn) {
    elements.closePreviewBtn.addEventListener('click', () => {
      stopMediaPreview();
    });
  }

  // Lightbox modal close
  if (elements.closeLightboxBtn && elements.mediaLightboxModal) {
    elements.closeLightboxBtn.addEventListener('click', closeTheaterModal);
    elements.mediaLightboxModal.addEventListener('click', (e) => {
      if (e.target === elements.mediaLightboxModal) closeTheaterModal();
    });
  }

  // Close preview on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      stopMediaPreview();
      closeTheaterModal();
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

  // Download Thumbnail directly
  elements.downloadThumbBtn.addEventListener('click', () => {
    sound.playClick();
    if (!state.currentMedia || !state.currentMedia.thumbnail) return;
    const a = document.createElement('a');
    a.href = state.currentMedia.thumbnail;
    a.download = `${sanitizeTitle(state.currentMedia.title)}_cover.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  // Snaptube Filter Tabs (All Formats, Music MP3, Video MP4)
  document.querySelectorAll('.snaptube-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      document.querySelectorAll('.snaptube-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      const cards = elements.formatsList.querySelectorAll('.format-card');
      cards.forEach(card => {
        const isAudio = card.classList.contains('audio-format');
        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (filter === 'audio') {
          card.style.display = isAudio ? 'flex' : 'none';
        } else if (filter === 'video') {
          card.style.display = !isAudio ? 'flex' : 'none';
        }
      });
    });
  });

  // Snaptube Pill & Modal Listeners
  if (elements.snaptubePill) {
    elements.snaptubePill.addEventListener('click', () => {
      if (state.currentMedia) {
        openSnaptubeSheet(state.currentMedia);
      } else {
        elements.urlInput.focus();
        showError('Paste a YouTube or Instagram link and tap Extract to open Snaptube direct downloader!');
      }
    });
  }

  if (elements.closeSnaptubeBtn) {
    elements.closeSnaptubeBtn.addEventListener('click', closeSnaptubeSheet);
  }

  if (elements.snaptubeModal) {
    elements.snaptubeModal.addEventListener('click', (e) => {
      if (e.target === elements.snaptubeModal) closeSnaptubeSheet();
    });
  }
}

// 4. Media Preview Engine (YouTube 4K, Instagram Reels, & Local Stream)
function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/|live\/))([\w-]{11})/i);
  return match ? match[1] : null;
}

function extractInstagramShortcode(url) {
  if (!url) return null;
  const match = url.match(/(?:instagram\.com\/(?:p|reel|tv|reels)\/)([\w-]+)/i);
  return match ? match[1] : null;
}

// In-Line Media Preview
function startMediaPreview() {
  if (!state.currentMedia) return;
  sound.playClick();
  const data = state.currentMedia;
  const isYouTube = data.platform === 'youtube' || (data.originalUrl && (data.originalUrl.includes('youtube.com') || data.originalUrl.includes('youtu.be')));
  const isInstagram = data.platform === 'instagram' || (data.originalUrl && data.originalUrl.includes('instagram.com'));
  const ytId = data.id || extractYouTubeId(data.originalUrl);
  const igCode = extractInstagramShortcode(data.originalUrl);

  // Stop previous preview silently
  stopMediaPreview(false);

  // 1. YouTube Live Preview
  if (isYouTube && ytId) {
    elements.inlineIframePlayer.src = `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;
    elements.inlineIframePlayer.classList.remove('hidden');
    elements.mediaThumbnail.classList.add('hidden');
    elements.previewOverlay.classList.add('hidden');
    elements.closePreviewBtn.classList.remove('hidden');
    return;
  }

  // 2. Direct Video URL (Instagram CDN or native stream)
  if (data.directVideoUrl) {
    elements.inlineVideoPlayer.src = data.directVideoUrl;
    elements.inlineVideoPlayer.classList.remove('hidden');
    elements.mediaThumbnail.classList.add('hidden');
    elements.previewOverlay.classList.add('hidden');
    elements.closePreviewBtn.classList.remove('hidden');
    elements.inlineVideoPlayer.play().catch(e => console.warn('Autoplay prevented:', e));
    return;
  }

  // 3. Instagram Embed Preview
  if (isInstagram && igCode) {
    elements.inlineIframePlayer.src = `https://www.instagram.com/p/${igCode}/embed/captioned/`;
    elements.inlineIframePlayer.classList.remove('hidden');
    elements.mediaThumbnail.classList.add('hidden');
    elements.previewOverlay.classList.add('hidden');
    elements.closePreviewBtn.classList.remove('hidden');
    return;
  }

  // 4. Default: Open Theater View
  openTheaterPreview();
}

function stopMediaPreview(playSound = true) {
  if (playSound) sound.playClick();
  if (elements.inlineVideoPlayer) {
    elements.inlineVideoPlayer.pause();
    elements.inlineVideoPlayer.removeAttribute('src');
    elements.inlineVideoPlayer.load();
    elements.inlineVideoPlayer.classList.add('hidden');
  }
  if (elements.inlineIframePlayer) {
    elements.inlineIframePlayer.src = '';
    elements.inlineIframePlayer.classList.add('hidden');
  }
  if (elements.mediaThumbnail) {
    elements.mediaThumbnail.classList.remove('hidden');
  }
  if (elements.previewOverlay) {
    elements.previewOverlay.classList.remove('hidden');
  }
  if (elements.closePreviewBtn) {
    elements.closePreviewBtn.classList.add('hidden');
  }
}

// Lightbox Theater Modal Preview
function openTheaterPreview() {
  if (!state.currentMedia) return;
  sound.playClick();
  const data = state.currentMedia;
  const isYouTube = data.platform === 'youtube' || (data.originalUrl && (data.originalUrl.includes('youtube.com') || data.originalUrl.includes('youtu.be')));
  const isInstagram = data.platform === 'instagram' || (data.originalUrl && data.originalUrl.includes('instagram.com'));
  const ytId = data.id || extractYouTubeId(data.originalUrl);
  const igCode = extractInstagramShortcode(data.originalUrl);

  elements.lightboxTitle.textContent = data.title;
  elements.lightboxMeta.textContent = `${(data.platform || 'MEDIA').toUpperCase()} • ${data.durationFormatted || 'HD Preview'}`;
  elements.lightboxBody.innerHTML = '';

  if (isYouTube && ytId) {
    elements.lightboxBody.innerHTML = `
      <iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1" 
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
        allowfullscreen></iframe>
    `;
  } else if (data.directVideoUrl) {
    elements.lightboxBody.innerHTML = `
      <video controls autoplay playsinline src="${data.directVideoUrl}"></video>
    `;
  } else if (isInstagram && igCode) {
    elements.lightboxBody.innerHTML = `
      <iframe src="https://www.instagram.com/p/${igCode}/embed/captioned/" scrolling="no" allowtransparency="true" allowfullscreen></iframe>
    `;
  } else {
    elements.lightboxBody.innerHTML = `
      <img src="${data.thumbnail || 'assets/placeholder.svg'}" alt="Preview" />
    `;
  }

  // 1-Click download from inside theater
  elements.lightboxDlBtn.onclick = () => {
    sound.playClick();
    const cards = elements.formatsList.querySelectorAll('.format-card');
    if (cards.length > 0) cards[0].click();
  };

  elements.mediaLightboxModal.classList.remove('hidden');
}

function closeTheaterModal() {
  sound.playClick();
  if (elements.mediaLightboxModal) {
    elements.mediaLightboxModal.classList.add('hidden');
    elements.lightboxBody.innerHTML = '';
  }
}

// WhatsApp Status Media Preview
function openWhatsAppStatusPreview(file, objectUrl, isVideo) {
  sound.playClick();
  elements.lightboxTitle.textContent = file.name || 'WhatsApp Status';
  elements.lightboxMeta.textContent = isVideo ? 'WhatsApp Video Status' : 'WhatsApp Photo Status';
  elements.lightboxBody.innerHTML = '';

  if (isVideo) {
    elements.lightboxBody.innerHTML = `
      <video controls autoplay playsinline loop src="${objectUrl}"></video>
    `;
  } else {
    elements.lightboxBody.innerHTML = `
      <img src="${objectUrl}" alt="Status Photo" />
    `;
  }

  elements.lightboxDlBtn.onclick = () => {
    sound.playSuccess();
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = file.name || (isVideo ? 'WhatsApp_Status.mp4' : 'WhatsApp_Status.jpg');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  elements.mediaLightboxModal.classList.remove('hidden');
}

// 4. Smart Client-Side Fallback Resolver & Snaptube Stream Extractor
async function resolveSmartClientMedia(url) {
  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');
  const isInstagram = url.includes('instagram.com');

  if (isYouTube) {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|live\/))([\w-]{11})/);
    const videoId = match ? match[1] : null;

    let title = 'YouTube Video / Short';
    let author = 'YouTube Creator';
    let thumb = videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : 'assets/placeholder.svg';
    let durationFormatted = 'HD Stream';
    let viewCount = '1-Click Direct';
    const streamMap = {};

    // 1. Try Invidious fast stream extraction
    if (videoId) {
      try {
        const invRes = await fetch(`https://yt.chocolatemoo53.com/api/v1/videos/${videoId}`, {
          signal: AbortSignal.timeout(3000)
        });
        if (invRes.ok) {
          const invData = await invRes.json();
          if (invData.title) title = invData.title;
          if (invData.author) author = invData.author;
          if (invData.videoThumbnails && invData.videoThumbnails.length > 0) {
            thumb = invData.videoThumbnails[0].url;
          }
          if (invData.lengthSeconds) {
            const m = Math.floor(invData.lengthSeconds / 60);
            const s = String(invData.lengthSeconds % 60).padStart(2, '0');
            durationFormatted = `${m}:${s}`;
          }
          if (invData.viewCount) {
            viewCount = Number(invData.viewCount).toLocaleString();
          }

          // Extract adaptive streams
          const audioList = (invData.adaptiveFormats || []).filter(f => (f.type || '').includes('audio'));
          const bestAudio = audioList.find(a => a.itag === '140') || audioList[0];
          if (bestAudio) streamMap['audio'] = bestAudio.url;

          const videoList = (invData.adaptiveFormats || []).filter(f => (f.type || '').includes('video/mp4'));
          ['1080p', '720p', '480p', '360p'].forEach(resLabel => {
            const vMatch = videoList.find(v => (v.qualityLabel || '').includes(resLabel));
            if (vMatch) streamMap[resLabel] = vMatch.url;
          });
        }
      } catch (e) {
        // Fallback to oembed
        try {
          const oembedRes = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(url)}`);
          if (oembedRes.ok) {
            const odata = await oembedRes.json();
            if (odata.title) title = odata.title;
            if (odata.author_name) author = odata.author_name;
            if (odata.thumbnail_url) thumb = odata.thumbnail_url;
          }
        } catch (oe) {}
      }
    }

    const cleanVideoUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;

    // Full Snaptube Mobile Tier List
    return {
      id: videoId,
      title: title,
      author: author,
      thumbnail: thumb,
      durationFormatted: durationFormatted,
      viewCount: viewCount,
      platform: 'youtube',
      originalUrl: cleanVideoUrl,
      directVideoUrl: streamMap['720p'] || streamMap['360p'] || null,
      formats: [
        {
          formatId: 'mp3_320',
          resolution: '320k',
          qualityLabel: 'HQ Audio 320kbps (MP3)',
          type: 'audio',
          ext: 'mp3',
          filesize: 'Lossless Audio',
          directStreamUrl: streamMap['audio'] || null
        },
        {
          formatId: 'mp3_128',
          resolution: '128k',
          qualityLabel: 'Standard Audio 128kbps (MP3)',
          type: 'audio',
          ext: 'mp3',
          filesize: 'Fast Download',
          directStreamUrl: streamMap['audio'] || null
        },
        {
          formatId: 'm4a',
          resolution: 'm4a',
          qualityLabel: 'Crystal Clear (M4A/AAC)',
          type: 'audio',
          ext: 'm4a',
          filesize: 'Original Quality',
          directStreamUrl: streamMap['audio'] || null
        },
        {
          formatId: '1080p',
          resolution: '1080p',
          qualityLabel: 'Full HD 1080p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Lossless',
          directStreamUrl: streamMap['1080p'] || streamMap['720p'] || null
        },
        {
          formatId: '720p',
          resolution: '720p',
          qualityLabel: 'HD 720p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Recommended',
          directStreamUrl: streamMap['720p'] || null
        },
        {
          formatId: '480p',
          resolution: '480p',
          qualityLabel: 'Standard 480p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Data Saver',
          directStreamUrl: streamMap['480p'] || null
        },
        {
          formatId: '360p',
          resolution: '360p',
          qualityLabel: 'Fast 360p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Small File',
          directStreamUrl: streamMap['360p'] || null
        }
      ]
    };
  }

  if (isInstagram) {
    const codeMatch = url.match(/(?:p|reel|tv)\/([A-Za-z0-9_-]+)/);
    const shortcode = codeMatch ? codeMatch[1] : 'Reel';

    return {
      id: shortcode,
      title: `Instagram Reel (${shortcode})`,
      author: 'Instagram Creator',
      thumbnail: `https://images.weserv.nl/?url=https://www.instagram.com/p/${shortcode}/media/?size=l`,
      durationFormatted: 'Reel HD',
      viewCount: '1-Click Direct',
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
          directStreamUrl: null
        },
        {
          formatId: '720p',
          resolution: 'HD 720p',
          qualityLabel: 'HD 720p (MP4)',
          type: 'video',
          ext: 'mp4',
          filesize: 'Fast Download',
          directStreamUrl: null
        },
        {
          formatId: 'mp3_reel',
          resolution: 'Audio 320k',
          qualityLabel: 'Reel Audio 320kbps (MP3)',
          type: 'audio',
          ext: 'mp3',
          filesize: 'Audio Track',
          directStreamUrl: null
        }
      ]
    };
  }

  return {
    title: 'Media Stream',
    author: 'Online Media',
    thumbnail: 'assets/placeholder.svg',
    durationFormatted: 'Direct',
    viewCount: '1-Click Direct',
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
        directStreamUrl: null
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

  try {
    let mediaData = null;
    const backend = await getActiveBackendUrl();

    // 1. Try backend API first if connected
    if (backend !== null) {
      try {
        const res = await fetch(`${backend}/api/analyze`, {
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
      } catch (netErr) {}
    }

    // 2. Fallback to Smart Client-Side Resolver
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

// In-Platform Direct 1-Click File Downloader (No new pages or external redirects!)
async function triggerDirectDownload(dlUrl, filename, card, origText) {
  const metaSpan = card ? card.querySelector('.fmt-meta') : null;
  if (metaSpan) metaSpan.textContent = '⚡ Downloading directly...';

  // 1. Android APK Native WebView Downloader
  if (window.AndroidDownloader && typeof window.AndroidDownloader.downloadMedia === 'function') {
    const isAudio = filename.endsWith('.mp3') || filename.endsWith('.m4a');
    window.AndroidDownloader.downloadMedia(dlUrl, filename, isAudio ? 'audio/mpeg' : 'video/mp4');
    if (metaSpan) metaSpan.textContent = '✓ Sent to Android Downloader!';
    sound.playSuccess();
    setTimeout(() => { if (metaSpan && origText) metaSpan.textContent = origText; }, 3500);
    return;
  }

  const isAndroidApp = navigator.userAgent.includes('SenkuVaultApp') || /Android.*Version\/[0-9.]+\s+Chrome/i.test(navigator.userAgent);
  if (isAndroidApp) {
    window.location.href = dlUrl;
    setTimeout(() => {
      if (metaSpan) metaSpan.textContent = '✓ Sent to Android Downloader!';
      sound.playSuccess();
      setTimeout(() => { if (metaSpan && origText) metaSpan.textContent = origText; }, 3500);
    }, 1200);
    return;
  }

  // 2. HTTPS Mixed Content Handler (GitHub Pages to Localhost)
  const isMixedContent = window.location.protocol === 'https:' && dlUrl.startsWith('http://');

  if (isMixedContent) {
    try {
      if (metaSpan) metaSpan.textContent = '⚡ Streaming direct bytes...';
      const res = await fetch(dlUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);

      if (metaSpan) metaSpan.textContent = '✓ Saved to Downloads!';
      sound.playSuccess();
      setTimeout(() => { if (metaSpan && origText) metaSpan.textContent = origText; }, 3500);
      return;
    } catch (e) {
      console.warn('Direct stream fetch failed, falling back to direct anchor:', e);
    }
  }

  // 3. Standard Direct File Download
  const dlAnchor = document.createElement('a');
  dlAnchor.href = dlUrl;
  dlAnchor.setAttribute('download', filename);
  dlAnchor.style.display = 'none';
  document.body.appendChild(dlAnchor);
  dlAnchor.click();

  setTimeout(() => {
    try { document.body.removeChild(dlAnchor); } catch(e){}
    if (metaSpan) metaSpan.textContent = '✓ Saved to Downloads!';
    sound.playSuccess();
    setTimeout(() => { if (metaSpan && origText) metaSpan.textContent = origText; }, 3500);
  }, 1200);
}

// Snaptube Direct Stream Resolver for Mobile
async function fetchYouTubeStreamDirect(videoId, quality, type) {
  const isAudio = type === 'audio' || (quality && quality.toLowerCase().includes('mp3')) || (quality && quality.toLowerCase().includes('m4a'));
  
  // Try Invidious fast API
  try {
    const res = await fetch(`https://yt.chocolatemoo53.com/api/v1/videos/${videoId}`, {
      signal: AbortSignal.timeout(3500)
    });
    if (res.ok) {
      const data = await res.json();
      if (isAudio) {
        const audioStreams = (data.adaptiveFormats || []).filter(f => (f.type || '').includes('audio'));
        const best = audioStreams.find(a => a.itag === '140') || audioStreams[0];
        if (best && best.url) return { url: best.url, ext: 'mp3', quality: '320k' };
      } else {
        const videoStreams = (data.adaptiveFormats || []).filter(f => (f.type || '').includes('video/mp4'));
        const qTarget = quality ? quality.toLowerCase().replace(/[^0-9]/g, '') : '720';
        let match = videoStreams.find(v => (v.qualityLabel || '').includes(qTarget));
        if (!match) match = videoStreams.find(v => (v.qualityLabel || '').includes('720')) || videoStreams[0];
        if (match && match.url) return { url: match.url, ext: 'mp4', quality: match.qualityLabel };
      }
    }
  } catch (e) {}

  // Direct Invidious stream URL format fallback
  const itag = isAudio ? '140' : (quality && quality.includes('1080') ? '137' : '22');
  return {
    url: `https://yt.chocolatemoo53.com/latest_version?id=${videoId}&itag=${itag}`,
    ext: isAudio ? 'mp3' : 'mp4',
    quality: quality || 'HD'
  };
}

// Snaptube Mobile Stream Dispatcher (Standalone on-device downloading without PC server)
async function executeSnaptubeMobileDownload(data, fmt, cardOrBtn, origText) {
  const isAudio = fmt.type === 'audio';
  const filename = `${sanitizeTitle(data.title)}_${fmt.resolution || fmt.qualityLabel}.${fmt.ext || (isAudio ? 'mp3' : 'mp4')}`.replace(/\s+/g, '_');
  const mimeType = isAudio ? 'audio/mpeg' : 'video/mp4';

  const statusEl = cardOrBtn ? (cardOrBtn.querySelector('.fmt-meta') || cardOrBtn) : null;
  if (statusEl) statusEl.textContent = '⚡ Extracting stream...';
  if (elements.snaptubeStatusMsg) {
    elements.snaptubeStatusMsg.textContent = `⚡ Snaptube Engine: Fetching ${fmt.qualityLabel || fmt.resolution}...`;
  }

  // 1. Resolve stream URL
  let streamUrl = fmt.directStreamUrl;
  const isYouTube = data.platform === 'youtube' || (data.originalUrl && (data.originalUrl.includes('youtube.com') || data.originalUrl.includes('youtu.be')));
  const isInstagram = data.platform === 'instagram' || (data.originalUrl && data.originalUrl.includes('instagram.com'));
  const vidId = data.id || extractYouTubeId(data.originalUrl);

  if (!streamUrl && isYouTube && vidId) {
    try {
      const streamData = await fetchYouTubeStreamDirect(vidId, fmt.resolution, fmt.type);
      if (streamData && streamData.url) {
        streamUrl = streamData.url;
        fmt.directStreamUrl = streamUrl;
      }
    } catch (e) {
      console.warn('Mobile stream extraction error:', e);
    }
  }

  if (!streamUrl && data.directVideoUrl) {
    streamUrl = data.directVideoUrl;
  }

  // If still no streamUrl, check if backend is reachable
  const backend = await getActiveBackendUrl();
  if (!streamUrl && backend) {
    streamUrl = `${backend}/api/download?url=${encodeURIComponent(data.originalUrl)}&quality=${fmt.resolution}&type=${fmt.type}&title=${encodeURIComponent(data.title)}`;
  }

  // Fallback stream proxy link if still unresolved
  if (!streamUrl) {
    if (isYouTube && vidId) {
      streamUrl = `https://yt.chocolatemoo53.com/latest_version?id=${vidId}&itag=${isAudio ? '140' : '22'}`;
    } else {
      streamUrl = data.originalUrl;
    }
  }

  // Record to History
  recordHistory({
    title: data.title,
    thumbnail: data.thumbnail,
    platform: data.platform,
    format: fmt.qualityLabel || fmt.resolution,
    url: streamUrl,
    timestamp: Date.now()
  });

  // 2. Dispatch to Android APK Native Downloader (DownloadManager with notifications)
  if (window.AndroidDownloader && typeof window.AndroidDownloader.downloadMedia === 'function') {
    window.AndroidDownloader.downloadMedia(streamUrl, filename, mimeType);
    if (statusEl) statusEl.textContent = '✓ Sent to Android Downloader!';
    if (elements.snaptubeStatusMsg) {
      elements.snaptubeStatusMsg.textContent = `✓ Download started! Check phone notification bar.`;
    }
    sound.playSuccess();
    setTimeout(() => { if (statusEl && origText) statusEl.textContent = origText; }, 3500);
    return;
  }

  // 3. Dispatch to Browser Direct Download
  if (statusEl) statusEl.textContent = '⚡ Saving to device...';
  if (elements.snaptubeStatusMsg) {
    elements.snaptubeStatusMsg.textContent = `⚡ Saving ${filename} directly...`;
  }

  try {
    const dlAnchor = document.createElement('a');
    dlAnchor.href = streamUrl;
    dlAnchor.setAttribute('download', filename);
    dlAnchor.setAttribute('target', '_blank');
    dlAnchor.style.display = 'none';
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    setTimeout(() => {
      try { document.body.removeChild(dlAnchor); } catch(e){}
    }, 2000);

    if (statusEl) statusEl.textContent = '✓ Saved to Downloads!';
    if (elements.snaptubeStatusMsg) {
      elements.snaptubeStatusMsg.textContent = `✓ Download completed! Saved to device Downloads.`;
    }
    sound.playSuccess();
  } catch (err) {
    if (elements.snaptubeTunnel) {
      elements.snaptubeTunnel.src = streamUrl;
    }
    if (statusEl) statusEl.textContent = '✓ Downloading...';
    sound.playSuccess();
  }

  setTimeout(() => {
    if (statusEl && origText) statusEl.textContent = origText;
  }, 3500);
}

// Snaptube Bottom Drawer Sheet Modal (Snaptube-grade Mobile Experience)
function openSnaptubeSheet(data) {
  if (!data || !elements.snaptubeModal) return;
  sound.playClick();
  
  if (elements.snaptubeThumb) elements.snaptubeThumb.src = data.thumbnail || 'assets/placeholder.svg';
  if (elements.snaptubeTitle) elements.snaptubeTitle.textContent = data.title || 'Media Stream';
  if (elements.snaptubeAuthor) elements.snaptubeAuthor.textContent = data.author || (data.platform || 'MEDIA').toUpperCase();
  if (elements.snaptubeStatusMsg) elements.snaptubeStatusMsg.textContent = 'Tap any quality below to download directly to your phone:';

  // Populate Music (Audio) Grid
  if (elements.snaptubeMusicGrid) {
    elements.snaptubeMusicGrid.innerHTML = '';
    const musicTiers = [
      { label: '320K', sub: 'MP3 Lossless', quality: '320k', type: 'audio', ext: 'mp3' },
      { label: '128K', sub: 'MP3 Standard', quality: '128k', type: 'audio', ext: 'mp3' },
      { label: 'M4A', sub: 'AAC Crystal', quality: 'm4a', type: 'audio', ext: 'm4a' }
    ];
    musicTiers.forEach(tier => {
      const btn = document.createElement('button');
      btn.className = 'snaptube-btn audio-btn';
      btn.innerHTML = `
        <span class="snaptube-btn-main">${tier.label}</span>
        <span class="snaptube-btn-sub">${tier.sub}</span>
      `;
      btn.addEventListener('click', () => {
        sound.playClick();
        executeSnaptubeMobileDownload(data, {
          qualityLabel: `${tier.label} (${tier.sub})`,
          resolution: tier.quality,
          type: tier.type,
          ext: tier.ext,
          filesize: 'Direct'
        }, btn, tier.label);
      });
      elements.snaptubeMusicGrid.appendChild(btn);
    });
  }

  // Populate Video (MP4) Grid
  if (elements.snaptubeVideoGrid) {
    elements.snaptubeVideoGrid.innerHTML = '';
    const videoTiers = [
      { label: '1080P', sub: 'Full HD MP4', quality: '1080p', type: 'video', ext: 'mp4' },
      { label: '720P', sub: 'HD MP4', quality: '720p', type: 'video', ext: 'mp4' },
      { label: '480P', sub: 'Standard MP4', quality: '480p', type: 'video', ext: 'mp4' },
      { label: '360P', sub: 'Fast MP4', quality: '360p', type: 'video', ext: 'mp4' }
    ];
    videoTiers.forEach(tier => {
      const btn = document.createElement('button');
      btn.className = 'snaptube-btn video-btn';
      btn.innerHTML = `
        <span class="snaptube-btn-main">${tier.label}</span>
        <span class="snaptube-btn-sub">${tier.sub}</span>
      `;
      btn.addEventListener('click', () => {
        sound.playClick();
        executeSnaptubeMobileDownload(data, {
          qualityLabel: `${tier.label} (${tier.sub})`,
          resolution: tier.quality,
          type: tier.type,
          ext: tier.ext,
          filesize: 'Direct'
        }, btn, tier.label);
      });
      elements.snaptubeVideoGrid.appendChild(btn);
    });
  }

  elements.snaptubeModal.classList.remove('hidden');
}

function closeSnaptubeSheet() {
  sound.playClick();
  if (elements.snaptubeModal) elements.snaptubeModal.classList.add('hidden');
}

// 6. Render Media Result & Handle 100% In-Platform Direct Downloads
function renderMediaResult(data) {
  elements.resultCard.classList.remove('hidden');

  // Reset previous preview state & show thumbnail
  stopMediaPreview(false);
  elements.mediaThumbnail.src = data.thumbnail || 'assets/placeholder.svg';
  elements.mediaDuration.textContent = data.durationFormatted || 'HD';

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

  // Render Formats (No external website redirects!)
  elements.formatsList.innerHTML = '';

  data.formats.forEach(fmt => {
    const isAudio = fmt.type === 'audio';
    const card = document.createElement('div');
    card.className = `format-card ${isAudio ? 'audio-format' : ''}`;
    
    card.innerHTML = `
      <div class="fmt-left">
        <span class="fmt-quality">${fmt.qualityLabel}</span>
        <span class="fmt-meta">${fmt.ext.toUpperCase()} • ${fmt.filesize || '1-Click Direct'}</span>
      </div>
      <div class="fmt-dl-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>
    `;

    // 1-Click In-Platform Direct Download Handler
    card.addEventListener('click', async () => {
      sound.playClick();
      const metaSpan = card.querySelector('.fmt-meta');
      const origText = metaSpan.textContent;

      metaSpan.textContent = '⚡ Starting download...';
      const backend = await getActiveBackendUrl();

      if (backend !== null) {
        const filename = `${sanitizeTitle(data.title)}.${fmt.ext || (isAudio ? 'mp3' : 'mp4')}`;
        const dlUrl = `${backend}/api/download?url=${encodeURIComponent(data.originalUrl)}&quality=${fmt.resolution}&type=${fmt.type}&title=${encodeURIComponent(data.title)}`;

        recordHistory({
          title: data.title,
          thumbnail: data.thumbnail,
          platform: data.platform,
          format: fmt.qualityLabel,
          url: dlUrl,
          timestamp: Date.now()
        });

        await triggerDirectDownload(dlUrl, filename, card, origText);
      } else {
        // Snaptube Mobile Stream Dispatcher (Standalone on-device downloading without PC server!)
        await executeSnaptubeMobileDownload(data, fmt, card, origText);
      }
    });

    elements.formatsList.appendChild(card);
  });

  // On Mobile: Automatically open Snaptube Sheet for the fastest 1-tap download experience
  const isMobile = window.innerWidth <= 768 || navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android');
  if (isMobile) {
    setTimeout(() => {
      openSnaptubeSheet(data);
    }, 400);
  }

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

// 8. WhatsApp Status Saver (Direct 1-Click on-device saving!)
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
      <button class="wa-save-btn" title="Save Directly">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </button>
    `;

    const saveBtn = overlay.querySelector('.wa-save-btn');
    saveBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sound.playClick();
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = `WhatsApp_Status_${Date.now()}_${idx + 1}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      sound.playSuccess();
    });

    // Clicking card opens full media preview!
    card.style.cursor = 'pointer';
    card.title = 'Click to Preview';
    card.addEventListener('click', (e) => {
      if (e.target.closest('.wa-save-btn')) return;
      openWhatsAppStatusPreview(file, objectUrl, isVideo);
    });

    card.appendChild(overlay);
    elements.waItemsGrid.appendChild(card);
  });

  elements.galleryCount.textContent = `${count} Statuses Ready`;
}

// 9. Senku Engine HUD Controls
function setupHUD() {
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
