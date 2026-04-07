/**
 * Minimal Anthropic Claude streaming client built on Server-Sent Events.
 *
 * This is a thin wrapper around the /v1/messages endpoint with `stream:true`.
 * We surface raw `delta.text` events as strings via an async generator so
 * the UI can render tokens as they arrive.
 */
export type ClaudeMessage = { role: 'user' | 'assistant'; content: string };

export class ClaudeClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string = 'claude-opus-4-6',
    private readonly maxTokens: number = 1024,
  ) {}

  async *streamMessage(opts: {
    system: string;
    messages: ClaudeMessage[];
  }): AsyncGenerator<string> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        accept: 'text/event-stream',
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: opts.system,
        messages: opts.messages,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`Claude API failed: ${response.status} ${await response.text()}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') return;
        try {
          const event = JSON.parse(payload) as {
            type: string;
            delta?: { type: string; text?: string };
          };
          if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
            yield event.delta.text ?? '';
          }
        } catch {
          // skip malformed events
        }
      }
    }
  }
}
