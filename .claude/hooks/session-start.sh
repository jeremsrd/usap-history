#!/bin/bash
# =============================================================================
# USAP History — préparation d'une session Claude Code sur le web
#
# UN CONTENEUR DISTANT EST VIERGE. Le dépôt y est cloné depuis GitHub, donc
# sans `node_modules` — et sans `.env`, qui est dans `.gitignore` : le mot de
# passe de la base de production n'a rien à faire dans le dépôt. Sans ce hook,
# la première commande `npx tsx` échoue sur « Cannot find module
# '@prisma/client' », ce qui est arrivé le 20 septembre 2026 et a coûté une
# séance entière.
#
# `npm install` et non `npm ci` : l'état du conteneur est mis en cache une fois
# le hook terminé, et `ci` efface `node_modules` à chaque passage. Le
# `postinstall` du dépôt se charge lui-même de `prisma generate`.
# =============================================================================
set -euo pipefail

# En local il n'y a rien à faire : les dépendances et le `.env` y sont déjà.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"

npm install --no-audit --no-fund

# DIRE CE QUI MANQUE PLUTÔT QUE DE LE TAIRE — une omission dite vaut mieux
# qu'une omission tue. Sans `DATABASE_URL`, tout ce qui lit ou écrit la base
# est hors d'atteinte : la chaîne de saisie, les audits, le serveur de dev.
# Le reste tourne — les pages, CLAUDE.md, et la lecture des sources, `lnr.ts`
# n'ayant aucune dépendance hors du dépôt.
if [ -z "${DATABASE_URL:-}" ] && [ ! -f .env ]; then
  echo "usap-history : pas de DATABASE_URL dans cet environnement. Les scripts"
  echo "qui touchent la base ne tourneront pas ; le code et la lecture des"
  echo "sources (LNR, EPCR, Gallica), si."
fi
