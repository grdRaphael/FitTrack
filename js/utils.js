// utils.js — Fonctions utilitaires de traitement des données

// ── Constantes ─────────────────────────────────────────────────────────────

const CATEGORY_COLORS = {
  'pectoraux':          '#3b82f6',
  'dos':                '#10b981',
  'épaules':            '#8b5cf6',
  'bras':               '#f97316',
  'jambes':             '#ef4444',
  'gainage':            '#f59e0b',
  'chaîne_postérieure': '#06b6d4',
  'autre':              '#64748b'
};

const CATEGORY_CSS_CLASS = {
  'pectoraux':          'cat-pectoraux',
  'dos':                'cat-dos',
  'épaules':            'cat-epaules',
  'bras':               'cat-bras',
  'jambes':             'cat-jambes',
  'gainage':            'cat-gainage',
  'chaîne_postérieure': 'cat-chaine_posterieure'
};

const TYPE_LABELS = {
  'haut_du_corps': 'Haut du corps',
  'bas_du_corps':  'Bas du corps',
  'full_body':     'Full body',
  'cardio':        'Cardio',
  'gainage':       'Gainage'
};

const SYMPTOM_LOCATIONS_FR = {
  'pied_gauche':    'Pied G',
  'pied_droit':     'Pied D',
  'mollet_gauche':  'Mollet G',
  'mollet_droit':   'Mollet D',
  'fessier_gauche': 'Fessier G',
  'fessier_droit':  'Fessier D',
  'genou_gauche':   'Genou G',
  'genou_droit':    'Genou D',
  'lombaires':               'Lombaires',
  'nuque':                   'Nuque',
  'main_gauche':             'Main G',
  'main_droite':             'Main D',
  'sacro_iliaque':           'Sacro-iliaque',
  'face_externe_jambe_gauche': 'Face ext. jambe G',
  'face_externe_jambe_droit':  'Face ext. jambe D'
};

// ── Données Supabase ────────────────────────────────────────────────────────

// Cache mémoire — alimenté par loadData(), mis à jour par upsert/delete
function getStoredSessions() {
  return window.sessions || [];
}

// Lit les données locales (entrainements.js + ancien localStorage) pour la migration
function _getLocalData() {
  let base = [];
  if (window.WORKOUTS_DATA && Array.isArray(window.WORKOUTS_DATA)) {
    base = JSON.parse(JSON.stringify(window.WORKOUTS_DATA));
  }
  try {
    const stored = JSON.parse(localStorage.getItem('ft-imported-sessions') || '[]');
    const map = new Map(base.map((s, i) => [s.id, i]));
    for (const s of stored) {
      if (map.has(s.id)) base[map.get(s.id)] = s;
      else { base.push(s); map.set(s.id, base.length - 1); }
    }
  } catch (_) {}
  return base;
}

async function upsertSession(session) {
  const { data: { user } } = await _sb.auth.getUser();
  const { error } = await _sb.from('sessions').upsert({
    id:         session.id,
    user_id:    user.id,
    date:       session.date,
    data:       session,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error('Erreur sauvegarde : ' + error.message);
  // Mise à jour du cache mémoire + localStorage
  if (window.sessions) {
    const idx = window.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) window.sessions[idx] = session;
    else window.sessions.push(session);
    try { localStorage.setItem('ft-sessions-cache', JSON.stringify(window.sessions)); } catch (_) {}
  }
}

async function deleteStoredSession(id) {
  const { error } = await _sb.from('sessions').delete().eq('id', id);
  if (error) throw new Error('Erreur suppression : ' + error.message);
  if (window.sessions) {
    window.sessions = window.sessions.filter(s => s.id !== id);
    try { localStorage.setItem('ft-sessions-cache', JSON.stringify(window.sessions)); } catch (_) {}
  }
}

async function clearAllStoredSessions() {
  const { data: { user } } = await _sb.auth.getUser();
  const { error } = await _sb.from('sessions').delete().eq('user_id', user.id);
  if (error) throw new Error('Erreur suppression : ' + error.message);
  window.sessions = [];
  try { localStorage.removeItem('ft-sessions-cache'); } catch (_) {}
}

// ── Chargement des données ──────────────────────────────────────────────────

async function loadData() {
  const { data, error } = await _sb
    .from('sessions')
    .select('data')
    .order('date', { ascending: false });

  if (error) throw new Error('Erreur Supabase : ' + error.message);

  // Première connexion : migrer automatiquement les données locales
  if (data.length === 0) {
    const local = _getLocalData();
    if (local.length > 0) {
      const loadingEl = document.getElementById('loading');
      if (loadingEl) {
        loadingEl.innerHTML = `<div style="text-align:center">
          <div class="spinner" style="margin:0 auto 16px"></div>
          <p class="text-secondary text-sm">Migration des données… (${local.length} séances)</p>
        </div>`;
      }
      for (const s of local) await upsertSession(s);
      localStorage.removeItem('ft-imported-sessions');
      return local;
    }
    return [];
  }

  return data.map(row => row.data);
}

// ── Parser texte brut Motra ─────────────────────────────────────────────────

// Base de correspondance exercices → catégorie/muscles/type/équipement
const EXERCISE_DB = [
  // Pectoraux
  [['développé couché','bench press','chest press'],       'pectoraux',          ['pectoraux','triceps','deltoïdes_antérieurs'], 'compound', null],
  [['développé incliné','incline press'],                  'pectoraux',          ['pectoraux','triceps','deltoïdes_antérieurs'], 'compound', null],
  [['écarté','pec deck','butterfly','fly'],                'pectoraux',          ['pectoraux'],                                  'isolation', null],
  [['dips','pompe','push-up','push up'],                   'pectoraux',          ['pectoraux','triceps'],                        'compound', 'poids_du_corps'],
  // Dos
  [['tirage horizontal','rowing'],                         'dos',                ['dorsaux','rhomboïdes','biceps'],               'compound', null],
  [['tirage vertical','tirage poulie haute','lat pulldown'],'dos',               ['dorsaux','biceps'],                           'compound', null],
  [['tirage'],                                             'dos',                ['dorsaux','biceps','rhomboïdes'],               'compound', null],
  [['traction','pull-up','chin-up'],                       'dos',                ['dorsaux','biceps'],                           'compound', 'poids_du_corps'],
  [['trx','sangles de suspension','anneaux'],              'dos',                ['dorsaux','rhomboïdes','biceps','gainage'],     'compound', 'trx'],
  [['hyperextension','back extension'],                    'dos',                ['lombaires','fessiers'],                       'isolation', null],
  [['rowing','row'],                                       'dos',                ['dorsaux','biceps','rhomboïdes'],               'compound', null],
  // Épaules
  [['élévation latérale','lateral raise'],                 'épaules',            ['deltoïdes_latéraux'],                         'isolation', null],
  [['élévation frontale','front raise'],                   'épaules',            ['deltoïdes_antérieurs'],                       'isolation', null],
  [['développé militaire','overhead press','shoulder press','ohp'], 'épaules',   ['deltoïdes','triceps'],                        'compound', null],
  [['oiseau','reverse fly','face pull','rear delt'],        'épaules',            ['deltoïdes_postérieurs','rhomboïdes'],          'isolation', null],
  [['shrug','haussement épaules'],                         'épaules',            ['trapèzes'],                                   'isolation', null],
  // Bras — triceps
  [['extension triceps','pushdown','triceps corde','triceps poulie','triceps barre'], 'bras', ['triceps'], 'isolation', null],
  [['skull crusher','barre front','french press'],          'bras',               ['triceps'],                                   'isolation', null],
  [['kickback'],                                           'bras',               ['triceps'],                                   'isolation', null],
  // Bras — biceps
  [['curl pupitre','preacher curl'],                       'bras',               ['biceps'],                                    'isolation', null],
  [['curl biceps','biceps curl','curl barre','curl haltères'], 'bras',           ['biceps'],                                    'isolation', null],
  [['curl marteau','hammer curl'],                         'bras',               ['biceps','brachial'],                         'isolation', null],
  [['curl'],                                               'bras',               ['biceps'],                                    'isolation', null],
  // Jambes
  [['presse à cuisse','leg press','presse jambes'],        'jambes',             ['quadriceps','fessiers','ischio-jambiers'],    'compound', 'machine'],
  [['squat','front squat','goblet'],                       'jambes',             ['quadriceps','fessiers','ischio-jambiers'],    'compound', null],
  [['fente','lunge','split squat','bulgare'],               'jambes',             ['quadriceps','fessiers'],                     'compound', null],
  [['leg curl','curl jambe','ischio'],                     'jambes',             ['ischio-jambiers'],                           'isolation', 'machine'],
  [['extension jambe','leg extension'],                    'jambes',             ['quadriceps'],                                'isolation', 'machine'],
  [['mollet','calf raise'],                                'jambes',             ['mollets'],                                   'isolation', null],
  [['step up','montée marche'],                            'jambes',             ['quadriceps','fessiers'],                     'compound', null],
  // Chaîne postérieure
  [['soulevé de terre roumain','rdl','romanian'],          'chaîne_postérieure', ['ischio-jambiers','fessiers','lombaires'],     'compound', null],
  [['soulevé de terre','deadlift','sumo'],                  'chaîne_postérieure', ['ischio-jambiers','fessiers','lombaires','trapèzes'], 'compound', null],
  [['hip thrust','hip extension','fessiers machine'],       'chaîne_postérieure', ['fessiers','ischio-jambiers'],                'isolation', null],
  [['good morning'],                                       'chaîne_postérieure', ['ischio-jambiers','fessiers','lombaires'],     'compound', null],
  // Gainage
  [['gainage','planche','plank','side plank'],              'gainage',            ['core','transverse'],                         'isolation', 'poids_du_corps'],
  [['crunch','sit-up','relevé de buste'],                   'gainage',            ['abdominaux'],                                'isolation', 'poids_du_corps'],
  [['relevé de jambe','leg raise','mountain climber'],      'gainage',            ['abdominaux','psoas'],                        'isolation', 'poids_du_corps'],
  [['rotation','russian twist'],                            'gainage',            ['obliques','core'],                           'isolation', null]
];

function _normalize(str) {
  return str.toLowerCase()
    .replace(/[àâä]/g,'a').replace(/[éèêë]/g,'e').replace(/[îï]/g,'i')
    .replace(/[ôö]/g,'o').replace(/[ùûü]/g,'u').replace(/[ç]/g,'c');
}

function lookupExercise(name) {
  const n = _normalize(name);
  for (const [keywords, cat, muscles, type, equipment] of EXERCISE_DB) {
    if (keywords.some(kw => n.includes(_normalize(kw)))) return { cat, muscles, type, equipment };
  }
  return null;
}

function guessEquipmentFromName(name) {
  const n = _normalize(name);
  if (n.includes('haltere') || n.includes('dumbell')) return 'haltères';
  if (n.includes('barre_traction') || n.includes('traction')) return 'barre_traction';
  if (n.includes('barre') || n.includes('barbell'))   return 'barre';
  if (n.includes('poulie') || n.includes('cable') || n.includes('corde')) return 'poulie';
  if (n.includes('machine'))  return 'machine';
  if (n.includes('trx') || n.includes('sangle') || n.includes('suspension')) return 'trx';
  if (n.includes('poids du corps') || n.includes('poids de corps')) return 'poids_du_corps';
  return null;
}

function guessSessionType(exercises, title) {
  const t = _normalize(title);
  if (t.includes('bas du corps') || t.includes('jambe') || t.includes('leg day')) return 'bas_du_corps';
  if (t.includes('haut du corps') || t.includes('pectoraux') || t.includes('epaules') || t.includes('dos')) return 'haut_du_corps';
  if (t.includes('full body') || t.includes('corps complet')) return 'full_body';
  if (t.includes('cardio')) return 'cardio';
  const cats   = exercises.map(e => e.category);
  const lower  = cats.some(c => ['jambes','chaîne_postérieure'].includes(c));
  const upper  = cats.some(c => ['pectoraux','dos','épaules','bras'].includes(c));
  if (lower && !upper) return 'bas_du_corps';
  if (upper && !lower) return 'haut_du_corps';
  if (lower && upper)  return 'full_body';
  return 'haut_du_corps';
}

function _parseMotraDate(str) {
  // Noms complets normalisés : index 0 = janvier, ..., 11 = décembre
  const MONTHS = ['janvier','fevrier','mars','avril','mai','juin',
                  'juillet','aout','septembre','octobre','novembre','decembre'];
  const n = _normalize(str).replace(/ /g, ' ');
  // "21 mai 2026", "23 nov. 2025 à 16:06", "30 avr. 2026 à 14:49", "7 mai 2026 à 9h13"
  // \.? après le token absorbe le point des abréviations (nov., avr., etc.)
  const m = n.match(/(\d{1,2})\s+([a-z]+)\.?\s+(\d{4})(?:\s+[a-z]\s+(\d{1,2})[h:](\d{2}))?/);
  if (!m) return { date: null, time: null };
  // Résolution du mois par préfixe (≥3 chars) : "nov" → novembre (11)
  const token = m[2];
  if (token.length < 3) return { date: null, time: null };
  let monthNum = null;
  for (let i = 0; i < MONTHS.length; i++) {
    if (MONTHS[i].startsWith(token)) { monthNum = i + 1; break; }
  }
  if (!monthNum) return { date: null, time: null };
  const day  = m[1].padStart(2, '0');
  const mon  = String(monthNum).padStart(2, '0');
  const time = m[4] && m[5] ? `${m[4].padStart(2,'0')}:${m[5]}` : null;
  return { date: `${m[3]}-${mon}-${day}`, time };
}

function _parseMotraDuration(str) {
  const h = str.match(/(\d+)\s*h/i);
  const mn = str.match(/(\d+)\s*m(?!g)/i);
  return (h ? parseInt(h[1]) * 60 : 0) + (mn ? parseInt(mn[1]) : 0);
}

function _parseMotraVolume(str) {
  const k = str.match(/([\d,\.]+)\s*k/i);
  if (k) return Math.round(parseFloat(k[1].replace(',','.')) * 1000);
  const p = str.match(/([\d\s,\.]+)/);
  return p ? Math.round(parseFloat(p[1].replace(/\s/g,'').replace(',','.'))) : null;
}

// Retourne l'objet séance parsé depuis le texte Motra / Train Fitness brut
function parseMotraText(rawText) {
  // Normalise les espaces insécables (Apple Notes) avant tout traitement
  const text  = rawText.replace(/ /g, ' ');
  const lines = text.split('\n').map(l => l.trim());

  // Prédicats réutilisés dans la détection titre et la boucle exercices
  const IS_WRAP = l => /entra[iî]nement/i.test(l);
  const IS_URL  = l => /^https?:\/\//i.test(l);
  const IS_META = ln => /^(duree|volume|calorie|exercice)/.test(ln); // sur texte normalisé

  // ── 1. Scan des ~12 premières lignes non vides pour trouver la date ──────
  const nonEmpty  = lines.filter(l => l.length > 0);
  const scanSlice = nonEmpty.slice(0, 12);
  let dateLinePos = -1;
  let dateParsed  = { date: null, time: null };

  for (let i = 0; i < scanSlice.length; i++) {
    const p = _parseMotraDate(scanSlice[i]);
    if (p.date) { dateLinePos = i; dateParsed = p; break; }
  }

  // ── 2. Titre = première ligne valide parmi les ~8 premières ─────────────
  // Peut être au-dessus OU en-dessous de la date selon l'app source.
  let title = 'Séance';
  for (let i = 0; i < Math.min(scanSlice.length, 8); i++) {
    const l = scanSlice[i];
    if (!l) continue;
    if (i === dateLinePos) continue;          // ligne de date → ignorer
    if (IS_WRAP(l)) continue;                 // "Mon entraînement …" → ignorer
    if (IS_URL(l)) continue;
    const ln = _normalize(l);
    if (IS_META(ln)) continue;
    if (ln.includes('suivi avec')) continue;
    title = l;
    break;
  }

  // ── 3. Avance idx juste après la ligne de date dans le tableau complet ───
  let idx = 0;
  if (dateLinePos >= 0) {
    let seen = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) seen++;
      if (seen > dateLinePos) { idx = i + 1; break; }
    }
  }

  // ── 4. Métadonnées — tolère "Volume:" et "Volume :" (includes couvre les deux) ─
  let duration_minutes = null, total_volume_kg_motra = null, calories_kcal = null, exercise_count_meta = null;
  while (idx < lines.length) {
    const l = lines[idx];
    if (!l) { idx++; continue; }
    const ln = _normalize(l);
    if (ln.includes('duree'))                             { duration_minutes = _parseMotraDuration(l); idx++; }
    else if (ln.includes('volume'))                       { total_volume_kg_motra = _parseMotraVolume(l); idx++; }
    else if (ln.includes('calorie'))                      { const m = l.match(/(\d[\d\s]*)/); calories_kcal = m ? parseInt(m[1].replace(/\s/g,'')) : null; idx++; }
    else if (ln.includes('exercice') && l.match(/\d/))   { const m = l.match(/(\d+)/); exercise_count_meta = m ? parseInt(m[1]) : null; idx++; }
    else break;
  }

  // ── 5. Exercices ─────────────────────────────────────────────────────────
  // Accepte : "répétitions", "répétition", "reps", "rep", "rép" (après normalisation)
  // ":" optionnel ; "30kg" sans espace ; "44,5 kg" virgule décimale
  // PC / poids du corps → weight_kg 0
  // Exercices sans série valide (texte libre, circuits) : filtrés automatiquement
  const SET_RE = /^([ée]chauffement|\d+)\s*:?\s*(\d+)\s*r[ée]p(?:[ée]titions?|s)?\s*(?:x\s*(?:([\d,.]+)\s*kg|pc|poids\s+du\s+corps))?/i;

  const exercises = [];
  let cur         = null;
  let trackingUrl = null;

  while (idx < lines.length) {
    const line = lines[idx++];
    if (!line) continue;
    if (IS_URL(line))                        { trackingUrl = line; continue; }
    if (line.trimStart().startsWith('{'))    break;   // bloc JSON collé en bas — stop
    const ln = _normalize(line);
    if (ln.includes('suivi avec'))           continue;

    const setMatch = ln.match(SET_RE);
    if (setMatch) {
      if (!cur) continue;
      const isWarmup  = _normalize(setMatch[1]).startsWith('e'); // échauffement
      const reps      = parseInt(setMatch[2]);
      const weight    = setMatch[3] ? parseFloat(setMatch[3].replace(',', '.')) : 0;
      const workCount = cur.sets.filter(s => !s.is_warmup).length;
      cur.sets.push({ set_number: isWarmup ? 1 : workCount + 1, reps, weight_kg: weight, is_warmup: isWarmup });
    } else {
      // Ne push que si l'exercice précédent a au moins une série (filtre les lignes libres)
      if (cur && cur.sets.length > 0) exercises.push(_finalizeMotraEx(cur, exercises.length + 1));
      const isNote = line.match(/\d+\/\d+/) ||
                     ln.match(/picotement|symptome|ressenti|douleur|fatigue|attention/);
      cur = isNote ? null : { name: line, sets: [] };
    }
  }
  if (cur && cur.sets.length > 0) exercises.push(_finalizeMotraEx(cur, exercises.length + 1));

  const { date, time } = dateParsed;
  const type = guessSessionType(exercises, title);
  return {
    id:                          `workout_${date || 'unknown'}_${type}`,
    date:                        date || '',
    time:                        time || '',
    title,
    type,
    location:                    'salle',
    duration_minutes,
    total_volume_kg_motra,
    total_volume_kg_calculated:  null,
    calories_kcal,
    exercise_count:              exercise_count_meta || exercises.length,
    tracking_source:             'Motra',
    tracking_url:                trackingUrl,
    is_reference_session:        false,
    exercises,
    symptoms:                    { during_session: null, end_of_session: null, post_session_24h: null, post_session_48h: null },
    subjective_feedback:         ''
  };
}

function _finalizeMotraEx(ex, order) {
  const info     = lookupExercise(ex.name);
  const cat      = info?.cat || 'autre';
  const workSets = ex.sets.filter(s => !s.is_warmup);
  const volume   = workSets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0);
  return {
    order,
    name:            ex.name,
    category:        cat,
    muscle_groups:   info?.muscles  || [cat],
    type:            info?.type     || 'isolation',
    equipment:       info?.equipment || guessEquipmentFromName(ex.name) || 'machine',
    sets:            ex.sets,
    total_volume_kg: volume
  };
}

// ── Validation JSON importé ─────────────────────────────────────────────────

function validateSession(obj) {
  const errors = [];
  if (!obj.id)       errors.push('Champ "id" manquant');
  if (!obj.date)     errors.push('Champ "date" manquant (format YYYY-MM-DD)');
  if (!obj.title)    errors.push('Champ "title" manquant');
  if (!Array.isArray(obj.exercises)) errors.push('Champ "exercises" absent ou invalide');
  return { valid: errors.length === 0, errors };
}

function normalizeImportText(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/ /g, ' ');
}

function extractJSONObjects(text) {
  const arrStart = text.indexOf('[');
  const arrEnd   = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(text.slice(arrStart, arrEnd + 1)); } catch (_) {}
  }
  const objects = [];
  let depth = 0, start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') { if (depth === 0) start = i; depth++; }
    else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        try { objects.push(JSON.parse(text.slice(start, i + 1))); } catch (_) {}
        start = -1;
      }
    }
  }
  return objects;
}

function parseImportJSON(text) {
  const normalized = normalizeImportText(text);
  let raw;
  try {
    const objStart = normalized.indexOf('{');
    const objEnd   = normalized.lastIndexOf('}');
    const arrStart = normalized.indexOf('[');
    const arrEnd   = normalized.lastIndexOf(']');
    const isArray  = arrStart !== -1 && (objStart === -1 || arrStart < objStart);
    const clean    = isArray
      ? normalized.slice(arrStart, arrEnd + 1)
      : normalized.slice(objStart, objEnd + 1);
    raw = JSON.parse(clean);
  } catch (_) {
    raw = extractJSONObjects(normalized);
    if (!raw.length) throw new Error('Aucun JSON valide trouvé dans le texte');
  }
  const sessions = Array.isArray(raw) ? raw : [raw];
  const results = [];
  for (const s of sessions) {
    const { valid, errors } = validateSession(s);
    results.push({ session: s, valid, errors });
  }
  return results;
}

// ── Formatage ───────────────────────────────────────────────────────────────

function formatDate(dateStr) {
  const months = ['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y}`;
}

function formatDateShort(dateStr) {
  const [, m, d] = dateStr.split('-').map(Number);
  const months = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  return `${d} ${months[m - 1]}`;
}

function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes >= 60) {
    const h = Math.floor(minutes / 60);
    const min = minutes % 60;
    return min > 0 ? `${h}h ${min}min` : `${h}h`;
  }
  return `${minutes} min`;
}

function formatVolume(kg) {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1).replace('.0','')} t`;
  return `${kg} kg`;
}

function formatCategory(cat) {
  if (!cat) return 'Autre';
  return cat.charAt(0).toUpperCase() + cat.slice(1).replace(/_/g, ' ');
}

// ── Volume ──────────────────────────────────────────────────────────────────

function getSessionVolume(session) {
  if (session.total_volume_kg_calculated) return session.total_volume_kg_calculated;
  if (session.total_volume_kg_motra) return session.total_volume_kg_motra;
  return calcSessionVolume(session);
}

function calcSessionVolume(session) {
  let total = 0;
  for (const ex of session.exercises || []) {
    for (const s of ex.sets || []) {
      if (!s.is_warmup) total += (s.reps || 0) * (s.weight_kg || 0);
    }
  }
  return total;
}

function getExerciseVolume(ex) {
  if (ex.total_volume_kg != null) return ex.total_volume_kg;
  return (ex.sets || []).filter(s => !s.is_warmup).reduce((sum, s) => sum + (s.reps || 0) * (s.weight_kg || 0), 0);
}

// ── Exercices ───────────────────────────────────────────────────────────────

function getAllExercises(sessions) {
  const map = new Map();
  const sorted = [...sessions].sort((a, b) => a.date.localeCompare(b.date));
  for (const session of sorted) {
    for (const ex of session.exercises || []) {
      if (!map.has(ex.name)) {
        map.set(ex.name, {
          name:          ex.name,
          category:      ex.category,
          muscle_groups: ex.muscle_groups,
          type:          ex.type,
          equipment:     ex.equipment,
          firstSeen:     session.date
        });
      }
    }
  }
  return Array.from(map.values());
}

function getExerciseHistory(sessions, exerciseName) {
  const history = [];
  for (const session of sessions) {
    // Regroupe les entrées du même exercice (cas des séries splittées en plusieurs ordres)
    const exList = (session.exercises || []).filter(e => {
      const base = e.name.replace(/\s*\(.*?\)\s*$/, '').trim();
      const target = exerciseName.replace(/\s*\(.*?\)\s*$/, '').trim();
      return base === target || e.name === exerciseName;
    });
    if (exList.length === 0) continue;

    const allWorkSets = exList.flatMap(e => (e.sets || []).filter(s => !s.is_warmup));
    if (allWorkSets.length === 0) continue;

    const maxWeight = Math.max(...allWorkSets.map(s => s.weight_kg || 0));
    const maxReps   = Math.max(...allWorkSets.map(s => s.reps || 0));
    const volume    = allWorkSets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight_kg || 0), 0);

    history.push({
      date:       session.date,
      sessionId:  session.id,
      maxWeight,
      maxReps,
      volume,
      sets:       allWorkSets
    });
  }
  return history.sort((a, b) => a.date.localeCompare(b.date));
}

// ── Records personnels ──────────────────────────────────────────────────────

function calculateAllPRs(sessions) {
  const exercises = getAllExercises(sessions);
  const prs = {};
  for (const ex of exercises) {
    const history = getExerciseHistory(sessions, ex.name);
    if (!history.length) continue;
    prs[ex.name] = {
      maxWeight: Math.max(...history.map(h => h.maxWeight)),
      maxReps:   Math.max(...history.map(h => h.maxReps)),
      maxVolume: Math.max(...history.map(h => h.volume))
    };
  }
  return prs;
}

function detectSessionPRs(session, allSessions) {
  const prs = [];
  const prevSessions = allSessions.filter(s => s.date < session.date);
  const allPRs = calculateAllPRs(prevSessions);

  for (const ex of session.exercises || []) {
    const workSets = (ex.sets || []).filter(s => !s.is_warmup);
    if (!workSets.length) continue;

    const baseName = ex.name.replace(/\s*\(.*?\)\s*$/, '').trim();
    const prev = allPRs[baseName] || allPRs[ex.name];

    const currMaxWeight = Math.max(...workSets.map(s => s.weight_kg || 0));
    const currMaxReps   = Math.max(...workSets.map(s => s.reps || 0));
    const currVolume    = workSets.reduce((sum, s) => sum + (s.reps || 0) * (s.weight_kg || 0), 0);

    if (!prev) {
      if (currMaxWeight > 0) prs.push({ exercise: ex.name, type: 'premier', label: 'Premier entraînement', value: `${currMaxWeight} kg` });
      continue;
    }
    if (currMaxWeight > prev.maxWeight) {
      prs.push({ exercise: ex.name, type: 'charge', label: 'Nouveau PR charge', value: `${currMaxWeight} kg (était ${prev.maxWeight} kg)` });
    }
    if (currVolume > prev.maxVolume) {
      prs.push({ exercise: ex.name, type: 'volume', label: 'Nouveau PR volume', value: `${currVolume} kg (était ${prev.maxVolume} kg)` });
    }
  }
  return prs;
}

// ── Détections automatiques ─────────────────────────────────────────────────

function detectNewExercises(sessions, days = 14) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return getAllExercises(sessions).filter(ex => ex.firstSeen >= cutoffStr);
}

function detectProgressions(sessions, threshold = 0.15) {
  const exercises = getAllExercises(sessions);
  const result = [];
  for (const ex of exercises) {
    const history = getExerciseHistory(sessions, ex.name);
    if (history.length < 2) continue;
    const first = history[0].maxWeight;
    const last  = history[history.length - 1].maxWeight;
    if (first > 0 && ((last - first) / first) >= threshold) {
      result.push({
        name:       ex.name,
        category:   ex.category,
        pct:        Math.round(((last - first) / first) * 100),
        from:       first,
        to:         last
      });
    }
  }
  return result.sort((a, b) => b.pct - a.pct);
}

function detectPlateaus(sessions, minSessions = 3) {
  const exercises = getAllExercises(sessions);
  const result = [];
  for (const ex of exercises) {
    const history = getExerciseHistory(sessions, ex.name);
    if (history.length < minSessions) continue;
    const recent  = history.slice(-minSessions);
    const weights = recent.map(h => h.maxWeight);
    if (weights.every(w => w === weights[0]) && weights[0] > 0) {
      result.push({ name: ex.name, category: ex.category, weight: weights[0], sessions: recent.length });
    }
  }
  return result;
}

// ── Groupes musculaires ─────────────────────────────────────────────────────

function getWeeklyVolumeByCategory(sessions) {
  const weeks = {};
  for (const session of sessions) {
    const date = new Date(session.date + 'T00:00:00');
    const day  = date.getDay(); // 0 = dimanche
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diff);
    const weekKey = monday.toISOString().split('T')[0];
    if (!weeks[weekKey]) weeks[weekKey] = {};
    for (const ex of session.exercises || []) {
      const cat = ex.category || 'autre';
      const vol = getExerciseVolume(ex);
      weeks[weekKey][cat] = (weeks[weekKey][cat] || 0) + vol;
    }
  }
  return weeks;
}

function getCategoryDistribution(sessions) {
  const dist = {};
  for (const session of sessions) {
    for (const ex of session.exercises || []) {
      const cat = ex.category || 'autre';
      dist[cat] = (dist[cat] || 0) + getExerciseVolume(ex);
    }
  }
  return dist;
}

function detectImbalances(sessions, threshold = 8) {
  const dist  = getCategoryDistribution(sessions);
  const total = Object.values(dist).reduce((s, v) => s + v, 0);
  if (!total) return [];
  return Object.entries(dist)
    .map(([cat, vol]) => ({ category: cat, volume: vol, pct: Math.round((vol / total) * 100) }))
    .filter(d => d.pct < threshold && d.volume > 0);
}

// ── Symptômes ───────────────────────────────────────────────────────────────

function getSymptomIntensity(session, period) {
  return session.symptoms?.[period]?.intensity ?? null;
}

function getAllLocations(sessions) {
  const set = new Set();
  for (const s of sessions) {
    for (const p of ['during_session','end_of_session','post_session_24h','post_session_48h']) {
      for (const loc of s.symptoms?.[p]?.locations || []) set.add(loc);
    }
  }
  return Array.from(set);
}

function getLocationHeatmap(sessions) {
  const counts = {};
  for (const s of sessions) {
    for (const p of ['during_session','end_of_session','post_session_24h','post_session_48h']) {
      for (const loc of s.symptoms?.[p]?.locations || []) {
        counts[loc] = (counts[loc] || 0) + 1;
      }
    }
  }
  return counts;
}

// ── Filtres ─────────────────────────────────────────────────────────────────

function filterByDays(sessions, days) {
  if (!days) return sessions;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split('T')[0];
  return sessions.filter(s => s.date >= cutoffStr);
}

function findPreviousSameType(session, allSessions) {
  return [...allSessions]
    .filter(s => s.type === session.type && s.date < session.date)
    .sort((a, b) => b.date.localeCompare(a.date))[0] || null;
}

// ── Couleur catégorie ───────────────────────────────────────────────────────

function getCategoryColor(cat) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS['autre'];
}

function getCategoryCSSClass(cat) {
  return CATEGORY_CSS_CLASS[cat] || 'cat-autre';
}

function getTypeColor(type) {
  const map = { 'haut_du_corps': '#3b82f6', 'bas_du_corps': '#f97316', 'full_body': '#10b981', 'cardio': '#06b6d4' };
  return map[type] || '#64748b';
}
