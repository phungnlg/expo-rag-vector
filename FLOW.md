# FLOW - regenerating the demo media

How the committed screenshots and `screenshots/demo.gif` were captured. Everything
runs in offline demo mode (no API keys), so it is fully reproducible.

## 1. Boot the simulator

```bash
xcrun simctl boot "iPhone 17 Pro"   # or any booted iOS 17+ device
open -a Simulator
```

## 2. Start the app

```bash
npm install
npx expo start --ios --port 8082
```

With no `EXPO_PUBLIC_ANTHROPIC_API_KEY` / `EXPO_PUBLIC_VOYAGE_API_KEY` set, the app
selects `DemoRagSession` (`src/rag/demoSession.ts`): tapping a suggested question
surfaces citation chips, then streams a canned, grounded answer word-by-word - the
same shape the live SSE pipeline produces.

## 3. Capture screenshots

Drive the UI with Maestro and grab PNGs with `simctl`:

```bash
DEV=<simulator-udid>

# 01 - empty state: screenshot right after launch
xcrun simctl io "$DEV" screenshot screenshots/01-chat-empty.png

# 02 - answer with citations
cat > /tmp/tap.yaml <<'YAML'
appId: host.exp.Exponent
---
- tapOn: "How does RAG work?"
YAML
maestro --device "$DEV" test /tmp/tap.yaml
sleep 4
xcrun simctl io "$DEV" screenshot screenshots/02-answer-citations.png

# 03 - relaunch, ask a different question for distinct citations
xcrun simctl terminate "$DEV" host.exp.Exponent
xcrun simctl openurl "$DEV" "exp://127.0.0.1:8082"
sleep 12
sed -i '' 's/How does RAG work?/What is cosine similarity?/' /tmp/tap.yaml
maestro --device "$DEV" test /tmp/tap.yaml
sleep 4
xcrun simctl io "$DEV" screenshot screenshots/03-citation-chips.png
```

## 4. Record the demo GIF

```bash
# relaunch to the empty state first, then:
xcrun simctl io "$DEV" recordVideo --codec h264 /tmp/demo.mov &
REC=$!
sleep 1.5
maestro --device "$DEV" test /tmp/tap.yaml   # taps a question, answer streams
sleep 4
kill -INT $REC

ffmpeg -y -i /tmp/demo.mov \
  -vf "fps=12,scale=360:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  screenshots/demo.gif
```

## How it works

- `chatStore.ts` picks `DemoRagSession` whenever an LLM or embedding key is missing.
- `DemoRagSession.ask()` matches the question to a seeded topic, emits real
  `RetrievedChunk`s (built from `mockDocuments.ts` via `chunker.ts`) through the
  `onRetrieved` callback, then streams the canned answer one word at a time.
- The UI in `ChatScreen.tsx` renders citation chips from `onRetrieved` before the
  first token, exactly as it would for the live Anthropic SSE stream.
