/**
 * Voyage AI embedding client. Voyage is the embeddings provider Anthropic
 * recommends pairing with Claude. Returns a `number[]` per input string.
 */
export class Embedder {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'voyage-3',
  ) {}

  async embed(inputs: string[]): Promise<number[][]> {
    const response = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: inputs, model: this.model, input_type: 'document' }),
    });

    if (!response.ok) {
      throw new Error(`Embedding API failed: ${response.status} ${await response.text()}`);
    }

    const body = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return body.data.map((d) => d.embedding);
  }

  async embedQuery(query: string): Promise<number[]> {
    const [embedding] = await this.embed([query]);
    return embedding;
  }
}
