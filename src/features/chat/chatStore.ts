import { create } from 'zustand';

import { ClaudeClient } from '@/llm/claudeClient';
import { Embedder } from '@/rag/embedder';
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

function buildSession(): RagSession {
  const store: VectorStore =
    PINECONE_KEY && PINECONE_HOST
      ? new PineconeVectorStore(PINECONE_KEY, PINECONE_HOST)
      : new InMemoryVectorStore();

  return new RagSession(new Embedder(VOYAGE_KEY), store, new ClaudeClient(ANTHROPIC_KEY));
}

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations: RetrievedChunk[];
};

type ChatState = {
  messages: ChatMessage[];
  session: RagSession;
  addDocument: (text: string) => Promise<void>;
  ask: (question: string) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  session: buildSession(),

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
}));
