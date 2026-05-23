# FitTrack — Suivi d'entraînement et de progression

Application web de suivi sportif que j'ai développée pour suivre mes entraînements de musculation et ma progression dans le temps, sans dépendre d'un abonnement payant et avec un vrai support desktop.

---

## Le problème

J'utilise **Motra** pour enregistrer mes séances : couplée à l'Apple Watch, son IA détecte automatiquement les exercices et les répétitions, et me génère un récapitulatif en fin de séance. Pratique, mais avec deux limites pour moi :

1. **Le suivi de progression dans le temps est payant.** Je voulais voir mon évolution (charges, volume, par exercice) sans souscrire à l'abonnement.
2. **Pas de support desktop.** Motra reste cantonnée au mobile, alors que je voulais analyser mes données sur grand écran, sous forme de tableaux de bord.

Plutôt que de payer pour une fonctionnalité limitée, j'ai préféré construire mon propre outil, calibré sur mon besoin réel.

---

## La solution

Une application web **100 % client-side** (aucun serveur, aucune base de données distante) dans laquelle j'importe mes séances et qui me génère automatiquement des tableaux de bord de progression — globale et par exercice.

Elle a été **développée avec Claude Code** comme assistant, à partir de ma propre spécification du besoin, de l'architecture et du format de données. Le travail de conception (modèle de données, logique du parser d'import, choix techniques) et l'itération sur les cas réels (formats d'export multiples, edge cases) sont le cœur du projet.

---

## Le workflow

1. **Enregistrement** — Je fais ma séance, Motra + Apple Watch détectent exercices et répétitions.
2. **Export** — En fin de séance, j'exporte le récapitulatif sous forme de **texte**.
3. **Import** — Je colle ce texte dans FitTrack (page *Importer*), qui le parse automatiquement. Je peux aussi ajouter mes symptômes/ressenti en quelques clics.
4. **Analyse** — L'app génère mes tableaux de bord : évolution globale et détail par exercice.

Et pendant une séance, si j'ai un doute sur ma charge ou mes reps de la dernière fois, je fais une **recherche rapide depuis mon téléphone** — l'app est déployée et accessible en ligne.

---

## Fonctionnalités

- **Import automatique** du texte d'export Motra (parsing des exercices, séries, reps, charges).
- **Dashboard global** : évolution du tonnage et tendance générale dans le temps.
- **Suivi par exercice** : au clic sur un exercice, l'historique de la charge et du volume au fil des séances, avec mise en avant du record de charge.
- **Comparaison rapide** : à combien était ma charge / mon volume à la dernière séance, pour ajuster en temps réel.
- **Suivi du ressenti** : intensité et zones, croisés avec le tonnage, pour relier charge et sensations dans le temps.
- **Persistance locale** : les données restent dans le navigateur (localStorage), aucune donnée envoyée à un tiers.

---

## Stack technique

- **HTML / CSS / JavaScript vanilla** — pas de framework, pour un site léger et rapide.
- **Chart.js** — visualisations (courbes d'évolution, graphiques combinés).
- **localStorage** — persistance des données côté client.
- **GitHub + Vercel** — versionnage et déploiement continu ; l'app est accessible depuis n'importe quel appareil, y compris mon téléphone.

---

## Démarrage local

```bash
# Cloner le repo
git clone https://github.com/<ton-user>/<ton-repo>.git
cd <ton-repo>

# Servir en local (au choix)
python3 -m http.server 8080
# ou
npx serve .
```

Puis ouvrir `http://localhost:8080`.

L'app fonctionne aussi en ouvrant simplement `index.html` dans le navigateur.

---

## Déploiement

Déployée sur **Vercel**, connectée au repo GitHub : chaque push sur la branche principale met le site à jour automatiquement. Comme tout est statique et client-side, aucune configuration serveur n'est nécessaire.

---

## Pistes d'évolution

- Suivi des capacités fonctionnelles hors-salle (marche, etc.).
- Compléter le ressenti à 24h / 48h après une séance.
- Détection automatique des sauts de charge trop importants entre séances.
- Export PDF des tableaux de bord.

---

*Projet personnel développé pour répondre à un besoin concret de suivi sportif, avec l'assistance de Claude Code.*
