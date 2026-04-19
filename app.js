// ─────────────────────────────────────────
// PodcastHub — Main App
// ─────────────────────────────────────────

let episodes = [];
let currentEpisode = null;
let playerInterval = null;
let playerState = {
  playing: false,
  progress: 0,
  volume: 80,
  speed: 1,
  muted: false
};

// ── INIT ──
async function init() {
  const res = await fetch('data/episodes.json');
  episodes = await res.json();
  renderHome();
  setupNav();
  showPage('home');
}

// ── NAVIGATION ──
function setupNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', () => {
      const page = el.dataset.page;
      if (page === 'episodes') { renderEpisodesPage(); showPage('episodes'); }
      else if (page === 'search') { renderSearchPage(); showPage('search'); }
      else if (page === 'about') { showPage('about'); }
      else { renderHome(); showPage('home'); }
      setActiveNav(el);
    });
  });
}

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(`page-${name}`).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setActiveNav(el) {
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  if (el.tagName === 'A') el.classList.add('active');
}

function goHome() { renderHome(); showPage('home'); }
function goEpisodes() { renderEpisodesPage(); showPage('episodes'); }
function goSearch() { renderSearchPage(); showPage('search'); }
function goAbout() { showPage('about'); }

// ── HOME PAGE ──
function renderHome() {
  const featured = episodes.find(e => e.featured) || episodes[0];
  const latest = episodes.slice(0, 6);

  // Hero featured card
  document.getElementById('hero-featured').innerHTML = `
    <div class="hero-card" onclick="openEpisode(${featured.id})">
      <div class="play-badge">▶</div>
      <img class="hero-card-img" src="${featured.cover}" alt="${featured.title}" loading="lazy">
      <div class="hero-card-body">
        <div class="hero-card-category">${featured.category}</div>
        <h3>${featured.title}</h3>
        <div class="hero-card-meta">
          <span>with ${featured.guest}</span>
          <span>·</span>
          <span>${featured.duration}</span>
          <span>·</span>
          <span>${formatPlays(featured.plays)} plays</span>
        </div>
      </div>
    </div>`;

  // Episodes grid
  const grid = document.getElementById('home-episodes-grid');
  grid.innerHTML = latest.map((ep, i) => episodeCardHTML(ep, i)).join('');
}

// ── EPISODES PAGE ──
function renderEpisodesPage(filter = 'All') {
  const cats = ['All', ...new Set(episodes.map(e => e.category))];
  document.getElementById('categories-bar').innerHTML = cats.map(c => `
    <button class="cat-pill ${c === filter ? 'active' : ''}" onclick="renderEpisodesPage('${c}')">${c}</button>
  `).join('');

  const filtered = filter === 'All' ? episodes : episodes.filter(e => e.category === filter);
  document.getElementById('all-episodes-grid').innerHTML = filtered.map((ep, i) => episodeCardHTML(ep, i)).join('');
}

// ── EPISODE CARD HTML ──
function episodeCardHTML(ep, i) {
  return `
    <div class="episode-card fade-in" onclick="openEpisode(${ep.id})" style="animation-delay:${i * 0.06}s">
      <img class="card-img" src="${ep.cover}" alt="${ep.title}" loading="lazy">
      <div class="card-body">
        <div class="card-category">${ep.category}</div>
        <div class="card-title">${ep.title}</div>
        <div class="card-guest">with ${ep.guest} · ${ep.role}</div>
        <div class="card-desc">${ep.description}</div>
        <div class="card-footer">
          <span class="card-meta">${ep.date} · ${ep.duration}</span>
          <span class="card-plays">${formatPlays(ep.plays)} plays</span>
        </div>
      </div>
    </div>`;
}

// ── EPISODE DETAIL ──
function openEpisode(id) {
  currentEpisode = episodes.find(e => e.id === id);
  if (!currentEpisode) return;

  const ep = currentEpisode;
  const initials = ep.guest.split(' ').map(n => n[0]).join('').slice(0, 2);

  document.getElementById('detail-content').innerHTML = `
    <button class="back-btn" onclick="goBack()">← Back</button>

    <div class="detail-header fade-in">
      <div class="detail-category">${ep.category}</div>
      <h1 class="detail-title">${ep.title}</h1>
      <div class="detail-guest-row">
        <div class="guest-avatar">${initials}</div>
        <div>
          <div class="guest-name">${ep.guest}</div>
          <div class="guest-role">${ep.role}</div>
        </div>
      </div>
      <div class="detail-meta-row">
        <span>📅 ${ep.date}</span>
        <span>⏱ ${ep.duration}</span>
        <span>▶ ${formatPlays(ep.plays)} plays</span>
        <span>🏷 ${ep.tags.join(', ')}</span>
      </div>
    </div>

    ${buildAudioPlayer(ep)}

    <div class="detail-tabs">
      <button class="tab-btn active" onclick="switchTab(this,'show-notes')">Show Notes</button>
      <button class="tab-btn" onclick="switchTab(this,'timestamps')">Chapters</button>
      <button class="tab-btn" onclick="switchTab(this,'transcript')">Transcript</button>
      <button class="tab-btn" onclick="switchTab(this,'ai-notes')">✦ AI Notes</button>
    </div>

    <div id="tab-show-notes" class="tab-content active show-notes-content fade-in">
      <h3>Episode Summary</h3>
      <p>${ep.summary}</p>
      <h3>Key Topics</h3>
      <div class="topics-list">${ep.keyTopics.map(t => `<span class="topic-tag">${t}</span>`).join('')}</div>
      <h3>About the Guest</h3>
      <p>${ep.guest} is <em>${ep.role}</em>. This episode covers ${ep.tags.join(', ')} in depth.</p>
    </div>

    <div id="tab-timestamps" class="tab-content">
      <ul class="timestamps-list">
        ${ep.timestamps.map(ts => `
          <li onclick="seekToTimestamp('${ts.time}')">
            <span class="ts-time">${ts.time}</span>
            <span class="ts-chapter">${ts.chapter}</span>
          </li>`).join('')}
      </ul>
    </div>

    <div id="tab-transcript" class="tab-content">
      <div class="transcript-text">${ep.transcript}</div>
    </div>

    <div id="tab-ai-notes" class="tab-content">
      <div class="ai-panel">
        <div class="ai-panel-header">
          <span class="ai-badge">✦ AI Powered</span>
          <h4>Auto-generate show notes</h4>
        </div>
        <p>Claude AI will analyse this episode's transcript and generate a polished summary, extract key insights, and suggest social media posts — all in seconds.</p>
        <button class="btn-ai" onclick="generateAINotes(${ep.id})" id="ai-btn">✦ Generate AI Show Notes</button>
        <div class="ai-result" id="ai-result"></div>
      </div>
    </div>`;

  showPage('episode-detail');
  initPlayer();
}

function goBack() {
  stopPlayer();
  showPage(lastPage || 'home');
}

let lastPage = 'home';

// ── AUDIO PLAYER ──
function buildAudioPlayer(ep) {
  return `
    <div class="audio-player fade-in" id="audio-player">
      <div class="player-top">
        <button class="player-play-btn" id="play-btn" onclick="togglePlay()">▶</button>
        <div class="player-title-block">
          <div class="player-title">${ep.title}</div>
          <div class="player-guest">with ${ep.guest}</div>
        </div>
        <div class="waveform" id="waveform">
          <span></span><span></span><span></span><span></span><span></span>
        </div>
      </div>
      <div class="progress-container">
        <input type="range" class="progress-bar" id="progress-bar" min="0" max="100" value="0"
          oninput="seekTo(this.value)" style="--progress:0%">
      </div>
      <div class="player-controls-row">
        <div style="display:flex;gap:0.5rem;align-items:center">
          <span class="ctrl-btn" id="time-display" style="cursor:default;color:var(--text3)">0:00 / ${ep.duration}</span>
        </div>
        <div class="player-secondary-controls">
          <button class="ctrl-btn" onclick="skipBack()">« 15s</button>
          <button class="ctrl-btn" onclick="cycleSpeed()" id="speed-btn">1×</button>
          <button class="ctrl-btn" onclick="skipForward()">15s »</button>
        </div>
        <div class="volume-row">
          <span style="font-size:0.8rem;color:var(--text3)">🔊</span>
          <input type="range" class="volume-slider" min="0" max="100" value="80"
            oninput="setVolume(this.value)">
        </div>
      </div>
    </div>`;
}

function initPlayer() {
  playerState = { playing: false, progress: 0, volume: 80, speed: 1, seconds: 0, total: 5040 };
}

function togglePlay() {
  playerState.playing = !playerState.playing;
  const btn = document.getElementById('play-btn');
  const waveform = document.getElementById('waveform');
  if (!btn) return;

  if (playerState.playing) {
    btn.innerHTML = '⏸';
    waveform && waveform.classList.add('playing');
    playerInterval = setInterval(() => {
      playerState.seconds += playerState.speed;
      if (playerState.seconds >= playerState.total) {
        playerState.seconds = 0;
        playerState.playing = false;
        btn.innerHTML = '▶';
        waveform && waveform.classList.remove('playing');
        clearInterval(playerInterval);
        return;
      }
      const pct = (playerState.seconds / playerState.total) * 100;
      const bar = document.getElementById('progress-bar');
      const timeDisp = document.getElementById('time-display');
      if (bar) { bar.value = pct; bar.style.setProperty('--progress', pct + '%'); }
      if (timeDisp && currentEpisode) timeDisp.textContent = `${formatSecs(playerState.seconds)} / ${currentEpisode.duration}`;
    }, 1000);
  } else {
    btn.innerHTML = '▶';
    waveform && waveform.classList.remove('playing');
    clearInterval(playerInterval);
  }
}

function stopPlayer() {
  clearInterval(playerInterval);
  playerState.playing = false;
}

function seekTo(val) {
  playerState.seconds = (val / 100) * playerState.total;
  const bar = document.getElementById('progress-bar');
  if (bar) bar.style.setProperty('--progress', val + '%');
}

function seekToTimestamp(time) {
  const parts = time.split(':').reverse();
  let secs = 0;
  parts.forEach((p, i) => secs += parseInt(p) * Math.pow(60, i));
  playerState.seconds = secs;
  const pct = (secs / playerState.total) * 100;
  const bar = document.getElementById('progress-bar');
  if (bar) { bar.value = pct; bar.style.setProperty('--progress', pct + '%'); }
  if (!playerState.playing) togglePlay();
  switchTab(document.querySelector('.tab-btn'), 'show-notes');
  showToast('Jumped to chapter ✓');
}

function skipBack() { playerState.seconds = Math.max(0, playerState.seconds - 15); seekTo((playerState.seconds / playerState.total) * 100); }
function skipForward() { playerState.seconds = Math.min(playerState.total, playerState.seconds + 15); seekTo((playerState.seconds / playerState.total) * 100); }
function setVolume(val) { playerState.volume = val; }
function cycleSpeed() {
  const speeds = [1, 1.25, 1.5, 1.75, 2, 0.75];
  const idx = speeds.indexOf(playerState.speed);
  playerState.speed = speeds[(idx + 1) % speeds.length];
  const btn = document.getElementById('speed-btn');
  if (btn) btn.textContent = playerState.speed + '×';
}

function formatSecs(s) {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
  return `${m}:${String(sec).padStart(2,'0')}`;
}

// ── TABS ──
function switchTab(btn, id) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById('tab-' + id);
  if (el) el.classList.add('active');
}

// ── AI SHOW NOTES (simulated) ──
function generateAINotes(episodeId) {
  const btn = document.getElementById('ai-btn');
  const result = document.getElementById('ai-result');
  if (!btn || !result) return;

  const ep = episodes.find(e => e.id === episodeId);
  btn.disabled = true;
  btn.innerHTML = `Generating <span class="loading-dots"><span></span><span></span><span></span></span>`;

  setTimeout(() => {
    result.innerHTML = `
      <strong>✦ AI-Generated Summary</strong>
      <p>In this episode, ${ep.guest} (${ep.role}) dives deep into ${ep.keyTopics[0].toLowerCase()} and ${ep.keyTopics[1].toLowerCase()}. The conversation is refreshingly candid — rather than offering polished talking points, the guest shares hard-won insights from years of experience.</p>
      <p>Key themes include the tension between ${ep.keyTopics[2] || 'speed and quality'}, and why most practitioners get ${ep.keyTopics[0].toLowerCase()} wrong from the start. The final 20 minutes are particularly valuable for anyone looking to apply these ideas immediately.</p>
      <br>
      <strong>✦ 3 Quotable Moments</strong>
      <p>1. "The problem isn't that people don't care — it's that they don't know where to look."</p>
      <p>2. "Every expert was once a beginner who refused to quit."</p>
      <p>3. "The best time to start was yesterday. The second best time is right now."</p>
      <br>
      <strong>✦ Suggested Social Post</strong>
      <p style="font-style:italic">"Just dropped a new episode with ${ep.guest}. We talked about ${ep.keyTopics.slice(0,2).join(' and ')} — and I haven't stopped thinking about it. 🎙 Link in bio. #${ep.tags[0]} #${ep.tags[1] || 'podcast'}"</p>
    `;
    result.classList.add('visible');
    btn.disabled = false;
    btn.innerHTML = '✦ Regenerate';
  }, 2200);
}

// ── SEARCH PAGE ──
function renderSearchPage() {
  document.getElementById('search-results').innerHTML = '';
  document.getElementById('rag-answer').classList.remove('visible');
  document.getElementById('search-query-input').value = '';
}

function handleSearch(e) {
  if (e && e.key !== 'Enter') return;
  const query = document.getElementById('search-query-input').value.trim().toLowerCase();
  if (!query) return;
  performSearch(query);
}

function submitSearch() {
  const query = document.getElementById('search-query-input').value.trim().toLowerCase();
  if (query) performSearch(query);
}

function performSearch(query) {
  // RAG-style answer simulation
  const ragBox = document.getElementById('rag-answer');
  const ragText = document.getElementById('rag-text');
  const ragSrc = document.getElementById('rag-source-ep');

  // Find best matching episode
  const scored = episodes.map(ep => {
    const haystack = [ep.title, ep.description, ep.summary, ep.transcript, ...ep.keyTopics, ...ep.tags].join(' ').toLowerCase();
    const words = query.split(' ');
    const hits = words.filter(w => haystack.includes(w)).length;
    return { ep, score: hits };
  }).sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (best.score > 0) {
    ragBox.classList.add('visible');
    ragText.textContent = `Based on the podcast archive, the most relevant episode is "${best.ep.title}" with ${best.ep.guest}. ${best.ep.summary} This episode covers ${best.ep.keyTopics.join(', ')}.`;
    ragSrc.textContent = best.ep.title;
    ragSrc.onclick = () => openEpisode(best.ep.id);
  }

  // Show matching results
  const results = scored.filter(s => s.score > 0);
  const container = document.getElementById('search-results');

  if (results.length === 0) {
    container.innerHTML = `<p style="color:var(--text3);padding:2rem 0;text-align:center">No episodes matched "${query}"</p>`;
    return;
  }

  container.innerHTML = results.map(({ ep }) => {
    const words = query.split(' ');
    const snippet = highlightSnippet(ep.description, words);
    return `
      <div class="search-result-item" onclick="openEpisode(${ep.id})">
        <img class="result-img" src="${ep.cover}" alt="${ep.title}" loading="lazy">
        <div class="result-body">
          <div class="result-category">${ep.category}</div>
          <div class="result-title">${ep.title}</div>
          <div class="result-guest">with ${ep.guest} · ${ep.duration}</div>
          <div class="result-snippet">${snippet}</div>
        </div>
      </div>`;
  }).join('');
}

function highlightSnippet(text, words) {
  let out = text.substring(0, 140) + '...';
  words.forEach(w => {
    if (!w) return;
    const re = new RegExp(`(${w})`, 'gi');
    out = out.replace(re, '<mark>$1</mark>');
  });
  return out;
}

// ── UTILITIES ──
function formatPlays(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return Math.round(n / 1000) + 'K';
  return n.toString();
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2500);
}

// ── START ──
window.addEventListener('DOMContentLoaded', init);
