/**
 * Token-aware text splitter with overlap.
 *
 * Real production RAG pipelines use a tokenizer aware of the embedding model
 * (e.g. tiktoken). For the POC we approximate tokens as ~4 characters which
 * is close enough for English text and keeps the file dependency-free.
 */
export type TextChunk = {
  id: string;
  sourceId: string;
  text: string;
  tokenStart: number;
  tokenEnd: number;
};

const CHARS_PER_TOKEN = 4;

export function chunk(
  document: string,
  opts: { sourceId?: string; targetTokens?: number; overlapTokens?: number } = {},
): TextChunk[] {
  const target = opts.targetTokens ?? 512;
  const overlap = opts.overlapTokens ?? 64;
  if (overlap >= target) throw new Error('overlapTokens must be smaller than targetTokens');

  const source = opts.sourceId ?? `doc_${hash(document)}`;
  const targetChars = target * CHARS_PER_TOKEN;
  const overlapChars = overlap * CHARS_PER_TOKEN;
  const stride = targetChars - overlapChars;

  const chunks: TextChunk[] = [];
  let start = 0;
  let index = 0;
  while (start < document.length) {
    const end = Math.min(start + targetChars, document.length);
    const text = document.slice(start, end).trim();
    if (text.length > 0) {
      chunks.push({
        id: `${source}_${index}`,
        sourceId: source,
        text,
        tokenStart: Math.floor(start / CHARS_PER_TOKEN),
        tokenEnd: Math.floor(end / CHARS_PER_TOKEN),
      });
      index += 1;
    }
    if (end >= document.length) break;
    start += stride;
  }
  return chunks;
}

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) {
    h = (h << 5) - h + text.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}
