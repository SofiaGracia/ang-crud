#!/bin/bash

# ============================================================
# commit.sh — Automatically creates branch, commit and PR using AI
# Usage: ./scripts/commit.sh
# Requirements: ollama, gh (GitHub CLI), python3
# ============================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

MODEL="qwen2.5-coder:7b"

# --- Pre-checks ---
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed.${NC}"
  echo "Install it with: sudo snap install gh"
  exit 1
fi

if ! command -v ollama &> /dev/null; then
  echo -e "${RED}Error: Ollama is not installed.${NC}"
  echo "Install it with: sudo snap install ollama"
  exit 1
fi

if ! curl -s http://localhost:11434 &> /dev/null; then
  echo -e "${RED}Error: Ollama is not running.${NC}"
  echo "Start it with: ollama serve"
  exit 1
fi

# --- Read and increment counter ---
COUNTER_FILE=".feature-counter"

if [ ! -f "$COUNTER_FILE" ]; then
  echo "0" > "$COUNTER_FILE"
fi

CURRENT=$(cat "$COUNTER_FILE")
NEXT=$((CURRENT + 1))

echo -e "${BLUE}→ Feature ID: #${NEXT}${NC}"

# --- Capture git diff ---
DIFF=$(git diff HEAD)
echo "${DIFF}"
UNTRACKED=$(git ls-files --others --exclude-standard)

if [ -z "$DIFF" ] && [ -z "$UNTRACKED" ]; then
  echo -e "${RED}Error: No changes to commit.${NC}"
  exit 1
fi

echo -e "${BLUE}→ Querying ${MODEL} to generate branch name and commit...${NC}"

# --- Capture full diff including untracked file contents ---
FULL_DIFF="$DIFF"

if [ -n "$UNTRACKED" ]; then
  for f in $UNTRACKED; do
    FULL_DIFF="${FULL_DIFF}"$'\n\n'"=== New untracked file: $f ==="$'\n'"$(cat "$f" 2>/dev/null | head -50)"
  done
fi

# echo "FULL DIFF : ${FULL_DIFF}"

# --- Create JSON payload with Python to avoid escaping issues ---
TMP_PAYLOAD=$(mktemp /tmp/ollama_payload_XXXXXX.json)
TMP_RESPONSE=$(mktemp /tmp/ollama_response_XXXXXX.json)

DIFF=$(git diff HEAD)
TMP_PAYLOAD=$(mktemp /tmp/test_payload_XXXXXX.json)

DIFF_PASSED="$DIFF" python3 - <<EOF > "$TMP_PAYLOAD"
import json
import os

next_id = ${NEXT}
diff = os.environ.get("DIFF_PASSED", "")

prompt = f"""You are a git commit message generator. Analyze the EXACT diff below and generate names based ONLY on what you see in the d>

Generate:
1. A branch name: feat/{next_id}-<description-in-english-kebab-case> (max 6 words, based strictly on the diff)
2. A commit message: feat(#{next_id}): <short-description-in-english> (based strictly on the diff)

Rules:
- ONLY describe what is actually changed in the diff
- If the diff removes a line, say "remove" not "add"
- If the diff is tiny, the message must be short and precise
- Do NOT mention features that are not in the diff
- Respond ONLY with a JSON object, no extra text, no backticks:
{{"branch": "...", "commit": "..."}}

Diff to analyze:
{diff}"""

payload = {
    "model": "qwen2.5-coder:7b",
    "prompt": prompt,
    "stream": False
}

print(json.dumps(payload))
EOF

# --- Call Ollama with payload file ---
HTTP_STATUS=$(curl -s -o "$TMP_RESPONSE" -w "%{http_code}" -m 120 \
  http://localhost:11434/api/generate \
  -H "Content-Type: application/json" \
  -d @"$TMP_PAYLOAD")

if [ "$HTTP_STATUS" -ne 200 ]; then
  echo -e "${RED}Error: Ollama failed (HTTP $HTTP_STATUS).${NC}"
  exit 1
fi

# --- Extract and parse response with Python ---
RESULT=$(python3 - <<EOF
import json, sys, re

with open("$TMP_RESPONSE") as f:
    data = json.load(f)

raw = data.get("response", "")

# Clean possible backticks or extra text
raw = re.sub(r'\`\`\`json|\`\`\`', '', raw).strip()

# Find JSON inside response
match = re.search(r'\{.*\}', raw, re.DOTALL)
if not match:
    print("ERROR: JSON not found in response")
    print("RAW: " + raw, file=sys.stderr)
    sys.exit(1)

parsed = json.loads(match.group())
print(parsed["branch"])
print(parsed["commit"])
EOF
)

# --- Clean temp files ---
# rm -f "$TMP_PAYLOAD" "$TMP_RESPONSE"

# --- Split branch and commit ---
BRANCH=$(echo "$RESULT" | sed -n '1p')
COMMIT_MSG=$(echo "$RESULT" | sed -n '2p')

if [ -z "$BRANCH" ] || [ -z "$COMMIT_MSG" ]; then
  echo -e "${RED}Error: Model did not return a valid response.${NC}"
  exit 1
fi

echo -e "${GREEN}→ Branch:  $BRANCH${NC}"
echo -e "${GREEN}→ Commit:  $COMMIT_MSG${NC}"

# --- Confirmation ---
read -p "Continue? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY]$ ]]; then
  echo "Cancelled."
  exit 0
fi

# --- Git: create branch, add, commit and push ---
git checkout -b "$BRANCH"
git add .
git commit -m "$COMMIT_MSG"

# --- Update counter ---
echo "$NEXT" > "$COUNTER_FILE"
git add "$COUNTER_FILE"
git commit --amend --no-edit

# --- Push ---
git push origin "$BRANCH"

# --- Open PR ---
echo -e "${BLUE}→ Creating PR on GitHub...${NC}"
gh pr create \
  --title "$COMMIT_MSG" \
  --body "Feature #${NEXT}" \
  --base master

echo -e "${GREEN}✓ PR created successfully!${NC}"
