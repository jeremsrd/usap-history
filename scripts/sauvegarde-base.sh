#!/bin/bash
#
# Sauvegarde locale de la base — un fichier daté dans ~/Sauvegardes/usap-history.
#
# La base est la seule pièce du site qui ne soit pas sur l'ordinateur : le code
# et les images sont dans le dépôt, et sur GitHub. Supabase fait sa propre
# sauvegarde quotidienne depuis le plan Pro (20 septembre 2026), mais elle vit
# chez Supabase ; celle-ci vit ici. À passer avant une grosse reprise de
# saison, ou quand on veut simplement dormir tranquille.
#
#   ./scripts/sauvegarde-base.sh            # écrit usap-history-AAAA-MM-JJ.dump
#
# Le format est celui de pg_dump « custom » (-Fc) : compressé, et restaurable
# table par table avec pg_restore — `pg_restore -l fichier.dump` en liste le
# contenu, `pg_restore -d "$DATABASE_URL" -t players fichier.dump` n'en rend
# qu'une table. Pour tout restaurer sur une base neuve :
#   pg_restore --no-owner --no-privileges -d "<url de la base>" fichier.dump
#
# Seul le schéma `public` est sauvegardé — celui de Prisma, les 25 tables du
# site. Sans cette borne, le dump embarquait les schémas internes de Supabase,
# `auth`, `storage` et jusqu'au coffre `vault.secrets` : inutile, sensible, et
# irrestaurable ailleurs que chez Supabase. Le compte d'administration vit
# dans `auth` et n'est donc pas dedans : il se recrée en une minute.
#
# pg_dump vient de Homebrew (`brew install libpq`), qui ne le met pas dans le
# PATH ; le chemin est cherché ici. Il passe par le port 5432 du pooler, en
# mode session — le mode transaction (6543) ne convient pas à un dump.
set -euo pipefail

DEPOT="$(cd "$(dirname "$0")/.." && pwd)"
DOSSIER="${SAUVEGARDES:-$HOME/Sauvegardes/usap-history}"
FICHIER="$DOSSIER/usap-history-$(date +%F).dump"

PG_DUMP="$(command -v pg_dump || true)"
for c in /opt/homebrew/opt/libpq/bin/pg_dump /usr/local/opt/libpq/bin/pg_dump; do
  [ -z "$PG_DUMP" ] && [ -x "$c" ] && PG_DUMP="$c"
done
if [ -z "$PG_DUMP" ]; then
  echo "pg_dump introuvable : brew install libpq" >&2
  exit 1
fi

URL="$(grep -E '^DATABASE_URL=' "$DEPOT/.env" | sed -E 's/^DATABASE_URL="?([^"]*)"?$/\1/')"
if [ -z "$URL" ]; then
  echo "DATABASE_URL absent de $DEPOT/.env" >&2
  exit 1
fi

mkdir -p "$DOSSIER"
echo "→ $FICHIER"
"$PG_DUMP" "$URL" --schema=public --no-owner --no-privileges --format=custom --file="$FICHIER"
ls -lh "$FICHIER" | awk '{print "✔ " $5 " écrits"}'
echo "Sauvegardes présentes :"
ls -1 "$DOSSIER" | tail -5
