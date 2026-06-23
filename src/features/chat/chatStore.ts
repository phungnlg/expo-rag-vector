import { create } from 'zustand';

import { ClaudeClient } from '@/llm/claudeClient';
import { DemoRagSession } from '@/rag/demoSession';
import { Embedder } from '@/rag/embedder';
import { MOCK_DOCUMENTS } from '@/rag/mockDocuments';
import { RagSession } from '@/rag/ragSession';
import {
  InMemoryVectorStore,
  PineconeVectorStore,
  type RetrievedChunk,
  type VectorStore,
} from '@/rag/vectorStore';

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const VOYAGE_KEY = process.env.EXPO_PUBLIC_VOYAGE_API_KEY ?? '';
const PINECONE_KEY = process.env.EXPO_PUBLIC_PINECONE_API_KEY ?? '';
const PINECONE_HOST = process.env.EXPO_PUBLIC_PINECONE_HOST ?? '';

/** The live pipeline needs both an LLM key and an embedding key. */
const DEMO_MODE = !ANTHROPIC_KEY || !VOYAGE_KEY;

type Session = RagSession | DemoRagSession;

function buildSession(): Session {
  // No secrets configured: run the fully offline demo backend so the app stays
  // demoable on a simulator with grounded answers and real citation chips.
  if (DEMO_MODE) return new DemoRagSession();

  const store: VectorStore =
    PINECONE_KEY && PINECONE_HOST
      ? new PineconeVectorStore(PINECONE_KEY, PINECONE_HOST)
      : new InMemoryVectorStore();

  return new RagSession(new Embedder(VOYAGE_KEY), store, new ClaudeClient(ANTHROPIC_KEY));
}

/**
 * Seed the in-memory vector store with MOCK_DOCUMENTS so the app is fully
 * demoable without Pinecone credentials. Called once when the store is
 * initialized. A no-op in demo mode (canned backend) or when Pinecone keys
 * are present (the cloud index is used instead).
 */
async function seedMockDocuments(session: Session): Promise<void> {
  if (DEMO_MODE || (PINECONE_KEY && PINECONE_HOST)) return;
  for (const doc of MOCK_DOCUMENTS) {
    await session.addDocument(doc.text, doc.sourceId);
  }
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: RetrievedChunk[];
};

type ChatState = {
  messages: ChatMessage[];
  session: Session;
  /** true once mock documents have been embedded into the in-memory store */
  seeded: boolean;
  addDocument: (text: string) => Promise<void>;
  ask: (question: string) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => {
  const session = buildSession();
  // Seed mock docs in the background; flip `seeded` when done.
  seedMockDocuments(session).then(() => set({ seeded: true })).catch(() => set({ seeded: true }));
  return {
    messages: [],
    session,
    seeded: false,

    addDocument: async (text) => {
      await get().session.addDocument(text);
    },

    ask: async (question) => {
    const userMessage: ChatMessage = {
      id: `m_${Date.now()}_u`,
      role: 'user',
      content: question,
      citations: [],
    };
    const assistantMessage: ChatMessage = {
      id: `m_${Date.now()}_a`,
      role: 'assistant',
      content: '',
      citations: [],
    };
    set({ messages: [...get().messages, userMessage, assistantMessage] });

    const history = get()
      .messages.filter((m) => m.id !== assistantMessage.id)
      .map((m) => ({ role: m.role, content: m.content }));

    for await (const token of get().session.ask({
      question,
      history,
      onRetrieved: (chunks) => {
        const next = get().messages.map((m) =>
          m.id === assistantMessage.id ? { ...m, citations: chunks } : m,
        );
        set({ messages: next });
      },
    })) {
      const next = get().messages.map((m) =>
        m.id === assistantMessage.id ? { ...m, content: m.content + token } : m,
      );
      set({ messages: next });
    }
  },
  };
});
