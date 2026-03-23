DIFF=$(git diff HEAD)
TMP_PAYLOAD=$(mktemp /tmp/test_payload_XXXXXX.json)

DIFF_PASSED="$DIFF" python3 - <<EOF > "$TMP_PAYLOAD"
import json
import os

next_id = 'x'
diff = os.environ.get("DIFF_PASSED", "")

prompt = f"""You are a git commit message generator. Analyze the EXACT diff below and generate names based ONLY on what you see in the diff — do not invent or assume anything not present.

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
