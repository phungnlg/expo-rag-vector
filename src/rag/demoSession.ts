import { chunk as splitChunks } from './chunker';
import { MOCK_DOCUMENTS } from './mockDocuments';
import type { RetrievedChunk } from './vectorStore';

/**
 * Offline demo backend used when no Anthropic / Voyage API keys are present.
 *
 * It mirrors the public surface of `RagSession` (`addDocument` + `ask`) so the
 * app is fully demoable on a simulator with zero network calls: questions that
 * match one of the seeded topics stream a canned, grounded answer and surface
 * real citation chips built from the matching mock document's chunks. Anything
 * else streams the same "I do not know" fallback the live pipeline produces.
 *
 * This keeps the screenshots and demo recording reproducible without secrets.
 */

type Canned = {
  match: RegExp;
  sourceId: string;
  answer: string;
};

const CANNED: Canned[] = [
  {
    match: /\brag\b|retrieval|augment/i,
    sourceId: 'rag-overview',
    answer:
      'RAG (Retrieval-Augmented Generation) grounds an LLM in an external knowledge base ' +
      'instead of relying only on its training weights [cite:1]. The pipeline runs in three ' +
      'stages: indexing splits documents into chunks and embeds them into a vector store; ' +
      'retrieval embeds the question and finds the top-k closest chunks by cosine similarity; ' +
      'generation injects those chunks into the prompt so the model answers only from them ' +
      '[cite:2]. Because the model is constrained to retrieved context, hallucination drops ' +
      'sharply [cite:3].',
  },
  {
    match: /cosine|similarit|vector|embedding/i,
    sourceId: 'vector-similarity',
    answer:
      'Cosine similarity measures how aligned two vectors are regardless of magnitude: the dot ' +
      'product divided by the product of their norms [cite:1]. It ranges from -1 to 1, and ' +
      'semantically similar sentences score close to 1 even with different wording [cite:2]. A ' +
      'vector store ranks every chunk by cosine score, keeps the top-k above a threshold such ' +
      'as 0.65, and ANN algorithms like HNSW or IVF make the search sub-linear at scale ' +
      '[cite:3].',
  },
  {
    match: /transformer|attention|self-attention|gpt|decoder/i,
    sourceId: 'transformer-basics',
    answer:
      'Transformers are neural networks built around self-attention, which lets every token ' +
      'attend to every other token to capture long-range dependencies [cite:1]. Encoder stacks ' +
      'produce contextualized embeddings ideal for semantic search and RAG, while decoder ' +
      'stacks power generative models like Claude and GPT via causal attention [cite:2]. Each ' +
      'block combines multi-head attention, a feed-forward network, residual connections, and ' +
      'positional encoding [cite:3].',
  },
];

const FALLBACK =
  'I do not know based on the indexed documents. Try asking about RAG, cosine similarity, ' +
  'or transformer models.';

function citationsFor(sourceId: string): RetrievedChunk[] {
  const doc = MOCK_DOCUMENTS.find((d) => d.sourceId === sourceId);
  if (!doc) return [];
  const chunks = splitChunks(doc.text, { sourceId, targetTokens: 80, overlapTokens: 16 });
  const scores = [0.91, 0.84, 0.78, 0.71, 0.67];
  return chunks.slice(0, 3).map((chunk, i) => ({ chunk, score: scores[i] ?? 0.66 }));
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class DemoRagSession {
  /** No-op: the demo backend answers from canned content, nothing to index. */
  async addDocument(_text?: string, _sourceId?: string): Promise<void> {
    return;
  }

  async *ask(opts: {
    question: string;
    history: unknown;
    onRetrieved?: (chunks: RetrievedChunk[]) => void;
  }): AsyncGenerator<string> {
    const hit = CANNED.find((c) => c.match.test(opts.question));
    const citations = hit ? citationsFor(hit.sourceId) : [];

    // Surface citation chips before the first token, exactly like the live path.
    await delay(350);
    opts.onRetrieved?.(citations);
    await delay(200);

    const text = hit ? hit.answer : FALLBACK;
    // Stream word-by-word so the UI animates like real SSE token streaming.
    const words = text.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield i === 0 ? words[i] : ` ${words[i]}`;
      await delay(28);
    }
  }
}
