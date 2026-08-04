# AI Access And Models

Use this reference when the user asks about pricing, credits, subscriptions, API keys, local models, or which model to use.

## The key distinction

Explain two layers clearly:

- the user's plan controls how many messages they can send
- the AI source controls how those messages are powered

This distinction prevents a lot of confusion.

## Plans and credits

Current public framing:

- free plan includes `100 messages per week`
- every account starts with `$10` in free credits
- unlimited plan removes the weekly message limit

Use simple language:

- "Your plan affects how many messages you can send."
- "Your AI source affects what powers those messages."

## AI source options

### DC credits

Use `DC credits` as the primary term.

Mention that in the model switcher this appears as `DC Router`.

Explain simply:

- use DC credits if the user wants the easiest way to access cloud models
- this is good for trying different models without managing separate provider keys

### Own API keys

Explain simply:

- users can connect their own provider accounts and API keys
- this is useful if they already pay for OpenAI, Anthropic, Google, or another provider directly
- this can give more control over cost and model choice

### ChatGPT subscription

Explain simply:

- users with a paid ChatGPT subscription can sign in with that account
- they can then use that subscription inside Desktop Commander instead of relying only on DC credits

### Local models with Ollama

Explain simply:

- Ollama lets users run some AI models on their own machine
- this can reduce cloud cost and keep work local
- model quality and speed depend on the user's hardware and the model they choose

Use plain language like "runs on your computer" instead of deep infrastructure detail.

## Model chooser

Do not present model choice as one permanent answer.

Explain the tradeoffs:

- capability: better for harder reasoning or coding tasks
- speed: faster for quick everyday work
- cost: cheaper models are good for high-volume or lower-stakes tasks
- provider/location: some users care where models come from
- local vs cloud: some users prefer local execution or privacy

## Current high-level guidance

Use language like:

- premium options for harder tasks: `GPT-5.4` and `Claude Opus 4.6`
- cheaper strong alternatives: Gemini models, Grok models, and smaller or faster GPT or Claude variants
- local option: Ollama when privacy, local execution, or cost matter more than getting the very strongest cloud model

## Good user-facing guidance

If the user is unsure, suggest:

- start with an easy path such as DC credits
- use a premium model for harder or more important work
- use cheaper models for experimentation or routine tasks
- try Ollama if they want local execution
