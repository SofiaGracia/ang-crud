#!/bin/bash

# ============================================================
# commit.sh — Crea branca, commit i PR automàticament amb IA
# Ús: ./scripts/commit.sh
# Requisits: ollama, gh (GitHub CLI), python3
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

MODEL="qwen2.5-coder:7b"

# --- Comprovacions prèvies ---
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) no està instal·lat.${NC}"
  echo "Instal·la'l amb: sudo snap install gh"
  exit 1
fi

if ! command -v ollama &> /dev/null; then
  echo -e "${RED}Error: Ollama no està instal·lat.${NC}"
  echo "Instal·la'l amb: sudo snap install ollama"
  exit 1
fi

if ! curl -s http://localhost:11434 &> /dev/null; then
  echo -e "${RED}Error: Ollama no està en marxa.${NC}"
  echo "Arrencat amb: ollama serve"
  exit 1
fi

# --- Llegir i incrementar el comptador ---
COUNTER_FILE=".feature-counter"

if [ ! -f "$COUNTER_FILE" ]; then
  echo "0" > "$COUNTER_FILE"
fi

CURRENT=$(cat "$COUNTER_FILE")
NEXT=$((CURRENT + 1))

echo -e "${BLUE}→ ID de la feature: #${NEXT}${NC}"

# --- Capturar el git diff ---
DIFF=$(git diff HEAD)
UNTRACKED=$(git ls-files --others --exclude-standard)

if [ -z "$DIFF" ] && [ -z "$UNTRACKED" ]; then
  echo -e "${RED}Error: No hi ha canvis per fer commit.${NC}"
  exit 1
fi

if [ -n "$UNTRACKED" ]; then
  DIFF="${DIFF}"$'\n\n'"Fitxers nous:"$'\n'"${UNTRACKED}"
fi

echo -e "${BLUE}→ Consultant ${MODEL} per generar el nom de la branca i el commit...${NC}"

# --- Crear el payload JSON amb Python per evitar problemes d'escapament ---
TMP_PAYLOAD=$(mktemp /tmp/ollama_payload_XXXXXX.json)
TMP_RESPONSE=$(mktemp /tmp/ollama_response_XXXXXX.json)

python3 - <<EOF > "$TMP_PAYLOAD"
import json

diff = """$(echo "$DIFF" | head -100)"""
next_id = ${NEXT}

prompt = f"""Analitza aquest git diff d'un projecte Angular i genera:
1. Un nom de branca seguint el format: feat/{next_id}-<descripció-en-kebab-case-en-anglès> (màxim 5 paraules)
2. Un missatge de commit seguint el format: feat(#{next_id}): <descripció-curta-en-anglès>

Respon ÚNICAMENT amb aquest JSON sense cap altre text, explicació ni backticks:
{{"branch": "feat/{next_id}-...", "commit": "feat(#{next_id}): ..."}}

Diff:
{diff}"""

payload = {
    "model": "qwen2.5-coder:7b",
    "prompt": prompt,
    "stream": False
}

print(json.dumps(payload))
EOF

# --- Cridar Ollama amb el payload del fitxer ---
# curl -s -m 120 http://localhost:11434/api/generate \
#   -H "Content-Type: application/json" \
#   -d @"$TMP_PAYLOAD" > "$TMP_RESPONSE"

HTTP_STATUS=$(curl -s -o "$TMP_RESPONSE" -w "%{http_code}" -m 120 \
  http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d @"$TMP_PAYLOAD")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo -e "${RED}Error: Ollama ha fallat (HTTP $HTTP_STATUS).${NC}"
  exit 1
fi

# --- Extreure i parsejar la resposta amb Python ---
RESULT=$(python3 - <<EOF
import json, sys, re

with open("$TMP_RESPONSE") as f:
    data = json.load(f)

raw = data.get("response", "")

# Netejar possibles backticks o text extra
raw = re.sub(r'\`\`\`json|\`\`\`', '', raw).strip()

# Trobar el JSON dins la resposta
match = re.search(r'\{.*\}', raw, re.DOTALL)
if not match:
    print("ERROR: no s'ha trobat JSON a la resposta")
    print("RAW: " + raw, file=sys.stderr)
    sys.exit(1)

parsed = json.loads(match.group())
print(parsed["branch"])
print(parsed["commit"])
EOF
)

# --- Netejar fitxers temporals ---
rm -f "$TMP_PAYLOAD" "$TMP_RESPONSE"

# --- Separar branch i commit ---
BRANCH=$(echo "$RESULT" | sed -n '1p')
COMMIT_MSG=$(echo "$RESULT" | sed -n '2p')

if [ -z "$BRANCH" ] || [ -z "$COMMIT_MSG" ]; then
  echo -e "${RED}Error: El model no ha retornat una resposta vàlida.${NC}"
  exit 1
fi

echo -e "${GREEN}→ Branca:  $BRANCH${NC}"
echo -e "${GREEN}→ Commit:  $COMMIT_MSG${NC}"

# --- Confirmació ---
read -p "Continuar? (s/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[sS]$ ]]; then
  echo "Cancel·lat."
  exit 0
fi

# --- Git: crear branca, afegir, commit i push ---
git checkout -b "$BRANCH"
git add .
git commit -m "$COMMIT_MSG"

# --- Actualitzar el comptador ---
echo "$NEXT" > "$COUNTER_FILE"
git add "$COUNTER_FILE"
git commit --amend --no-edit

# --- Push ---
git push origin "$BRANCH"

# --- Obrir PR ---
echo -e "${BLUE}→ Creant la PR a GitHub...${NC}"
gh pr create \
  --title "$COMMIT_MSG" \
  --body "Feature #${NEXT}" \
  --base master

echo -e "${GREEN}✓ PR creada correctament!${NC}"
