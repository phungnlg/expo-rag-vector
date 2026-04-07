import type { TextChunk } from './chunker';

export type RetrievedChunk = {
  chunk: TextChunk;
  score: number;
};

export interface VectorStore {
  upsert(chunks: TextChunk[], embeddings: number[][]): Promise<void>;
  query(embedding: number[], opts?: { topK?: number; minScore?: number }): Promise<RetrievedChunk[]>;
}

/** Pure-TS in-memory store. Used for offline / first-run UX. */
export class InMemoryVectorStore implements VectorStore {
  private items: Array<{ chunk: TextChunk; embedding: number[] }> = [];

  async upsert(chunks: TextChunk[], embeddings: number[][]): Promise<void> {
    if (chunks.length !== embeddings.length) {
      throw new Error('chunks/embeddings length mismatch');
    }
    for (let i = 0; i < chunks.length; i++) {
      this.items = this.items.filter((it) => it.chunk.id !== chunks[i].id);
      this.items.push({ chunk: chunks[i], embedding: embeddings[i] });
    }
  }

  async query(
    embedding: number[],
    opts: { topK?: number; minScore?: number } = {},
  ): Promise<RetrievedChunk[]> {
    const topK = opts.topK ?? 5;
    const minScore = opts.minScore ?? 0;
    return this.items
      .map((it) => ({ chunk: it.chunk, score: cosine(embedding, it.embedding) }))
      .filter((r) => r.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }
}

function cosine(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/** Pinecone REST adapter (v2 API). */
export class PineconeVectorStore implements VectorStore {
  constructor(
    private readonly apiKey: string,
    private readonly indexHost: string,
    private readonly namespace: string = 'default',
  ) {}

  async upsert(chunks: TextChunk[], embeddings: number[][]): Promise<void> {
    const vectors = chunks.map((c, i) => ({
      id: c.id,
      values: embeddings[i],
      metadata: {
        source_id: c.sourceId,
        text: c.text,
        token_start: c.tokenStart,
        token_end: c.tokenEnd,
      },
    }));

    const response = await fetch(`${this.indexHost}/vectors/upsert`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ vectors, namespace: this.namespace }),
    });
    if (!response.ok) {
      throw new Error(`Pinecone upsert failed: ${response.status} ${await response.text()}`);
    }
  }

  async query(
    embedding: number[],
    opts: { topK?: number; minScore?: number } = {},
  ): Promise<RetrievedChunk[]> {
    const topK = opts.topK ?? 5;
    const minScore = opts.minScore ?? 0;

    const response = await fetch(`${this.indexHost}/query`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        namespace: this.namespace,
        vector: embedding,
        topK,
        includeMetadata: true,
      }),
    });
    if (!response.ok) {
      throw new Error(`Pinecone query failed: ${response.status} ${await response.text()}`);
    }

    type Match = {
      id: string;
      score: number;
      metadata: { source_id: string; text: string; token_start: number; token_end: number };
    };
    const body = (await response.json()) as { matches: Match[] };

    return body.matches
      .map((m) => ({
        chunk: {
          id: m.id,
          sourceId: m.metadata.source_id,
          text: m.metadata.text,
          tokenStart: m.metadata.token_start,
          tokenEnd: m.metadata.token_end,
        },
        score: m.score,
      }))
      .filter((r) => r.score >= minScore);
  }

  private headers(): Record<string, string> {
    return {
      'Api-Key': this.apiKey,
      'Content-Type': 'application/json',
    };
  }
}
