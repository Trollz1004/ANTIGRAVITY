export async function* sendMessage(provider: string, model: string, messages: any[], apiKey: string): AsyncIterable<string> {
  // If we are in the desktop app environment
  if (window.opuspawclaw && provider === 'ollama') {
    try {
      const response = await window.opuspawclaw.ollamaChat({
        model: model,
        messages: messages,
        stream: true
      });

      // In a real implementation with streaming text support from the main process:
      // We would use an event listener for membership records.
      // For this bridge, we'll yield the response text if it's not a true stream yet.
      if (typeof response === 'string') {
         yield response;
         return;
      }
    } catch (error) {
      yield `[Ollama Error]: ${error instanceof Error ? error.message : String(error)}`;
      return;
    }
  }

  // Fallback / Simulated routing for cloud providers until real keys are validated
  const responseText = `[${provider.toUpperCase()} / ${model}] - Provider connection established. Processing task... (Simulated Response for Preview)`;
  const words = responseText.split(' ');

  for (const word of words) {
    await new Promise(r => setTimeout(r, 40));
    yield word + ' ';
  }
}
