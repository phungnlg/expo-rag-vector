/**
 * In-memory seed documents used when NO Pinecone credentials are provided.
 *
 * These three articles cover distinct topics so demo queries such as
 * "What is cosine similarity?", "How does RAG work?", and
 * "What is a transformer model?" all return grounded, cited answers
 * without any external API call for indexing.
 *
 * The app calls `RagSession.addDocument` for each entry on first load
 * (see chatStore.ts). The Voyage embedder still needs a valid API key;
 * if you omit it the store remains empty and Claude falls back to
 * "I do not know."
 */
export const MOCK_DOCUMENTS: Array<{ sourceId: string; text: string }> = [
  {
    sourceId: 'rag-overview',
    text: `
Retrieval-Augmented Generation (RAG) is an AI architecture that enhances large language model
(LLM) responses by grounding them in an external knowledge base. Instead of relying solely on
information baked into model weights during training, a RAG system retrieves relevant passages
from a document store at query time and feeds them to the LLM as context.

A typical RAG pipeline has three stages:
1. Indexing - Documents are split into chunks (usually 256-512 tokens with overlap), then each
   chunk is converted to a dense vector embedding by a separate embedding model (e.g. Voyage-3
   or OpenAI text-embedding-3-small). The vectors are stored in a vector database such as
   Pinecone, Weaviate, or Qdrant.
2. Retrieval - When a user asks a question, the question is embedded using the same model.
   Cosine similarity (or approximate nearest neighbour search) finds the top-k chunks whose
   vectors are closest to the query vector.
3. Generation - The retrieved chunks are injected into the LLM prompt as grounding context.
   The LLM is instructed to answer using only that context and to cite each fact with a
   reference marker such as [cite:1].

RAG dramatically reduces hallucination because the model is constrained to information that
was explicitly retrieved and is visible in the prompt.
    `.trim(),
  },
  {
    sourceId: 'vector-similarity',
    text: `
Cosine similarity is a metric used in vector search to measure how similar two vectors are,
regardless of their magnitude. It is computed as the dot product of the two vectors divided
by the product of their Euclidean norms:

  cosine(A, B) = (A . B) / (||A|| * ||B||)

The result ranges from -1 (opposite directions) to 1 (identical directions). In embedding
spaces, semantically similar sentences have cosine similarity close to 1 even if their raw
token sequences differ. For example, "How do I reset my password?" and "I forgot my login
credentials" typically score 0.85+ because their embedding vectors point in similar directions.

In a vector store, the query embedding is compared against every stored chunk embedding. The
top-k chunks by cosine score are returned as retrieval candidates. A minimum score threshold
(e.g. 0.65) can be applied to filter out weakly related results before sending them to the LLM.

Approximate Nearest Neighbour (ANN) algorithms such as HNSW or IVF reduce this O(n) linear
scan to sub-linear time, which is critical when the index holds millions of vectors.
    `.trim(),
  },
  {
    sourceId: 'transformer-basics',
    text: `
Transformer models are neural networks built around the self-attention mechanism, introduced in
the 2017 paper "Attention Is All You Need" by Vaswani et al. Self-attention allows every token
in a sequence to attend to every other token, capturing long-range dependencies that recurrent
networks struggle with.

A transformer encoder stack produces contextualized embeddings: each token's output vector
is a weighted mixture of all other token vectors in the same sequence, weighted by learned
attention scores. This makes transformer encoders ideal for producing text embeddings used in
semantic search and RAG systems.

A transformer decoder stack is used for generative models (e.g. GPT, Claude). The decoder
attends both to previous output tokens (causal self-attention) and to encoder outputs
(cross-attention). Modern LLMs such as Claude are decoder-only transformers trained on
next-token prediction across trillions of tokens.

Key components of a transformer block:
- Multi-head self-attention: multiple attention heads learn different relationship patterns.
- Feed-forward network: a two-layer MLP applied position-wise after attention.
- Layer normalization and residual connections for stable training.
- Positional encoding (or rotary positional embeddings in modern models) to inject token order.
    `.trim(),
  },
];
