import { ClaudeClient, type ClaudeMessage } from '@/llm/claudeClient';
import { chunk as splitChunks } from './chunker';
import { Embedder } from './embedder';
import type { RetrievedChunk, VectorStore } from './vectorStore';

/**
 * Orchestrates the embed -> retrieve -> generate pipeline.
 *
 * `addDocument` is fire-and-forget for the UI but waits for chunking and
 * embedding to finish before resolving. `ask` returns an async generator of
 * tokens AND a one-shot list of retrieved chunks via the `onRetrieved`
 * callback so the UI can render citation chips before the first token arrives.
 */
export class RagSession {
  constructor(
    private readonly embedder: Embedder,
    private readonly vectorStore: VectorStore,
    private readonly claude: ClaudeClient,
  ) {}

  async addDocument(text: string, sourceId?: string): Promise<void> {
    const chunks = splitChunks(text, { sourceId });
    if (chunks.length === 0) return;
    const embeddings = await this.embedder.embed(chunks.map((c) => c.text));
    await this.vectorStore.upsert(chunks, embeddings);
  }

  async *ask(opts: {
    question: string;
    history: ClaudeMessage[];
    onRetrieved?: (chunks: RetrievedChunk[]) => void;
  }): AsyncGenerator<string> {
    const queryEmbedding = await this.embedder.embedQuery(opts.question);
    const retrieved = await this.vectorStore.query(queryEmbedding, { topK: 5, minScore: 0.65 });
    opts.onRetrieved?.(retrieved);

    const system = this.buildSystemPrompt(retrieved);
    const messages: ClaudeMessage[] = [
      ...opts.history,
      { role: 'user', content: opts.question },
    ];

    yield* this.claude.streamMessage({ system, messages });
  }

  private buildSystemPrompt(retrieved: RetrievedChunk[]): string {
    const lines: string[] = [];
    lines.push(
      'You are a helpful assistant. Answer the user using ONLY the context below. ' +
        'If the answer is not in the context, say you do not know. Cite each fact ' +
        'with [cite:N] where N is the index of the chunk you used.',
    );
    lines.push('');
    retrieved.forEach((r, i) => {
      lines.push(`<context index="${i + 1}" source="${r.chunk.sourceId}">`);
      lines.push(r.chunk.text);
      lines.push('</context>');
    });
    return lines.join('\n');
  }
}
