export function parseSSE(chunk: string): string[] {
  const lines = chunk.split('\n');
  const results: string[] = [];
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        // Extract content based on typical formats (OpenAI, Anthropic, etc)
        if (parsed.choices?.[0]?.delta?.content) {
          results.push(parsed.choices[0].delta.content);
        } else if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          results.push(parsed.delta.text);
        }
      } catch (e) {
        // Ignore parse errors for incomplete chunks
      }
    }
  }
  
  return results;
}
