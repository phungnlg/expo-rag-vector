# Expo RAG Mobile - Vector Search + Claude POC

An Expo + React Native + TypeScript proof-of-concept that demonstrates a production-grade mobile RAG (Retrieval Augmented Generation) chatbot. The app embeds documents, retrieves the top-k matches from a vector store (Pinecone or in-memory fallback), and asks Anthropic Claude to generate grounded answers with citations.

## What this POC demonstrates

- A clean RAG pipeline split into four single-purpose modules: chunker, embedder, vector store, generator
- Vector store interface with two implementations: a Pinecone REST adapter and a pure-TS in-memory store for offline / first-run UX
- Cosine similarity retrieval with top-k and score thresholding
- Document chunking with overlap so cross-chunk context is preserved
- Anthropic Claude API integration for grounded generation with explicit citation rendering
- Streaming Claude responses surfaced through an async generator and a Zustand store
- A `RagSession` orchestrator that runs `embed -> retrieve -> generate` and exposes the intermediate retrieval results so the UI can show "what did the AI use to answer this?"
- Conversation history with token-aware truncation

## Stack

- Expo SDK 51
- React Native + TypeScript (strict mode)
- expo-router for file-based navigation
- Zustand for state management
- Anthropic + Voyage REST APIs (no extra SDKs, native fetch only)
- AsyncStorage for conversation persistence

## Architecture

```
src/
├── rag/
│   ├── chunker.ts            # Token-aware text splitter with overlap
│   ├── embedder.ts           # Voyage embeddings client
│   ├── vectorStore.ts        # Interface + Pinecone + InMemory adapters
│   └── ragSession.ts         # Embed -> retrieve -> generate orchestrator
├── llm/
│   └── claudeClient.ts       # Anthropic streaming client (SSE)
└── features/chat/
    ├── chatStore.ts          # Zustand store, drives the chat UI
    └── ChatScreen.tsx
app/
├── _layout.tsx               # Root layout
└── index.tsx                 # Chat screen
```

## How the RAG flow works

1. The user pastes or imports a document. `chunker.chunk` splits it into ~512-token chunks with 64-token overlap.
2. Each chunk is sent to the `Embedder`, which calls Voyage AI and returns a 1024-dim vector.
3. The vectors are written to the `VectorStore`. Production: Pinecone. POC default: an in-memory store you can populate from the demo screen.
4. When the user sends a message, `RagSession`:
   a. embeds the question
   b. queries the vector store for the top 5 chunks above a similarity threshold
   c. constructs a Claude prompt with the chunks as `<context>` blocks
   d. asks Claude to answer using only the context, with `[cite:n]` markers
5. Streaming tokens are appended to the assistant message in real time. Citation chips link back to the source chunk.

## Why this matters for the job

The "AI Mobile App Developer" job calls out:
- Production AI/ML mobile apps with LLMs as a core system component
- Anthropic API integration
- Vector databases (Pinecone, Weaviate)
- RAG pipelines and embeddings workflows

This POC implements that exact pipeline as a clean Expo app with strict TypeScript, ready to drop into any mobile codebase.

## Run

```bash
npm install
EXPO_PUBLIC_ANTHROPIC_API_KEY=sk-ant-... \
EXPO_PUBLIC_VOYAGE_API_KEY=pa-... \
EXPO_PUBLIC_PINECONE_API_KEY=... \
EXPO_PUBLIC_PINECONE_HOST=https://... \
npx expo start
```
