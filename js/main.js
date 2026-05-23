// main.js — Logique principale : initialisation de chaque page

// ── Thème dark/light ────────────────────────────────────────────────────────

function initTheme() {
  const saved = localStorage.getItem('ft-theme');
  if (saved === 'light') document.documentElement.classList.add('light-mode');
}

function toggleTheme() {
  const isLight = document.documentElement.classList.toggle('light-mode');
  localStorage.setItem('ft-theme', isLight ? 'light' : 'dark');
  document.getElementById('theme-icon').textContent = isLight ? '🌙' : '☀️';
  setTimeout(refreshAllCharts, 50);
}

// ── Bootstrap ───────────────────────────────────────────────────────────────

async function _bootApp(email) {
  const loadingEl = document.getElementById('loading');
  const appEl     = document.getElementById('app');

  loadingEl?.classList.remove('hidden');
  if (loadingEl && !loadingEl.querySelector('.spinner')) {
    loadingEl.innerHTML = `<div style="text-align:center"><div class="spinner" style="margin:0 auto 16px"></div><p class="text-secondary text-sm">Chargement...</p></div>`;
  }
  appEl?.classList.add('hidden');

  _injectLogoutBtn(email);

  const sessions = await loadData();
  sessions.sort((a, b) => b.date.localeCompare(a.date));
  window.sessions = sessions;

  loadingEl?.classList.add('hidden');
  appEl?.classList.remove('hidden');

  const page = document.body.dataset.page;
  if (!document.querySelector('.bottom-nav')) renderBottomNav(page);

  if (page === 'accueil')            initAccueil(sessions);
  else if (page === 'exercices')     initExercices(sessions);
  else if (page === 'groupes')       initGroupes(sessions);
  else if (page === 'symptomes')     initSymptomes(sessions);
  else if (page === 'seance')        initSeance(sessions);
  else if (page === 'journal')       initJournal(sessions);
  else if (page === 'calendrier')    initCalendrier(sessions);
  else if (page === 'importer')      initImporter();
}

document.addEventListener('DOMContentLoaded', async () => {
  initTheme();
  const isLight = document.documentElement.classList.contains('light-mode');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = isLight ? '🌙' : '☀️';

  const btn = document.getElementById('theme-toggle');
  if (btn) btn.addEventListener('click', toggleTheme);

  const loadingEl = document.getElementById('loading');
  const appEl     = document.getElementById('app');

  if (typeof _sb === 'undefined' || !_sb) {
    loadingEl?.classList.add('hidden');
    appEl?.classList.add('hidden');
    if (loadingEl) {
      loadingEl.style.display = 'flex';
      loadingEl.innerHTML = `
        <div style="text-align:center;padding:3rem;max-width:360px">
          <div style="font-size:2.5rem;margin-bottom:1rem">🌐</div>
          <p style="font-weight:600;margin-bottom:.5rem">FitTrack n'a pas pu se connecter</p>
          <p style="color:var(--text-muted);font-size:.875rem">
            La librairie Supabase n'a pas pu être chargée. Vérifie ta connexion Internet et recharge la page.
          </p>
        </div>`;
    }
    return;
  }

  try {
    const { data: { session: authSession }, error: authErr } = await _sb.auth.getSession();
    if (authErr) throw authErr;

    if (!authSession) {
      loadingEl?.classList.add('hidden');
      appEl?.classList.add('hidden');
      _renderAuthModal();
      return;
    }

    await _bootApp(authSession.user.email);

  } catch (e) {
    console.error('FitTrack boot error:', e);
    loadingEl?.classList.add('hidden');
    appEl?.classList.add('hidden');

    if (typeof _sb === 'undefined' || e?.status === 0 || e?.message?.toLowerCase().includes('fetch')) {
      _renderAuthModal();
      return;
    }

    if (loadingEl) {
      loadingEl.classList.remove('hidden');
      loadingEl.innerHTML = `
        <div style="text-align:center;padding:3rem">
          <div style="font-size:2.5rem;margin-bottom:1rem">⚠️</div>
          <p style="color:#ef4444;font-weight:600;margin-bottom:.5rem">${e.message}</p>
          <p style="color:var(--text-muted);font-size:.875rem">
            Importez votre première séance via la page <a href="./pages/importer.html" style="color:var(--accent)">Importer</a>.
          </p>
        </div>`;
    }
  }
});

// ── Authentification ─────────────────────────────────────────────────────────

function _renderAuthModal() {
  const overlay = document.createElement('div');
  overlay.id = 'ft-auth-overlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:300;background:var(--bg-app);display:flex;align-items:center;justify-content:center;padding:20px';
  overlay.innerHTML = `
    <div style="width:100%;max-width:360px">
      <div style="text-align:center;margin-bottom:28px">
        <span style="display:inline-block;background:var(--accent);color:#fff;font-size:.875rem;font-weight:800;padding:6px 12px;border-radius:8px;letter-spacing:.05em;margin-bottom:12px">FT</span>
        <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-.03em">FitTrack</h1>
        <p style="color:var(--text-secondary);font-size:.875rem;margin-top:6px">Connecte-toi pour accéder à tes données</p>
      </div>
      <div class="card" style="padding:24px">
        <div id="ft-auth-error" style="display:none;background:var(--red-bg);border:1px solid var(--red);border-radius:8px;padding:8px 12px;font-size:.8125rem;color:var(--red);margin-bottom:14px"></div>
        <input id="ft-auth-email" type="email" placeholder="Email" autocomplete="email"
          style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-family:'Inter',sans-serif;font-size:.875rem;padding:11px 14px;outline:none;margin-bottom:10px;box-sizing:border-box;transition:border-color .15s">
        <input id="ft-auth-password" type="password" placeholder="Mot de passe" autocomplete="current-password"
          style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;color:var(--text-primary);font-family:'Inter',sans-serif;font-size:.875rem;padding:11px 14px;outline:none;margin-bottom:16px;box-sizing:border-box;transition:border-color .15s">
        <button id="ft-auth-submit" class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:.9375rem">Se connecter</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const emailInput = overlay.querySelector('#ft-auth-email');
  const passInput  = overlay.querySelector('#ft-auth-password');
  const submitBtn  = overlay.querySelector('#ft-auth-submit');
  const errorDiv   = overlay.querySelector('#ft-auth-error');

  async function doLogin() {
    const email = emailInput.value.trim();
    const pass  = passInput.value;
    if (!email || !pass) return;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Connexion…';
    errorDiv.style.display = 'none';
    const { error } = await _sb.auth.signInWithPassword({ email, password: pass });
    if (error) {
      const msg = error.message.includes('Email not confirmed')
        ? 'Email non confirmé — confirme ton adresse email ou désactive la confirmation dans Supabase → Authentication → Configuration.'
        : error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')
          ? 'Email ou mot de passe incorrect.'
          : error.message;
      errorDiv.textContent = msg;
      errorDiv.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Se connecter';
    } else {
      overlay.remove();
      try {
        await _bootApp(email);
      } catch (e) {
        console.error('FitTrack boot error after login:', e);
        _renderAuthModal();
      }
    }
  }

  submitBtn.addEventListener('click', doLogin);
  passInput.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  emailInput.addEventListener('keydown', e => { if (e.key === 'Enter') passInput.focus(); });
  setTimeout(() => emailInput.focus(), 100);
}

function _injectLogoutBtn(email) {
  if (document.getElementById('ft-logout-btn')) return;
  const themeToggle = document.querySelector('.navbar .theme-toggle');
  if (!themeToggle) return;
  const logoutBtn = document.createElement('button');
  logoutBtn.id = 'ft-logout-btn';
  logoutBtn.className = 'btn btn-ghost';
  logoutBtn.title = email || 'Déconnexion';
  logoutBtn.style.cssText = 'font-size:.75rem;padding:5px 10px;color:var(--text-muted)';
  logoutBtn.textContent = '→ Quitter';
  themeToggle.parentElement.insertBefore(logoutBtn, themeToggle);
  logoutBtn.addEventListener('click', async () => {
    await _sb.auth.signOut();
    window.location.reload();
  });
}

// ── Navigation bas de page (mobile) ─────────────────────────────────────────

function renderBottomNav(page) {
  const inPages = window.location.pathname.includes('/pages/');
  const root    = inPages ? '../' : './';
  const p       = inPages ? './'  : './pages/';

  const SVG = {
    accueil:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    journal:    `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>`,
    calendrier: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 3h-1V1h-2v2H7V1H5v2H4C2.9 5 2 5.9 2 7v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z"/></svg>`,
    exercices:  `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/></svg>`,
    importer:   `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
  };

  const items = [
    { id: 'accueil',    label: 'Home',      href: root + 'index.html' },
    { id: 'journal',    label: 'Journal',   href: p + 'journal.html' },
    { id: 'calendrier', label: 'Calendrier',href: p + 'calendrier.html' },
    { id: 'exercices',  label: 'Exercices', href: p + 'exercices.html' },
    { id: 'importer',   label: 'Import',    href: p + 'importer.html' },
  ];

  const nav = document.createElement('nav');
  nav.className = 'bottom-nav';
  nav.setAttribute('aria-label', 'Navigation principale');
  nav.innerHTML = items.map(item =>
    `<a href="${item.href}" class="bottom-nav-item${page === item.id ? ' active' : ''}" aria-label="${item.label}">
      <span class="bottom-nav-icon">${SVG[item.id]}</span>
      <span>${item.label}</span>
    </a>`
  ).join('');
  document.body.appendChild(nav);
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE ACCUEIL — DASHBOARD
// ════════════════════════════════════════════════════════════════════════════

function initAccueil(sessions) {
  let currentDays = 30;
  let charts = {};

  function render(days) {
    currentDays = days;
    const filtered = filterByDays(sessions, days);
    renderStatsCards(filtered);
    renderPRCarousel(sessions);
    renderAlerts(sessions);
    renderRecentSessions(sessions.slice(0, 5));
    charts = renderDashboardCharts(filtered, charts);
  }

  // Boutons période
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      render(parseInt(btn.dataset.days) || 0);
    });
  });

  render(currentDays);
}

function renderStatsCards(sessions) {
  const el = document.getElementById('stats-grid');
  if (!el) return;
  const totalVol   = sessions.reduce((s, sess) => s + getSessionVolume(sess), 0);
  const avgVol     = sessions.length ? Math.round(totalVol / sessions.length) : 0;
  const symSessions = sessions.filter(s => s.symptoms?.during_session?.intensity != null);
  const avgIntensity = symSessions.length
    ? (symSessions.reduce((acc, s) => acc + s.symptoms.during_session.intensity, 0) / symSessions.length).toFixed(1)
    : '—';

  el.innerHTML = [
    { label: 'Séances',                   value: sessions.length, unit: '',    sub: 'total période',            color: 'blue',   icon: '🏋️' },
    { label: 'Volume total',              value: formatVolume(totalVol), unit: '', sub: 'charges travail',       color: 'green',  icon: '📈' },
    { label: 'Tonnage moyen/séance',      value: formatVolume(avgVol),  unit: '', sub: 'moyenne sur la période', color: 'orange', icon: '⚖️' },
    { label: 'Intensité moy. pendant',    value: avgIntensity,   unit: '/10', sub: `sur ${symSessions.length} séance${symSessions.length > 1 ? 's' : ''} renseignée${symSessions.length > 1 ? 's' : ''}`, color: 'purple', icon: '🔬' }
  ].map(s => `
    <div class="stat-card ${s.color} fade-in">
      <span class="stat-icon">${s.icon}</span>
      <div class="stat-value">${s.value}</div>
      <div class="stat-label">${s.label} <span style="color:var(--text-muted);font-size:.75rem">${s.unit}</span></div>
      <div class="stat-sub">${s.sub}</div>
    </div>
  `).join('');
}

function renderDashboardCharts(sessions, existingCharts = {}) {
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  const labels  = sorted.map(s => formatDateShort(s.date));
  const volumes = sorted.map(s => getSessionVolume(s));

  destroyChart('chart-volume');

  createLineChart('chart-volume', labels, [{
    label:           'Volume (kg)',
    data:            volumes,
    borderColor:     '#3b82f6',
    backgroundColor: rgba('#3b82f6', 0.08),
    fill: true
  }]);
  return {};
}

function renderPRCarousel(sessions) {
  const el = document.getElementById('pr-carousel-section');
  if (!el) return;

  const MEDAL = {
    charge:  { img: './assets/medal_charge.png',  label: 'Charge max',    color: '#f59e0b' },
    volume:  { img: './assets/medal_volume.png',  label: 'Volume record', color: '#3b82f6' },
    premier: { img: './assets/medal_pr.png',      label: 'Premier fois',  color: '#8b5cf6' },
    streak:  { img: './assets/medal_streak.png',  label: 'Progression',   color: '#10b981' },
  };

  const prItems = sessions.slice(0, 5).flatMap(s =>
    detectSessionPRs(s, sessions).map(pr => ({
      type:     pr.type,
      exercise: pr.exercise.replace(/\s*\(.*?\)\s*$/, ''),
      value:    pr.value,
      sub:      pr.label,
      date:     s.date,
    }))
  ).slice(0, 6);

  const progItems = detectProgressions(sessions).slice(0, 3).map(p => ({
    type:     'streak',
    exercise: p.name.replace(/\s*\(.*?\)\s*$/, ''),
    value:    `+${p.pct}%`,
    sub:      `${p.from} → ${p.to} kg`,
    date:     null,
  }));

  const items = [...prItems, ...progItems];

  if (!items.length) { el.innerHTML = ''; return; }

  el.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="font-semibold" style="font-size:1rem">Records & Progressions</h3>
        <p class="text-xs text-muted" style="margin-top:2px">Tes dernières performances</p>
      </div>
      <div class="pr-carousel-dots" id="pr-dots">
        ${items.map((_, i) => `<span class="pr-dot${i === 0 ? ' active' : ''}"></span>`).join('')}
      </div>
    </div>
    <div class="pr-carousel" id="pr-carousel">
      ${items.map((item, i) => {
        const medal = MEDAL[item.type] || MEDAL.premier;
        return `
          <div class="pr-carousel-card fade-in" style="animation-delay:${i * 0.05}s">
            <div class="pr-medal-wrap">
              <img src="${medal.img}" class="pr-medal-img" alt="${medal.label}"
                   style="animation-delay:${i * 0.4}s">
            </div>
            <div class="pr-medal-type" style="color:${medal.color}">${medal.label}</div>
            <div class="pr-medal-name">${item.exercise}</div>
            <div class="pr-medal-value" style="color:${medal.color}">${item.value}</div>
            <div class="pr-medal-sub">${item.sub}</div>
            ${item.date ? `<div class="pr-medal-date">${formatDate(item.date)}</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;

  const carousel = el.querySelector('#pr-carousel');
  const dots     = el.querySelectorAll('.pr-dot');
  let isScrolling;

  carousel.addEventListener('scroll', () => {
    clearTimeout(isScrolling);
    isScrolling = setTimeout(() => {
      const cardW = carousel.querySelector('.pr-carousel-card')?.offsetWidth || 1;
      const gap   = 16;
      const idx   = Math.round(carousel.scrollLeft / (cardW + gap));
      dots.forEach((d, i) => d.classList.toggle('active', i === idx));
    }, 50);
  });
}

function renderAlerts(sessions) {
  const progressions = detectProgressions(sessions);
  const newEx        = detectNewExercises(sessions, 14);

  const alertsEl = document.getElementById('alerts-grid');
  if (!alertsEl) return;

  const makeCard = (title, icon, color, items, emptyText) => `
    <div class="alert-card fade-in">
      <div class="flex items-center gap-2 mb-3">
        <span>${icon}</span>
        <span class="font-semibold text-sm">${title}</span>
      </div>
      ${items.length ? items.map(i => `
        <div class="alert-item">
          <div class="alert-dot ${color}"></div>
          <div>
            <div class="text-sm" style="color:var(--text-primary)">${i.title}</div>
            <div class="text-xs text-muted">${i.sub}</div>
          </div>
        </div>
      `).join('') : `<p class="text-xs text-muted">${emptyText}</p>`}
    </div>
  `;

  alertsEl.innerHTML = [
    makeCard('Progressions notables', '📈', 'prog',
      progressions.slice(0, 5).map(p => ({ title: p.name.replace(/\s*\(.*?\)\s*$/, ''), sub: `+${p.pct}% (${p.from}→${p.to} kg)` })),
      'Pas encore de progression de 15%+'),
    makeCard('Nouveaux exercices (14j)', '✨', 'new',
      newEx.slice(0, 5).map(e => ({ title: e.name, sub: `${formatCategory(e.category)} — première fois le ${formatDate(e.firstSeen)}` })),
      'Aucun nouvel exercice cette quinzaine')
  ].join('');
}

function renderRecentSessions(sessions) {
  const el = document.getElementById('recent-sessions');
  if (!el) return;
  el.innerHTML = sessions.map(s => {
    const vol = getSessionVolume(s);
    const dotColor = getTypeColor(s.type);
    return `
      <a href="pages/seance.html?id=${s.id}" class="session-row" style="text-decoration:none">
        <div class="session-type-dot" style="background:${dotColor}"></div>
        <div style="flex:1;min-width:0">
          <div class="text-sm font-semibold" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</div>
          <div class="text-xs text-muted">${formatDate(s.date)}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="text-sm font-semibold">${formatVolume(vol)}</div>
          <div class="text-xs text-muted">${s.symptoms?.during_session?.intensity != null ? `🔬 ${s.symptoms.during_session.intensity}/10` : '—'}</div>
        </div>
        <span style="color:var(--text-muted);font-size:.75rem">›</span>
      </a>
    `;
  }).join('') || '<p class="text-sm text-muted" style="padding:16px">Aucune séance enregistrée.</p>';
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE EXERCICES
// ════════════════════════════════════════════════════════════════════════════

function initExercices(sessions) {
  const allExercises = getAllExercises(sessions);
  const newExercises = new Set(detectNewExercises(sessions, 14).map(e => e.name));
  const prs          = calculateAllPRs(sessions);
  let activeCategory = 'tous';

  function render(query = '') {
    let list = allExercises;
    if (activeCategory !== 'tous') list = list.filter(e => e.category === activeCategory);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(q) || (e.category || '').toLowerCase().includes(q));
    }
    renderExerciseGrid(list, sessions, newExercises, prs);
  }

  // Catégories uniques
  const categories = ['tous', ...new Set(allExercises.map(e => e.category).filter(Boolean))];
  const filtersEl  = document.getElementById('category-filters');
  if (filtersEl) {
    filtersEl.innerHTML = categories.map(cat => `
      <button class="filter-btn ${cat === 'tous' ? 'active' : ''}" data-cat="${cat}"
        style="${cat !== 'tous' ? `color:${getCategoryColor(cat)};border-color:${getCategoryColor(cat)}30` : ''}">
        ${cat === 'tous' ? 'Tous' : formatCategory(cat)}
      </button>
    `).join('');
    filtersEl.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filtersEl.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('active');
          b.style.background = '';
          b.style.color = b.dataset.cat !== 'tous' ? getCategoryColor(b.dataset.cat) + '99' : '';
        });
        btn.classList.add('active');
        btn.style.background = btn.dataset.cat !== 'tous' ? getCategoryColor(btn.dataset.cat) : 'var(--accent)';
        btn.style.color = '#fff';
        activeCategory = btn.dataset.cat;
        render(document.getElementById('search-input')?.value || '');
      });
    });
    // Active style initial
    filtersEl.querySelector('[data-cat="tous"]').style.background = 'var(--accent)';
    filtersEl.querySelector('[data-cat="tous"]').style.color = '#fff';
    filtersEl.querySelector('[data-cat="tous"]').style.border = 'none';
  }

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => render(e.target.value));
  }

  // Modal
  document.addEventListener('click', e => {
    if (e.target.closest('.exercise-card')) {
      const name = e.target.closest('.exercise-card').dataset.name;
      openExerciseModal(name, sessions, prs);
    }
    if (e.target.closest('#modal-close') || e.target.id === 'modal-backdrop') {
      closeModal();
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  render();
}

function renderExerciseGrid(exercises, sessions, newExercises, prs) {
  const grid = document.getElementById('exercise-grid');
  if (!grid) return;
  if (!exercises.length) {
    grid.innerHTML = '<p class="text-sm text-muted" style="padding:24px;grid-column:1/-1">Aucun exercice trouvé.</p>';
    return;
  }
  grid.innerHTML = exercises.map(ex => {
    const color    = getCategoryColor(ex.category);
    const history  = getExerciseHistory(sessions, ex.name);
    const pr       = prs[ex.name] || {};
    const isNew    = newExercises.has(ex.name);
    const lastEntry = history[history.length - 1];
    return `
      <div class="exercise-card" data-name="${ex.name.replace(/"/g, '&quot;')}">
        <div class="exercise-category-bar" style="background:${color}"></div>
        <div style="padding-left:8px">
          <div class="flex items-center gap-2 mb-1">
            ${isNew ? '<span class="badge badge-blue">Nouveau</span>' : ''}
            <span class="badge" style="background:${color}22;color:${color}">${formatCategory(ex.category)}</span>
          </div>
          <div class="font-semibold text-sm" style="margin:6px 0 4px;line-height:1.3">${ex.name}</div>
          <div class="text-xs text-muted mb-3">${history.length} séance${history.length > 1 ? 's' : ''}</div>
          <div class="flex gap-3">
            ${pr.maxWeight ? `<div><div class="font-bold" style="color:${color}">${pr.maxWeight} kg</div><div class="text-xs text-muted">Max</div></div>` : ''}
            ${pr.maxReps   ? `<div><div class="font-bold text-primary">${pr.maxReps}</div><div class="text-xs text-muted">Reps</div></div>` : ''}
            ${lastEntry    ? `<div><div class="font-bold text-primary">${formatDateShort(lastEntry.date)}</div><div class="text-xs text-muted">Dernière</div></div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openExerciseModal(name, sessions, prs) {
  const ex      = getAllExercises(sessions).find(e => e.name === name);
  const history = getExerciseHistory(sessions, name);
  const pr      = prs[name] || {};
  const color   = ex ? getCategoryColor(ex.category) : '#3b82f6';

  const backdrop = document.getElementById('modal-backdrop');
  const content  = document.getElementById('modal-content');
  if (!backdrop || !content) return;

  const labels  = history.map(h => formatDateShort(h.date));
  const weights = history.map(h => h.maxWeight);
  const volumes = history.map(h => h.volume);

  content.innerHTML = `
    <div style="padding:20px 20px 0">
      <div class="flex items-center justify-between mb-2">
        <div>
          <span class="badge" style="background:${color}22;color:${color};margin-bottom:6px;display:inline-block">${formatCategory(ex?.category)}</span>
          <h2 class="font-bold" style="font-size:1.125rem;line-height:1.3">${name}</h2>
        </div>
        <button id="modal-close" class="btn btn-ghost" style="flex-shrink:0">✕ Fermer</button>
      </div>
      <div class="flex gap-4 mb-4">
        ${pr.maxWeight ? `<div class="stat-card ${''}" style="padding:12px 16px;flex:1"><div class="text-xs text-muted">Charge max</div><div class="font-bold" style="font-size:1.25rem;color:${color}">${pr.maxWeight} kg</div></div>` : ''}
        ${pr.maxReps   ? `<div class="stat-card" style="padding:12px 16px;flex:1"><div class="text-xs text-muted">Reps max</div><div class="font-bold" style="font-size:1.25rem">${pr.maxReps} reps</div></div>` : ''}
        <div class="stat-card" style="padding:12px 16px;flex:1"><div class="text-xs text-muted">Séances</div><div class="font-bold" style="font-size:1.25rem">${history.length}</div></div>
      </div>
    </div>
    <div style="padding:0 20px 20px">
      ${history.length < 2 ? '<p class="text-sm text-muted">Pas assez de données pour afficher l\'évolution.</p>' : `
        <div class="mb-4">
          <div class="card-title mb-2">Évolution de la charge max (kg)</div>
          <div class="chart-container" style="height:180px"><canvas id="modal-chart-weight"></canvas></div>
        </div>
        <div>
          <div class="card-title mb-2">Volume par séance (kg)</div>
          <div class="chart-container" style="height:180px"><canvas id="modal-chart-volume"></canvas></div>
        </div>
      `}
    </div>
  `;

  backdrop.classList.remove('hidden');
  requestAnimationFrame(() => backdrop.classList.add('open'));

  if (history.length >= 2) {
    createLineChart('modal-chart-weight', labels, [{
      label: 'Charge max (kg)', data: weights, borderColor: color, backgroundColor: rgba(color, 0.08), fill: true
    }]);
    createLineChart('modal-chart-volume', labels, [{
      label: 'Volume (kg)', data: volumes, borderColor: '#10b981', backgroundColor: rgba('#10b981', 0.08), fill: true
    }]);
  }
}

function closeModal() {
  const backdrop = document.getElementById('modal-backdrop');
  if (!backdrop) return;
  backdrop.classList.remove('open');
  setTimeout(() => backdrop.classList.add('hidden'), 200);
  ['modal-chart-weight','modal-chart-volume'].forEach(destroyChart);
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE GROUPES MUSCULAIRES
// ════════════════════════════════════════════════════════════════════════════

function initGroupes(sessions) {
  const dist     = getCategoryDistribution(sessions);
  const weekData = getWeeklyVolumeByCategory(sessions);
  const imbal    = detectImbalances(sessions, 8);

  // Donut répartition globale
  const cats   = Object.keys(dist).sort((a, b) => dist[b] - dist[a]);
  const vals   = cats.map(c => dist[c]);
  const colors = cats.map(c => getCategoryColor(c));
  createDoughnutChart('chart-distribution', cats.map(formatCategory), vals, colors);

  // Barres volumes par semaine
  const weeks     = Object.keys(weekData).sort();
  const allCats   = [...new Set(weeks.flatMap(w => Object.keys(weekData[w])))];
  const weekLabels = weeks.map(w => {
    const d = new Date(w + 'T00:00:00');
    return `${d.getDate()}/${d.getMonth() + 1}`;
  });
  createBarChart('chart-weekly', weekLabels,
    allCats.map(cat => ({
      label:           formatCategory(cat),
      data:            weeks.map(w => weekData[w][cat] || 0),
      backgroundColor: rgba(getCategoryColor(cat), 0.75)
    })),
    { plugins: { legend: { position: 'bottom' } } }
  );

  // Imbalances
  const imbalEl = document.getElementById('imbalances-list');
  if (imbalEl) {
    if (!imbal.length) {
      imbalEl.innerHTML = '<p class="text-sm text-muted">Aucun déséquilibre détecté (seuil 8% du volume total).</p>';
    } else {
      imbalEl.innerHTML = imbal.map(i => `
        <div class="flex items-center gap-3 mb-3">
          <div class="badge badge-amber">${i.pct}%</div>
          <div>
            <div class="text-sm font-semibold">${formatCategory(i.category)}</div>
            <div class="text-xs text-muted">Volume faible : ${i.volume.toLocaleString()} kg total</div>
          </div>
        </div>
      `).join('');
    }
  }

  // Tableau par catégorie
  const tableEl = document.getElementById('category-table');
  if (tableEl) {
    const total = Object.values(dist).reduce((s, v) => s + v, 0);
    tableEl.innerHTML = cats.map(cat => {
      const pct = Math.round((dist[cat] / total) * 100);
      const col = getCategoryColor(cat);
      return `
        <div class="flex items-center gap-3 mb-3">
          <div style="width:10px;height:10px;border-radius:50%;background:${col};flex-shrink:0"></div>
          <div style="flex:1">
            <div class="flex justify-between mb-1">
              <span class="text-sm font-semibold">${formatCategory(cat)}</span>
              <span class="text-sm text-muted">${formatVolume(dist[cat])} (${pct}%)</span>
            </div>
            <div style="height:6px;background:var(--border);border-radius:3px;overflow:hidden">
              <div style="width:${pct}%;height:100%;background:${col};border-radius:3px;transition:width .4s ease"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE SYMPTÔMES
// ════════════════════════════════════════════════════════════════════════════

function initSymptomes(sessions) {
  const withSymptoms = [...sessions]
    .filter(s => s.symptoms && Object.values(s.symptoms).some(v => v?.intensity != null))
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!withSymptoms.length) {
    const appEl = document.getElementById('app');
    if (appEl) appEl.innerHTML = '<div style="padding:3rem;text-align:center" class="text-muted">Aucune donnée symptomatique enregistrée.</div>';
    return;
  }

  const labels = withSymptoms.map(s => formatDateShort(s.date));

  // Graphique intensité multi-courbes
  createLineChart('chart-intensity', labels, [
    { label: 'Pendant',  data: withSymptoms.map(s => getSymptomIntensity(s, 'during_session')),  borderColor: '#ef4444', backgroundColor: rgba('#ef4444', 0.06), fill: true, spanGaps: true },
    { label: 'Fin',      data: withSymptoms.map(s => getSymptomIntensity(s, 'end_of_session')),  borderColor: '#f97316', backgroundColor: rgba('#f97316', 0.06), fill: true, spanGaps: true },
    { label: 'Post 24h', data: withSymptoms.map(s => getSymptomIntensity(s, 'post_session_24h')), borderColor: '#f59e0b', backgroundColor: rgba('#f59e0b', 0.06), fill: true, spanGaps: true },
    { label: 'Post 48h', data: withSymptoms.map(s => getSymptomIntensity(s, 'post_session_48h')), borderColor: '#8b5cf6', backgroundColor: rgba('#8b5cf6', 0.06), fill: true, spanGaps: true }
  ], {
    scales: { y: { min: 0, max: 10, ticks: { stepSize: 2 } } }
  });

  // Heatmap localisations
  const heatmap   = getLocationHeatmap(sessions);
  const heatmapEl = document.getElementById('location-heatmap');
  if (heatmapEl) {
    const maxCount = Math.max(...Object.values(heatmap), 1);
    const allLocs  = Object.keys(SYMPTOM_LOCATIONS_FR);
    heatmapEl.innerHTML = allLocs.map(loc => {
      const count  = heatmap[loc] || 0;
      const pct    = count / maxCount;
      const cls    = pct === 0 ? 'intensity-0' : pct < 0.25 ? 'intensity-1' : pct < 0.5 ? 'intensity-2' : pct < 0.75 ? 'intensity-3' : 'intensity-4';
      return `
        <div class="location-cell ${cls}" title="${count} occurrence${count > 1 ? 's' : ''}">
          <div style="font-weight:600">${SYMPTOM_LOCATIONS_FR[loc]}</div>
          <div style="font-size:.6875rem;opacity:.75">${count}×</div>
        </div>
      `;
    }).join('');
  }

  // Corrélation volume/intensité
  const corrData = withSymptoms
    .filter(s => getSymptomIntensity(s, 'during_session') !== null)
    .map(s => ({ x: getSessionVolume(s), y: getSymptomIntensity(s, 'during_session') }));

  createScatterChart('chart-correlation', [{
    label:           'Séances',
    data:            corrData,
    backgroundColor: rgba('#3b82f6', 0.6),
    pointRadius:     6,
    pointHoverRadius: 8
  }], 'Volume (kg)', 'Intensité pendant (/10)');

  // Tableau récapitulatif
  const tableEl = document.getElementById('symptoms-table');
  if (tableEl) {
    tableEl.innerHTML = [...withSymptoms].reverse().map(s => {
      const dur = s.symptoms?.during_session;
      const locs = (dur?.locations || []).map(l => SYMPTOM_LOCATIONS_FR[l] || l).join(', ');
      const intCls = `intensity-${dur?.intensity || 0}`;
      return `
        <div class="session-row">
          <div style="flex-shrink:0;width:80px;font-size:.8125rem">${formatDate(s.date)}</div>
          <div style="flex:1;font-size:.8125rem;color:var(--text-secondary)">${s.title}</div>
          <div class="badge ${intCls}" style="flex-shrink:0">
            ${dur?.intensity != null ? `${dur.intensity}/10` : '—'}
          </div>
          <div class="text-xs text-muted" style="flex-shrink:0;min-width:120px;text-align:right">${locs || '—'}</div>
        </div>
      `;
    }).join('');
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE SÉANCE DÉTAIL
// ════════════════════════════════════════════════════════════════════════════

function initSeance(sessions) {
  const params  = new URLSearchParams(window.location.search);
  const id      = params.get('id');
  const session = sessions.find(s => s.id === id);

  const appEl = document.getElementById('app');
  if (!appEl) return;

  if (!session) {
    appEl.innerHTML = `
      <div style="text-align:center;padding:3rem">
        <div style="font-size:2rem;margin-bottom:1rem">🔍</div>
        <p class="font-semibold">Séance introuvable</p>
        <p class="text-sm text-muted mt-2">ID: ${id || 'non fourni'}</p>
        <a href="../index.html" class="btn btn-primary" style="margin-top:1.5rem;display:inline-flex">← Retour</a>
      </div>`;
    return;
  }

  const prev = findPreviousSameType(session, sessions);
  const prs  = detectSessionPRs(session, sessions);

  // Header
  const headerEl = document.getElementById('seance-header');
  if (headerEl) {
    const typeColor = getTypeColor(session.type);
    headerEl.innerHTML = `
      <div class="seance-hero" style="--hero-color:${typeColor}">
        <div class="seance-hero-top">
          <a href="../index.html" class="seance-back-btn" aria-label="Retour">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </a>
          <span class="seance-hero-type" style="background:${typeColor}25;color:${typeColor};border:1px solid ${typeColor}45">
            ${TYPE_LABELS[session.type] || session.type}
          </span>
          ${prs.length ? `<span class="pr-badge" style="font-size:.625rem">🏆 ${prs.length} PR${prs.length > 1 ? 's' : ''}</span>` : ''}
        </div>
        <h1 class="seance-hero-title">${session.title}</h1>
        <p class="seance-hero-date">${formatDate(session.date)}${session.time ? ' · ' + session.time : ''}</p>
        <div class="seance-hero-stats">
          <div class="seance-stat-chip">
            <div class="seance-stat-val">${formatVolume(getSessionVolume(session))}</div>
            <div class="seance-stat-lbl">Volume</div>
          </div>
          <div class="seance-stat-chip">
            <div class="seance-stat-val">${formatDuration(session.duration_minutes)}</div>
            <div class="seance-stat-lbl">Durée</div>
          </div>
          <div class="seance-stat-chip">
            <div class="seance-stat-val">${session.calories_kcal || '—'}</div>
            <div class="seance-stat-lbl">kcal</div>
          </div>
          <div class="seance-stat-chip">
            <div class="seance-stat-val">${session.exercise_count || session.exercises?.length || '—'}</div>
            <div class="seance-stat-lbl">Exercices</div>
          </div>
        </div>
      </div>
    `;
  }

  // PRs section
  const prsEl = document.getElementById('prs-section');
  if (prsEl && prs.length) {
    prsEl.innerHTML = `
      <div class="card mb-6 fade-in" style="border-color:var(--amber);background:var(--amber-bg)">
        <div class="flex items-center gap-2 mb-3"><span>🏆</span><span class="font-semibold">Records personnels cette séance</span></div>
        ${prs.map(pr => `
          <div class="flex items-center gap-3 mb-2">
            <span class="pr-badge">${pr.type === 'premier' ? '⭐ 1er' : pr.type === 'charge' ? '💪 Charge' : '📦 Volume'}</span>
            <div>
              <div class="text-sm font-semibold">${pr.exercise.replace(/\s*\(.*?\)\s*$/, '')}</div>
              <div class="text-xs text-muted">${pr.value}</div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  // Exercices avec mini-graphiques d'évolution
  const exercicesEl = document.getElementById('exercices-list');
  if (exercicesEl) {
    const allSessions = window.sessions || [];

    exercicesEl.innerHTML = session.exercises.map((ex, exIndex) => {
      const color    = getCategoryColor(ex.category);
      const isPR     = prs.some(p => p.exercise === ex.name || p.exercise.replace(/\s*\(.*?\)\s*$/, '') === ex.name.replace(/\s*\(.*?\)\s*$/, ''));
      const exVol    = getExerciseVolume(ex);
      const workSets = ex.sets.filter(s => !s.is_warmup);
      const maxW     = workSets.length ? Math.max(...workSets.map(s => s.weight_kg || 0)) : 0;
      const history  = getExerciseHistory(allSessions, ex.name.replace(/\s*\(.*?\)\s*$/, '').trim());
      const hasHistory = history.length >= 2;

      return `
        <div class="exercise-block fade-in">
          <div class="exercise-block-header" style="background:linear-gradient(135deg,${color}22 0%,${color}06 60%,transparent 100%)">
            <div style="width:36px;height:36px;border-radius:10px;background:${color}28;border:1px solid ${color}40;display:flex;align-items:center;justify-content:center;flex-shrink:0">
              <div style="width:10px;height:10px;border-radius:50%;background:${color}"></div>
            </div>
            <div style="flex:1;min-width:0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-semibold text-sm">${ex.name}</span>
                ${isPR ? '<span class="pr-badge" style="font-size:.6875rem">🏆 PR</span>' : ''}
              </div>
              <div class="text-xs" style="color:${color}bb;margin-top:1px">${formatCategory(ex.category)} · ${ex.sets.length} séries · max ${maxW || '?'} kg</div>
            </div>
            <div style="text-align:right;flex-shrink:0;display:flex;align-items:center;gap:6px">
              <button class="rename-ex-btn btn btn-ghost" data-ex-index="${exIndex}" title="Renommer cet exercice">✏️ Renommer</button>
              <div>
                <div class="text-sm font-semibold" style="color:${color}">${formatVolume(exVol)}</div>
                <div class="text-xs text-muted">volume</div>
              </div>
            </div>
          </div>
          <div class="exercise-block-body">
            <div class="set-row" style="color:var(--text-muted);font-size:.75rem;font-weight:600;padding:4px 12px">
              <div>#</div><div>Charge</div><div>Reps</div><div>Volume</div>
            </div>
            ${ex.sets.map(set => {
              const setPRs = prs.filter(p => p.type === 'charge' && (p.exercise === ex.name) && maxW === set.weight_kg && !set.is_warmup);
              return `
                <div class="set-row ${set.is_warmup ? 'warmup' : ''} ${setPRs.length ? 'pr-set' : ''}">
                  <div class="text-xs text-muted">${set.set_number}</div>
                  <div class="text-sm ${set.is_warmup ? 'text-muted' : 'font-semibold'}">${set.weight_kg > 0 ? set.weight_kg + ' kg' : 'PDC'}</div>
                  <div class="text-sm">${set.reps} reps</div>
                  <div class="text-xs text-muted">${set.reps * set.weight_kg > 0 ? (set.reps * set.weight_kg).toLocaleString() + ' kg' : '—'}</div>
                </div>
              `;
            }).join('')}
            ${ex.note ? `<div class="text-xs text-muted" style="padding:8px 12px 0;font-style:italic">💬 ${ex.note}</div>` : ''}
          </div>
          ${hasHistory ? `
            <div class="exercise-history-section" style="padding:0 16px 16px">
              <div style="font-size:.6875rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px;padding-top:10px;border-top:1px solid var(--border)">
                Évolution depuis le début · ${history.length} séance${history.length > 1 ? 's' : ''}
              </div>
              <div class="exercise-charts-grid">
                <div>
                  <div class="exercise-chart-label">Charge max (kg)</div>
                  <div class="exercise-chart-wrap"><canvas id="ex-weight-${exIndex}"></canvas></div>
                </div>
                <div>
                  <div class="exercise-chart-label">Volume par séance (kg)</div>
                  <div class="exercise-chart-wrap"><canvas id="ex-volume-${exIndex}"></canvas></div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    // Créer les mini-graphiques après rendu DOM
    session.exercises.forEach((ex, exIndex) => {
      const baseName = ex.name.replace(/\s*\(.*?\)\s*$/, '').trim();
      const history  = getExerciseHistory(allSessions, baseName);
      if (history.length < 2) return;

      const labels  = history.map(h => formatDateShort(h.date));
      const weights = history.map(h => h.maxWeight);
      const volumes = history.map(h => h.volume);
      const isCurrent = history.map(h => h.date === session.date);

      const pointColors  = isCurrent.map(c => c ? '#f59e0b' : '#3b82f6');
      const pointSizes   = isCurrent.map(c => c ? 7 : 3);
      const pointBorders = isCurrent.map(c => c ? 2 : 1);

      const miniOpts = {
        plugins: { legend: { display: false }, tooltip: { callbacks: { title: ctx => labels[ctx[0].dataIndex] } } },
        scales: {
          x: { ticks: { font: { size: 9 }, maxRotation: 0, maxTicksLimit: 5 } },
          y: { ticks: { font: { size: 9 }, maxTicksLimit: 4 } }
        }
      };

      createLineChart(`ex-weight-${exIndex}`, labels, [{
        data:               weights,
        borderColor:        '#3b82f6',
        backgroundColor:    rgba('#3b82f6', 0.06),
        fill:               true,
        pointBackgroundColor: pointColors,
        pointRadius:          pointSizes,
        pointBorderWidth:     pointBorders
      }], miniOpts);

      createLineChart(`ex-volume-${exIndex}`, labels, [{
        data:               volumes,
        borderColor:        '#10b981',
        backgroundColor:    rgba('#10b981', 0.06),
        fill:               true,
        pointBackgroundColor: isCurrent.map(c => c ? '#f59e0b' : '#10b981'),
        pointRadius:          pointSizes,
        pointBorderWidth:     pointBorders
      }], miniOpts);
    });

    // ── Rename feature ───────────────────────────────────────────────────────
    const knownNames = _buildRenameList(sessions);

    exercicesEl.addEventListener('click', e => {
      const btn = e.target.closest('.rename-ex-btn');
      if (!btn) return;
      e.stopPropagation();
      const exIdx = parseInt(btn.dataset.exIndex);
      _openRenamePanel(exercicesEl, exIdx, session, knownNames);
    });
  }

  function _buildRenameList(sessions) {
    const fromHistory = getAllExercises(sessions).map(e => e.name);
    const fromDB      = EXERCISE_DB.map(entry => {
      // Premier keyword de chaque ligne EXERCISE_DB → nom canonique
      const kw = entry[0][0];
      return kw.charAt(0).toUpperCase() + kw.slice(1);
    });
    return [...new Set([...fromHistory, ...fromDB])].sort((a, b) => a.localeCompare(b, 'fr'));
  }

  function _openRenamePanel(exercicesEl, exIdx, session, knownNames) {
    const ex = session.exercises[exIdx];
    if (!ex) return;

    // Remove any existing modal
    document.getElementById('rename-backdrop')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'rename-backdrop';
    backdrop.innerHTML = `
      <div id="rename-modal">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
          <div style="font-size:.875rem;font-weight:600">Renommer l'exercice</div>
          <button id="rn-close" class="btn btn-ghost" style="padding:3px 8px;font-size:1rem;line-height:1" title="Fermer">✕</button>
        </div>
        <div style="font-size:.8125rem;color:var(--text-muted);margin-bottom:12px">
          Exercice actuel : <strong style="color:var(--text-primary)">${ex.name}</strong>
        </div>
        <input id="rn-input" type="text" placeholder="Chercher un exercice…"
          style="width:100%;background:var(--bg-input);border:1px solid var(--border);border-radius:8px;
                 color:var(--text-primary);font-family:'Inter',sans-serif;font-size:.875rem;
                 padding:9px 12px;outline:none;transition:border-color .15s;box-sizing:border-box"
          autocomplete="off">
        <div class="rename-results-list" id="rn-results" style="display:none"></div>
      </div>
    `;
    document.body.appendChild(backdrop);
    requestAnimationFrame(() => backdrop.classList.add('open'));

    const input   = backdrop.querySelector('#rn-input');
    const results = backdrop.querySelector('#rn-results');

    function closeModal() {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 200);
    }

    backdrop.addEventListener('click', e => { if (e.target === backdrop) closeModal(); });
    backdrop.querySelector('#rn-close').addEventListener('click', closeModal);

    document.addEventListener('keydown', function onKey(e) {
      if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onKey); }
    });

    input.addEventListener('focus', () => { input.style.borderColor = 'var(--accent)'; });
    input.addEventListener('blur',  () => { input.style.borderColor = 'var(--border)'; });

    input.addEventListener('input', () => {
      const q = _normalize(input.value.trim());
      if (!q) { results.style.display = 'none'; results.innerHTML = ''; return; }
      const filtered = knownNames
        .filter(n => _normalize(n).includes(q) && n !== ex.name)
        .slice(0, 12);
      if (!filtered.length) {
        results.innerHTML = '<div style="padding:8px 12px;font-size:.8125rem;color:var(--text-muted)">Aucun résultat</div>';
      } else {
        const sessEx = session.exercises.map(e => e.name);
        results.innerHTML = filtered.map(n => {
          const alreadyIn = sessEx.includes(n) && n !== ex.name;
          return `<div class="rename-result-item" data-name="${n.replace(/"/g,'&quot;')}">
            <span>${n}</span>${alreadyIn ? '<span class="badge badge-amber" style="font-size:.625rem">fusion</span>' : ''}
          </div>`;
        }).join('');
      }
      results.style.display = 'block';
    });

    results.addEventListener('click', e => {
      const item = e.target.closest('.rename-result-item');
      if (!item) return;
      closeModal();
      _doRename(session, exIdx, item.dataset.name);
    });

    input.focus();
  }

  async function _doRename(session, exIdx, targetName) {
    const ex          = session.exercises[exIdx];
    const existingIdx = session.exercises.findIndex((e, i) => i !== exIdx && e.name === targetName);

    if (existingIdx !== -1) {
      // Fusion : ajoute les séries de l'exercice mal nommé dans le bon exercice
      const target = session.exercises[existingIdx];
      const offset = target.sets.filter(s => !s.is_warmup).length;
      ex.sets.filter(s => !s.is_warmup).forEach((s, i) => {
        target.sets.push({ ...s, set_number: offset + i + 1 });
      });
      target.total_volume_kg = target.sets.filter(s => !s.is_warmup)
        .reduce((sum, s) => sum + s.reps * (s.weight_kg || 0), 0);
      session.exercises.splice(exIdx, 1);
    } else {
      // Renommage simple + mise à jour des métadonnées
      const info = lookupExercise(targetName);
      ex.name = targetName;
      if (info) {
        ex.category        = info.cat;
        ex.muscle_groups   = info.muscles;
        ex.type            = info.type;
        if (info.equipment) ex.equipment = info.equipment;
      }
      const workSets = ex.sets.filter(s => !s.is_warmup);
      ex.total_volume_kg = workSets.reduce((sum, s) => sum + s.reps * (s.weight_kg || 0), 0);
    }

    session.exercises.forEach((e, i) => { e.order = i + 1; });
    session.exercise_count = session.exercises.length;

    await upsertSession(session);
    showToast(existingIdx !== -1 ? '✅ Exercices fusionnés et sauvegardés' : '✅ Exercice renommé');
    setTimeout(() => window.location.reload(), 600);
  }

  // Symptômes
  const symptomsEl = document.getElementById('symptoms-detail');
  if (symptomsEl && session.symptoms) {
    const periods = [
      { key: 'during_session',   label: 'Pendant la séance' },
      { key: 'end_of_session',   label: 'Fin de séance' },
      { key: 'post_session_24h', label: 'Post 24h' },
      { key: 'post_session_48h', label: 'Post 48h' }
    ];
    const rows = periods.filter(p => session.symptoms[p.key]);
    if (rows.length) {
      symptomsEl.innerHTML = rows.map(p => {
        const sym  = session.symptoms[p.key];
        const locs = (sym.locations || []).map(l => SYMPTOM_LOCATIONS_FR[l] || l);
        return `
          <div class="flex items-start gap-3 mb-3">
            <div style="flex-shrink:0;width:100px;font-size:.8125rem;color:var(--text-secondary);padding-top:2px">${p.label}</div>
            <div>
              <div class="flex items-center gap-2 mb-1">
                <span class="badge intensity-${sym.intensity || 0}">${sym.intensity}/10</span>
                ${locs.map(l => `<span class="badge badge-blue">${l}</span>`).join('')}
              </div>
              ${sym.notes ? `<div class="text-xs text-muted">${sym.notes}</div>` : ''}
            </div>
          </div>
        `;
      }).join('');
    } else {
      symptomsEl.innerHTML = '<p class="text-sm text-muted">Aucun symptôme renseigné pour cette séance.</p>';
    }
  }

  // Comparaison avec séance précédente
  const compEl = document.getElementById('comparison-section');
  if (compEl && prev) {
    const currVol  = getSessionVolume(session);
    const prevVol  = getSessionVolume(prev);
    const diffVol  = currVol - prevVol;
    const diffMin  = (session.duration_minutes || 0) - (prev.duration_minutes || 0);
    const diffCal  = (session.calories_kcal || 0) - (prev.calories_kcal || 0);
    const sign     = n => n > 0 ? `+${n}` : `${n}`;
    const signCol  = n => n > 0 ? 'var(--green)' : n < 0 ? 'var(--red)' : 'var(--text-muted)';

    compEl.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-semibold">Comparaison avec la séance précédente</h3>
          <a href="seance.html?id=${prev.id}" class="text-xs text-accent" style="text-decoration:none">${formatDate(prev.date)} →</a>
        </div>
        <div class="grid-3" style="gap:12px">
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1">Volume</div>
            <div class="font-bold" style="color:${signCol(diffVol)}">${sign(diffVol)} kg</div>
            <div class="text-xs text-muted">${formatVolume(prevVol)} → ${formatVolume(currVol)}</div>
          </div>
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1">Durée</div>
            <div class="font-bold" style="color:${signCol(diffMin)}">${sign(diffMin)} min</div>
            <div class="text-xs text-muted">${prev.duration_minutes} → ${session.duration_minutes} min</div>
          </div>
          <div style="text-align:center">
            <div class="text-xs text-muted mb-1">Calories</div>
            <div class="font-bold" style="color:${signCol(diffCal)}">${sign(diffCal)} kcal</div>
            <div class="text-xs text-muted">${prev.calories_kcal} → ${session.calories_kcal} kcal</div>
          </div>
        </div>
      </div>
    `;
  } else if (compEl) {
    compEl.innerHTML = '<p class="text-sm text-muted">Aucune séance précédente du même type pour comparer.</p>';
  }

  // Feedback subjectif
  const feedbackEl = document.getElementById('feedback-text');
  if (feedbackEl && session.subjective_feedback) {
    feedbackEl.textContent = session.subjective_feedback;
  }
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE JOURNAL
// ════════════════════════════════════════════════════════════════════════════

function initJournal(sessions) {
  let activePeriod = 0;
  let activeType   = 'tous';
  let searchQuery  = '';

  function render() {
    let filtered = filterByDays(sessions, activePeriod);
    if (activeType !== 'tous') filtered = filtered.filter(s => s.type === activeType);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q) ||
        (s.exercises || []).some(e => e.name.toLowerCase().includes(q))
      );
    }
    renderJournalList(filtered);
  }

  // Boutons période
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePeriod = parseInt(btn.dataset.days) || 0;
      render();
    });
  });

  // Filtre type
  const typeFilter = document.getElementById('type-filter');
  if (typeFilter) {
    typeFilter.addEventListener('change', e => { activeType = e.target.value; render(); });
  }

  // Recherche
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => { searchQuery = e.target.value; render(); });
  }

  // Nombre séances importées
  const importedCount = document.getElementById('imported-count');
  if (importedCount) {
    const n = sessions.length;
    importedCount.textContent = n > 0 ? `${n} séance${n > 1 ? 's' : ''}` : '';
  }

  render();
}

function renderJournalList(sessions) {
  const el     = document.getElementById('journal-list');
  const countEl = document.getElementById('session-count');
  if (!el) return;
  if (countEl) countEl.textContent = `${sessions.length} séance${sessions.length > 1 ? 's' : ''}`;

  if (!sessions.length) {
    el.innerHTML = `<div style="text-align:center;padding:3rem;color:var(--text-muted)">
      <div style="font-size:2rem;margin-bottom:1rem">📋</div>
      <p>Aucune séance correspondante.</p>
    </div>`;
    return;
  }

  // Grouper par mois
  const groups = {};
  for (const s of sessions) {
    const [y, m] = s.date.split('-');
    const key = `${y}-${m}`;
    if (!groups[key]) groups[key] = { label: monthYear(s.date), sessions: [] };
    groups[key].sessions.push(s);
  }

  const months = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  function monthYear(dateStr) {
    const [y, m] = dateStr.split('-');
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  el.innerHTML = Object.entries(groups).map(([, group]) => `
    <div class="mb-6">
      <div style="font-size:.75rem;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border)">
        ${group.label} · ${group.sessions.length} séance${group.sessions.length > 1 ? 's' : ''}
      </div>
      ${group.sessions.map(s => {
        const vol      = getSessionVolume(s);
        const typeCol  = getTypeColor(s.type);
        const isImported = getStoredSessions().some(st => st.id === s.id);
        const symDuring  = s.symptoms?.during_session;
        return `
          <a href="seance.html?id=${s.id}" class="session-row" style="display:flex;align-items:center;text-decoration:none;margin-bottom:4px;border-radius:8px">
            <div class="session-type-dot" style="background:${typeCol}"></div>
            <div style="flex:1;min-width:0;margin-left:10px">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-semibold" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px">${s.title}</span>
                ${isImported ? '<span class="badge badge-green" style="font-size:.625rem">Importé</span>' : ''}
                ${symDuring?.intensity >= 4 ? `<span class="badge badge-red" style="font-size:.625rem">🔴 ${symDuring.intensity}/10</span>` : symDuring?.intensity ? `<span class="badge badge-amber" style="font-size:.625rem">🟡 ${symDuring.intensity}/10</span>` : ''}
              </div>
              <div class="text-xs text-muted">${formatDate(s.date)}${s.time ? ' · ' + s.time : ''} · ${s.exercise_count || s.exercises?.length || 0} exo</div>
            </div>
            <div style="text-align:right;flex-shrink:0;margin-left:12px">
              <div class="text-sm font-semibold">${formatVolume(vol)}</div>
              <div class="text-xs text-muted">${formatDuration(s.duration_minutes)} · ${s.calories_kcal || '—'} kcal</div>
            </div>
            <span style="color:var(--text-muted);font-size:.75rem;margin-left:8px">›</span>
          </a>
        `;
      }).join('')}
    </div>
  `).join('');
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE CALENDRIER
// ════════════════════════════════════════════════════════════════════════════

function initCalendrier(sessions) {
  const sessionsByDate = {};
  sessions.forEach(s => {
    if (!sessionsByDate[s.date]) sessionsByDate[s.date] = [];
    sessionsByDate[s.date].push(s);
  });

  const TYPE_SHORT = {
    'haut_du_corps': 'Haut du corps',
    'bas_du_corps':  'Bas du corps',
    'full_body':     'Full body',
    'cardio':        'Cardio'
  };

  const now = new Date();
  let viewYear  = now.getFullYear();
  let viewMonth = now.getMonth();

  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  function renderCalendar() {
    const calEl   = document.getElementById('calendar-grid');
    const titleEl = document.getElementById('calendar-title');
    const statsEl = document.getElementById('calendar-month-stats');
    if (!calEl) return;

    titleEl.textContent = `${MONTHS[viewMonth]} ${viewYear}`;

    const firstDay = new Date(viewYear, viewMonth, 1);
    const lastDay  = new Date(viewYear, viewMonth + 1, 0);
    const todayD   = new Date();
    const tStr     = `${todayD.getFullYear()}-${String(todayD.getMonth()+1).padStart(2,'0')}-${String(todayD.getDate()).padStart(2,'0')}`;

    const mKey      = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}`;
    const mSessions = sessions.filter(s => s.date.startsWith(mKey));
    const mVol      = mSessions.reduce((acc, s) => acc + getSessionVolume(s), 0);

    if (statsEl) {
      statsEl.innerHTML = mSessions.length
        ? `<span class="month-stat"><span class="month-stat-val">${mSessions.length}</span> séance${mSessions.length > 1 ? 's' : ''}</span>
           ${mVol ? `<span class="month-stat" style="color:var(--text-muted)">·</span><span class="month-stat"><span class="month-stat-val">${formatVolume(mVol)}</span> soulevés</span>` : ''}`
        : `<span style="color:var(--text-muted);font-size:.8125rem">Aucune séance ce mois</span>`;
    }

    let startDow = firstDay.getDay();
    startDow = startDow === 0 ? 6 : startDow - 1;

    let html = '';
    for (let i = 0; i < startDow; i++) html += '<div class="cal-day cal-day--empty"></div>';

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr    = `${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const daySessions = sessionsByDate[dateStr] || [];
      const isToday    = dateStr === tStr;
      const hasSess    = daySessions.length > 0;
      const mainColor  = hasSess ? getTypeColor(daySessions[0].type) : '';

      const classes = ['cal-day',
        hasSess ? 'cal-day--has-session' : 'cal-day--inactive',
        isToday ? 'cal-day--today' : ''
      ].filter(Boolean).join(' ');

      const sessionsHtml = daySessions.map(s => {
        const color = getTypeColor(s.type);
        const vol   = getSessionVolume(s);
        return `<span class="cal-session-tag" style="background:${color}22;color:${color}">${TYPE_SHORT[s.type] || 'Séance'}</span>
                ${vol ? `<span class="cal-session-vol">${formatVolume(vol)}</span>` : ''}`;
      }).join('');

      html += `<div class="${classes}" data-date="${dateStr}"${mainColor ? ` style="--session-color:${mainColor}"` : ''}>
        <div class="cal-day-num">${d}</div>
        <div class="cal-day-dot"></div>
        ${sessionsHtml}
      </div>`;
    }

    calEl.innerHTML = html;

    calEl.querySelectorAll('.cal-day--has-session').forEach(cell => {
      cell.addEventListener('click', () => {
        calEl.querySelectorAll('.cal-day--active').forEach(el => el.classList.remove('cal-day--active'));
        cell.classList.add('cal-day--active');
        showDayPanel(cell.dataset.date, sessionsByDate[cell.dataset.date] || []);
      });
    });
  }

  function showDayPanel(dateStr, daySessions) {
    const panel = document.getElementById('day-panel');
    if (!panel) return;
    panel.classList.remove('hidden');

    const symBadge = s => {
      const i = s.symptoms?.during_session?.intensity;
      if (i == null) return '';
      return `<span class="badge ${i >= 4 ? 'badge-red' : 'badge-amber'}" style="font-size:.65rem;padding:1px 6px">🔬 ${i}/10</span>`;
    };

    panel.innerHTML = `
      <div class="day-panel-header">
        <span class="font-semibold" style="font-size:.9375rem">${formatDate(dateStr)}</span>
        <button id="close-day-panel" class="btn btn-ghost" style="padding:4px 10px;font-size:.75rem">✕</button>
      </div>
      ${daySessions.map(s => {
        const color = getTypeColor(s.type);
        const vol   = getSessionVolume(s);
        return `
          <a href="seance.html?id=${s.id}" class="day-panel-session" style="border-left-color:${color}">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
              <span class="font-semibold text-sm">${s.title}</span>
              <div style="display:flex;align-items:center;gap:6px">
                ${symBadge(s)}
                <span class="font-semibold text-sm" style="color:${color}">${formatVolume(vol)}</span>
              </div>
            </div>
            <div class="text-xs text-muted" style="margin-top:4px">
              ${s.exercises?.length || s.exercise_count || 0} exercices${s.time ? '  ·  ' + s.time : ''}
            </div>
          </a>`;
      }).join('')}
    `;

    panel.querySelector('#close-day-panel')?.addEventListener('click', () => {
      panel.classList.add('hidden');
      document.querySelectorAll('.cal-day--active').forEach(el => el.classList.remove('cal-day--active'));
    });
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function resetView() {
    document.getElementById('day-panel')?.classList.add('hidden');
    document.querySelectorAll('.cal-day--active').forEach(el => el.classList.remove('cal-day--active'));
  }

  document.getElementById('cal-prev')?.addEventListener('click', () => {
    viewMonth--; if (viewMonth < 0) { viewMonth = 11; viewYear--; }
    resetView(); renderCalendar();
  });
  document.getElementById('cal-next')?.addEventListener('click', () => {
    viewMonth++; if (viewMonth > 11) { viewMonth = 0; viewYear++; }
    resetView(); renderCalendar();
  });
  document.getElementById('cal-today')?.addEventListener('click', () => {
    viewYear = now.getFullYear(); viewMonth = now.getMonth();
    resetView(); renderCalendar();
  });

  renderCalendar();
}

// ════════════════════════════════════════════════════════════════════════════
//  PAGE IMPORTER
// ════════════════════════════════════════════════════════════════════════════

function initImporter() {
  let pendingSession = null; // séance parsée en attente d'import
  let activeTab = 'motra';

  const textarea    = document.getElementById('text-input');
  const parseBtn    = document.getElementById('parse-btn');
  const importBtn   = document.getElementById('import-btn');
  const cancelBtn   = document.getElementById('cancel-btn');
  const previewEl   = document.getElementById('import-preview');
  const errorEl     = document.getElementById('import-error');
  const sympFormEl  = document.getElementById('symptoms-form');
  const fileInput   = document.getElementById('file-input');
  const clearAllBtn = document.getElementById('clear-all-btn');

  // ── Tabs ──────────────────────────────────────────────────────────────────
  document.querySelectorAll('.import-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.import-tab').forEach(t => {
        t.classList.remove('active');
        t.style.borderBottomColor = 'transparent';
        t.style.color = 'var(--text-muted)';
      });
      tab.classList.add('active');
      tab.style.borderBottomColor = 'var(--accent)';
      tab.style.color = 'var(--accent)';
      activeTab = tab.dataset.tab;
      updatePlaceholder();
    });
  });

  function updatePlaceholder() {
    if (!textarea) return;
    if (activeTab === 'motra') {
      textarea.placeholder = `Colle ici le texte brut exporté depuis Motra :

Séance Haut du Corps Jeudi Matin…
14 mai 2026 à 9:13

Durée : 46m
Volume : 7,9K kg
Calories : 226 cal
Exercices : 7

Développé couché assis à la machine
Échauffement: 15 répétitions x 20 kg
1: 15 répétitions x 30 kg
…

Ctrl+Entrée pour analyser directement.`;
    } else {
      textarea.placeholder = `Colle ici le JSON complet de la séance :

[
  { "id": "workout_2026-05-14_haut_du_corps", ... },
  { "id": "workout_2026-05-11_bas_du_corps",  ... }
]

Accepte un objet seul ou un tableau. Ctrl+Entrée pour analyser.`;
    }
  }
  updatePlaceholder();

  // ── File upload ──────────────────────────────────────────────────────────
  if (fileInput) {
    fileInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        if (textarea) textarea.value = ev.target.result;
        // Auto-detect format
        const t = ev.target.result.trim();
        activeTab = (t.startsWith('{') || t.startsWith('[')) ? 'json' : 'motra';
        document.querySelectorAll('.import-tab').forEach(tab => {
          const isActive = tab.dataset.tab === activeTab;
          tab.classList.toggle('active', isActive);
          tab.style.borderBottomColor = isActive ? 'var(--accent)' : 'transparent';
          tab.style.color = isActive ? 'var(--accent)' : 'var(--text-muted)';
        });
        analyzeInput();
      };
      reader.readAsText(file);
    });
  }

  // ── Analyse ──────────────────────────────────────────────────────────────
  function analyzeInput() {
    const text = textarea?.value.trim();
    if (!text) { showError('Rien à analyser — colle du texte d\'abord.'); return; }
    hideError();
    resetForm();

    if (activeTab === 'motra') {
      // Parser Motra
      try {
        const session = parseMotraText(text);
        if (!session.date) throw new Error('Date non reconnue — vérifie qu\'une ligne contient une date type "21 mai 2026".');
        pendingSession = session;
        showMotraPreview(session);
      } catch (e) {
        showError(`Erreur de parsing : ${e.message}`);
      }
    } else {
      // Parser JSON
      try {
        const results = parseImportJSON(text);
        showJsonPreview(results);
        const valid = results.filter(r => r.valid);
        if (valid.length) {
          // Import direct (pas de formulaire symptômes pour le JSON)
          if (importBtn) {
            importBtn.classList.remove('hidden');
            importBtn.onclick = async () => {
              importBtn.disabled = true;
              for (const r of valid) await upsertSession(r.session);
              showToast(`✅ ${valid.length} séance${valid.length > 1 ? 's' : ''} importée${valid.length > 1 ? 's' : ''}`);
              resetForm();
              if (textarea) textarea.value = '';
              renderImportedList();
              importBtn.disabled = false;
              if (valid.length === 1) setTimeout(() => { window.location.href = `seance.html?id=${valid[0].session.id}`; }, 700);
            };
          }
        }
      } catch (e) {
        showError(`JSON invalide : ${e.message}`);
      }
    }
  }

  if (parseBtn) parseBtn.addEventListener('click', analyzeInput);
  if (textarea) textarea.addEventListener('keydown', e => { if (e.key === 'Enter' && e.ctrlKey) analyzeInput(); });

  // ── Prévisualisation Motra ───────────────────────────────────────────────
  function showMotraPreview(session) {
    if (!previewEl) return;
    const typeColor = getTypeColor(session.type);
    const exList = session.exercises.map(ex => {
      const workSets = ex.sets.filter(s => !s.is_warmup);
      const maxW = workSets.length ? Math.max(...workSets.map(s => s.weight_kg || 0)) : 0;
      const col  = getCategoryColor(ex.category);
      return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
        <div style="width:3px;height:20px;border-radius:2px;background:${col};flex-shrink:0"></div>
        <div style="flex:1;font-size:.8125rem">${ex.name}</div>
        <div class="text-xs text-muted">${formatCategory(ex.category)}</div>
        ${maxW ? `<div class="text-xs font-semibold" style="color:${col}">${maxW} kg</div>` : ''}
      </div>`;
    }).join('');

    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
        <span style="font-size:1.25rem">✅</span>
        <span class="font-semibold">Séance reconnue</span>
        ${getStoredSessions().some(s => s.id === session.id) ? '<span class="badge badge-amber">⚠️ Remplace existante</span>' : ''}
      </div>
      <div class="flex gap-3 flex-wrap mb-4">
        <div class="stat-card ${''}" style="padding:10px 14px;flex:1;min-width:110px;border-left:3px solid ${typeColor}">
          <div class="text-xs text-muted">Date</div>
          <div class="font-bold text-sm">${formatDate(session.date)}</div>
        </div>
        <div class="stat-card" style="padding:10px 14px;flex:1;min-width:110px">
          <div class="text-xs text-muted">Volume</div>
          <div class="font-bold text-sm">${formatVolume(session.total_volume_kg_motra || 0)}</div>
        </div>
        <div class="stat-card" style="padding:10px 14px;flex:1;min-width:110px">
          <div class="text-xs text-muted">Durée</div>
          <div class="font-bold text-sm">${formatDuration(session.duration_minutes)}</div>
        </div>
        <div class="stat-card" style="padding:10px 14px;flex:1;min-width:110px">
          <div class="text-xs text-muted">Calories</div>
          <div class="font-bold text-sm">${session.calories_kcal || '—'} kcal</div>
        </div>
      </div>
      <div style="margin-bottom:4px;font-size:.75rem;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em">
        ${session.exercises.length} exercices détectés
      </div>
      <div>${exList}</div>
    `;

    // Afficher le formulaire symptômes
    if (sympFormEl) sympFormEl.classList.remove('hidden');
    if (importBtn)  {
      importBtn.classList.remove('hidden');
      importBtn.onclick = () => importPendingSession();
    }
    if (cancelBtn) cancelBtn.classList.remove('hidden');
  }

  // ── Prévisualisation JSON ────────────────────────────────────────────────
  function showJsonPreview(results) {
    if (!previewEl) return;
    const stored  = getStoredSessions();
    const valid   = results.filter(r => r.valid);
    const invalid = results.filter(r => !r.valid);
    const dupes   = valid.filter(r => stored.some(s => s.id === r.session.id));
    previewEl.classList.remove('hidden');
    previewEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:12px">
        <span style="font-size:1.25rem">${valid.length ? '✅' : '❌'}</span>
        <span class="font-semibold">${results.length} détectée${results.length > 1 ? 's' : ''}</span>
        ${valid.length ? `<span class="badge badge-green">${valid.length} valide${valid.length > 1 ? 's' : ''}</span>` : ''}
        ${dupes.length ? `<span class="badge badge-amber">${dupes.length} en doublon (mise à jour)</span>` : ''}
        ${invalid.length ? `<span class="badge badge-red">${invalid.length} erreur${invalid.length > 1 ? 's' : ''}</span>` : ''}
      </div>
      ${valid.map(r => {
        const isDupe = stored.some(s => s.id === r.session.id);
        return `
        <div class="preview-session-card">
          <div class="flex items-center gap-2 mb-1">
            <div style="width:8px;height:8px;border-radius:50%;background:${getTypeColor(r.session.type)}"></div>
            <span class="text-sm font-semibold">${r.session.title}</span>
            ${isDupe ? '<span class="badge badge-amber" style="font-size:.7rem;padding:1px 6px">↻ màj</span>' : ''}
          </div>
          <div class="text-xs text-muted">${formatDate(r.session.date)} · ${r.session.exercises?.length || 0} exo · ${formatVolume(r.session.total_volume_kg_motra || 0)}</div>
        </div>`;
      }).join('')}
      ${invalid.map(r => `
        <div class="preview-session-card" style="border-color:var(--red)">
          <div class="text-sm font-semibold text-red">Format invalide</div>
          <div class="text-xs text-muted">${r.errors.join(', ')}</div>
        </div>
      `).join('')}
    `;
    if (cancelBtn) cancelBtn.classList.remove('hidden');
  }

  // ── Import avec symptômes ────────────────────────────────────────────────
  async function importPendingSession() {
    if (!pendingSession) return;

    // Lire les symptômes du formulaire
    const intensity = parseInt(document.getElementById('sym-intensity-val')?.textContent || '0');
    const locs = Array.from(document.querySelectorAll('.sym-loc-cb:checked')).map(cb => cb.value);
    const symNotes   = document.getElementById('sym-notes')?.value.trim() || '';
    const feedback   = document.getElementById('sym-feedback')?.value.trim() || '';

    if (intensity > 0) {
      pendingSession.symptoms.during_session = {
        intensity,
        locations: locs,
        notes: symNotes || null
      };
    }
    if (feedback) pendingSession.subjective_feedback = feedback;

    const importBtn2 = document.getElementById('import-btn');
    if (importBtn2) importBtn2.disabled = true;
    await upsertSession(pendingSession);
    showToast(`✅ Séance du ${formatDate(pendingSession.date)} importée !`);
    const id = pendingSession.id;
    pendingSession = null;
    resetForm();
    if (textarea) textarea.value = '';
    renderImportedList();
    setTimeout(() => { window.location.href = `seance.html?id=${id}`; }, 700);
  }

  // ── Cancel ───────────────────────────────────────────────────────────────
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      if (textarea) textarea.value = '';
      pendingSession = null;
      resetForm();
      hideError();
    });
  }

  // ── Clear all ────────────────────────────────────────────────────────────
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', async () => {
      if (!confirm('Supprimer toutes les séances ? Cette action est irréversible.')) return;
      clearAllBtn.disabled = true;
      await clearAllStoredSessions();
      renderImportedList();
      showToast('🗑️ Toutes les séances supprimées.');
      clearAllBtn.disabled = false;
    });
  }

  // ── Intensity picker ─────────────────────────────────────────────────────
  document.querySelectorAll('.intensity-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.intensity-pill').forEach(p => {
        p.style.background = 'var(--bg-surface)';
        p.style.color = 'var(--text-secondary)';
        p.style.borderColor = 'var(--border)';
        p.style.fontWeight = '400';
      });
      pill.style.background = 'var(--accent)';
      pill.style.color = '#fff';
      pill.style.borderColor = 'var(--accent)';
      pill.style.fontWeight = '700';
      const val = pill.dataset.val;
      const display = document.getElementById('sym-intensity-val');
      if (display) display.textContent = val;
      // Afficher/masquer localisations
      const locsEl = document.getElementById('sym-locs-section');
      if (locsEl) locsEl.style.display = parseInt(val) > 0 ? 'block' : 'none';
    });
  });

  function resetForm() {
    if (previewEl)   { previewEl.classList.add('hidden'); previewEl.innerHTML = ''; }
    if (sympFormEl)  sympFormEl.classList.add('hidden');
    if (importBtn)   importBtn.classList.add('hidden');
    if (cancelBtn)   cancelBtn.classList.add('hidden');
    // Reset symptom form
    const display = document.getElementById('sym-intensity-val');
    if (display) display.textContent = '0';
    document.querySelectorAll('.intensity-pill').forEach(p => {
      p.style.background = 'var(--bg-surface)';
      p.style.color = 'var(--text-secondary)';
      p.style.borderColor = 'var(--border)';
      p.style.fontWeight = '400';
    });
    document.querySelectorAll('.sym-loc-cb').forEach(cb => cb.checked = false);
    const locsEl = document.getElementById('sym-locs-section');
    if (locsEl) locsEl.style.display = 'none';
    const notesEl = document.getElementById('sym-notes');
    if (notesEl) notesEl.value = '';
    const feedbackEl = document.getElementById('sym-feedback');
    if (feedbackEl) feedbackEl.value = '';
  }

  function showError(msg) { if (errorEl) { errorEl.textContent = msg; errorEl.classList.remove('hidden'); } }
  function hideError()    { if (errorEl) errorEl.classList.add('hidden'); }

  renderImportedList();
}

function renderImportedList() {
  const el      = document.getElementById('imported-list');
  const countEl = document.getElementById('stored-count');
  if (!el) return;
  const stored = getStoredSessions().sort((a, b) => b.date.localeCompare(a.date));
  if (countEl) countEl.textContent = `${stored.length} séance${stored.length !== 1 ? 's' : ''}`;
  if (!stored.length) {
    el.innerHTML = '<p class="text-sm text-muted" style="padding:12px 0">Aucune séance importée pour l\'instant.</p>';
    const clearBtn = document.getElementById('clear-all-btn');
    if (clearBtn) clearBtn.classList.add('hidden');
    return;
  }
  const clearBtn = document.getElementById('clear-all-btn');
  if (clearBtn) clearBtn.classList.remove('hidden');

  el.innerHTML = stored.map(s => `
    <div class="imported-session-row">
      <div style="width:8px;height:8px;border-radius:50%;background:${getTypeColor(s.type)};flex-shrink:0;margin-top:2px"></div>
      <div style="flex:1;min-width:0;margin-left:10px">
        <div class="text-sm font-semibold" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${s.title}</div>
        <div class="text-xs text-muted">${formatDate(s.date)} · ${formatVolume(getSessionVolume(s))}</div>
      </div>
      <a href="seance.html?id=${s.id}" class="btn btn-ghost" style="font-size:.75rem;padding:4px 10px;flex-shrink:0">Voir</a>
      <button class="btn btn-ghost delete-imported-btn" data-id="${s.id}" style="font-size:.75rem;padding:4px 10px;flex-shrink:0;color:var(--red)">✕</button>
    </div>
  `).join('');

  el.querySelectorAll('.delete-imported-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteStoredSession(btn.dataset.id);
      renderImportedList();
      showToast('Séance supprimée.');
    });
  });
}

function showToast(message) {
  let toast = document.getElementById('ft-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ft-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:var(--bg-card);border:1px solid var(--border);color:var(--text-primary);padding:12px 20px;border-radius:10px;font-size:.875rem;font-weight:500;z-index:999;box-shadow:0 8px 32px rgba(0,0,0,0.4);transition:opacity .3s ease';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.style.opacity = '1';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}
