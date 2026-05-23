# FitTrack — Suivi sportif personnel

Site web statique (100% client-side) pour remplacer l'abonnement Motra.

## Démarrage rapide

### Option 1 — Double-clic (le plus simple)
Ouvrir `index.html` directement dans le navigateur. Ça marche sans serveur grâce à `entrainements.js`.

### Option 2 — Serveur local (recommandé pour Chrome)
```bash
# Python 3
python3 -m http.server 8080

# Node.js (si installé)
npx serve .
```
Puis ouvrir `http://localhost:8080`

---

## Ajouter une séance

Ouvrir `entrainements.js` et ajouter un objet dans le tableau `window.WORKOUTS_DATA = [...]`.

**Structure minimale :**
```javascript
{
  "id": "workout_YYYY-MM-DD_type",      // identifiant unique
  "date": "2026-05-20",                  // format ISO obligatoire
  "time": "10:00",
  "title": "Nom de la séance",
  "type": "haut_du_corps",               // haut_du_corps | bas_du_corps | full_body | cardio
  "location": "salle",
  "duration_minutes": 50,
  "total_volume_kg_motra": 8000,         // volume Motra (ou calculé automatiquement si null)
  "total_volume_kg_calculated": null,
  "calories_kcal": 240,
  "exercise_count": 6,
  "tracking_source": "Motra",
  "exercises": [
    {
      "order": 1,
      "name": "Nom de l'exercice",
      "category": "pectoraux",           // voir catégories ci-dessous
      "muscle_groups": ["pectoraux"],
      "type": "compound",                // compound | isolation
      "equipment": "machine",
      "sets": [
        { "set_number": 1, "reps": 15, "weight_kg": 20, "is_warmup": true },
        { "set_number": 2, "reps": 12, "weight_kg": 40, "is_warmup": false }
      ],
      "total_volume_kg": 480             // optionnel (calculé auto si null/absent)
    }
  ],
  "symptoms": {
    "during_session":   { "intensity": 3, "locations": ["pied_gauche"], "notes": "..." },
    "end_of_session":   null,
    "post_session_24h": null,
    "post_session_48h": null
  },
  "subjective_feedback": "Ressenti global de la séance."
}
```

**Catégories disponibles :**
- `pectoraux` · `dos` · `épaules` · `bras` · `jambes` · `gainage` · `chaîne_postérieure`

**Localisations symptômes :**
- `pied_gauche` · `pied_droit` · `mollet_gauche` · `mollet_droit`
- `fessier_gauche` · `fessier_droit` · `genou_gauche` · `genou_droit`
- `lombaires` · `nuque` · `main_gauche` · `main_droite`

---

## Héberger sur GitHub Pages

1. Créer un repo GitHub (ex. `mon-fittrack`)
2. Pousser tous les fichiers :
   ```bash
   git init
   git add .
   git commit -m "Initial FitTrack"
   git remote add origin https://github.com/TON_USER/mon-fittrack.git
   git push -u origin main
   ```
3. Dans Settings → Pages → Source : **main branch / root**
4. Le site sera disponible à `https://TON_USER.github.io/mon-fittrack/`

Sur GitHub Pages, le site utilise automatiquement `fetch('./entrainements.json')` — tu peux donc aussi maintenir un `entrainements.json` en parallèle du `.js`.

---

## Structure des fichiers

```
workout-tracker/
├── index.html                   ← Dashboard principal
├── entrainements.js             ← Tes données (à modifier !)
├── pages/
│   ├── exercices.html           ← Suivi par exercice
│   ├── groupes-musculaires.html ← Répartition musculaire
│   ├── symptomes.html           ← Suivi clinique
│   └── seance.html              ← Détail d'une séance (?id=...)
├── css/
│   └── style.css                ← Styles custom + variables de thème
└── js/
    ├── utils.js                 ← Calculs, parsing, détections auto
    ├── charts.js                ← Helpers Chart.js (dark/light mode)
    └── main.js                  ← Initialisation de chaque page
```

---

## Évolutions prévues (architecture prête)

Pour ajouter ces modules dans le futur, créer une nouvelle page dans `/pages/` et une fonction `initXxx(sessions)` dans `main.js` :

- **Marche** — ajouter `walking_sessions` dans les données, page dédiée
- **Sommeil** — ajouter `sleep_data`, graphiques durée + qualité
- **Nutrition** — ajouter `nutrition` par jour, tracking macros
- **Export PDF** — utiliser `window.print()` avec une CSS `@media print`
