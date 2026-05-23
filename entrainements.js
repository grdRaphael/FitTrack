// entrainements.js — Données d'entraînement FitTrack
// Séances de base (fichier statique)
// Pour ajouter une séance : utilise la page Importer (pages/importer.html)
// ou colle un objet JSON supplémentaire dans ce tableau

window.WORKOUTS_DATA = [

  {
    "id": "workout_2026-05-14_haut_du_corps",
    "date": "2026-05-14",
    "time": "09:13",
    "title": "Séance Haut du Corps Jeudi Matin Pectoraux Épaules et Bras",
    "type": "haut_du_corps",
    "location": "salle",
    "duration_minutes": 46,
    "total_volume_kg_motra": 7900,
    "total_volume_kg_calculated": null,
    "calories_kcal": 226,
    "exercise_count": 7,
    "tracking_source": "Motra",
    "tracking_url": "https://motra.com/share/workout/453393065a",
    "is_reference_session": false,
    "exercises": [
      {
        "order": 1,
        "name": "Développé couché assis à la machine",
        "category": "pectoraux",
        "muscle_groups": ["pectoraux", "triceps", "deltoïdes_antérieurs"],
        "type": "compound",
        "equipment": "machine",
        "sets": [
          {"set_number": 1, "reps": 15, "weight_kg": 20, "is_warmup": true},
          {"set_number": 2, "reps": 15, "weight_kg": 30, "is_warmup": false},
          {"set_number": 3, "reps": 15, "weight_kg": 35, "is_warmup": false},
          {"set_number": 4, "reps": 15, "weight_kg": 40, "is_warmup": false},
          {"set_number": 5, "reps": 12, "weight_kg": 45, "is_warmup": false},
          {"set_number": 6, "reps": 13, "weight_kg": 45, "is_warmup": false}
        ],
        "total_volume_kg": 2700
      },
      {
        "order": 2,
        "name": "Extension triceps avec corde à la poulie haute",
        "category": "bras",
        "muscle_groups": ["triceps"],
        "type": "isolation",
        "equipment": "poulie",
        "sets": [
          {"set_number": 1, "reps": 12, "weight_kg": 25, "is_warmup": false},
          {"set_number": 2, "reps": 12, "weight_kg": 25, "is_warmup": false},
          {"set_number": 3, "reps": 8,  "weight_kg": 30, "is_warmup": false},
          {"set_number": 4, "reps": 12, "weight_kg": 30, "is_warmup": false}
        ],
        "total_volume_kg": 1200
      },
      {
        "order": 3,
        "name": "Élévation latérale avec haltères",
        "category": "épaules",
        "muscle_groups": ["deltoïdes_latéraux"],
        "type": "isolation",
        "equipment": "haltères",
        "sets": [
          {"set_number": 1, "reps": 15, "weight_kg": 7.5, "is_warmup": false},
          {"set_number": 2, "reps": 10, "weight_kg": 10,  "is_warmup": false},
          {"set_number": 3, "reps": 8,  "weight_kg": 10,  "is_warmup": false},
          {"set_number": 4, "reps": 8,  "weight_kg": 10,  "is_warmup": false},
          {"set_number": 5, "reps": 6,  "weight_kg": 10,  "is_warmup": false}
        ],
        "total_volume_kg": 432
      },
      {
        "order": 4,
        "name": "Curl au pupitre à la machine (première série)",
        "category": "bras",
        "muscle_groups": ["biceps"],
        "type": "isolation",
        "equipment": "machine",
        "sets": [
          {"set_number": 1, "reps": 15, "weight_kg": 30, "is_warmup": false}
        ],
        "total_volume_kg": 450
      },
      {
        "order": 5,
        "name": "Écarté à la poulie haute",
        "category": "pectoraux",
        "muscle_groups": ["pectoraux"],
        "type": "isolation",
        "equipment": "poulie",
        "sets": [
          {"set_number": 1, "reps": 13, "weight_kg": 10, "is_warmup": true},
          {"set_number": 2, "reps": 10, "weight_kg": 15, "is_warmup": false},
          {"set_number": 3, "reps": 10, "weight_kg": 15, "is_warmup": false},
          {"set_number": 4, "reps": 8,  "weight_kg": 15, "is_warmup": false},
          {"set_number": 5, "reps": 7,  "weight_kg": 15, "is_warmup": false}
        ],
        "total_volume_kg": 525
      },
      {
        "order": 6,
        "name": "Tirage horizontal aux sangles de suspension (TRX)",
        "category": "dos",
        "muscle_groups": ["dorsaux", "rhomboïdes", "biceps", "gainage"],
        "type": "compound",
        "equipment": "trx",
        "sets": [
          {"set_number": 1, "reps": 15, "weight_kg": 0, "is_warmup": false, "note": "poids du corps"},
          {"set_number": 2, "reps": 10, "weight_kg": 0, "is_warmup": false},
          {"set_number": 3, "reps": 8,  "weight_kg": 0, "is_warmup": false},
          {"set_number": 4, "reps": 6,  "weight_kg": 0, "is_warmup": false}
        ],
        "total_volume_kg": 0
      },
      {
        "order": 7,
        "name": "Curl au pupitre à la machine (suite)",
        "category": "bras",
        "muscle_groups": ["biceps"],
        "type": "isolation",
        "equipment": "machine",
        "sets": [
          {"set_number": 1, "reps": 10, "weight_kg": 35, "is_warmup": false},
          {"set_number": 2, "reps": 10, "weight_kg": 35, "is_warmup": false},
          {"set_number": 3, "reps": 10, "weight_kg": 35, "is_warmup": false}
        ],
        "total_volume_kg": 1050
      }
    ],
    "symptoms": {
      "during_session":  {"intensity": 4, "locations": ["fessier_gauche", "pied_gauche", "pied_droit"], "notes": "Picotements 4/10 - nouveau territoire fessier depuis la reprise, en plus des pieds habituels"},
      "end_of_session":  null,
      "post_session_24h": null,
      "post_session_48h": null
    },
    "subjective_feedback": "Attention focalisée sur les picotements aujourd'hui - probablement effet retardé de la conversation sur les statistiques de la veille. Séance maintenue complète malgré l'attention accrue - bon comportement."
  }

];
