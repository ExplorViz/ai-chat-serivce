# ExplorViz AI Chat Service

Express/Node.js service that bridges the ExplorViz frontend chatbot to LLM providers via the [CopilotKit runtime](https://docs.copilotkit.ai/). The frontend chatbot UI talks to this service, which selects an LLM provider/model based on per-request headers and forwards the conversation to the underlying provider SDK (OpenAI, Anthropic, or Google).

## Architecture

```
┌────────────────────────┐     HTTPS     ┌────────────────────────┐
│ ExplorViz Frontend     │  ───────────▶ │ ai-chat-service        │
│ (CopilotKit React)     │               │ (this repository)      │
│                        │               │                        │
│ x-explorviz-provider   │               │ /providers   /health   │
│ x-explorviz-model      │               │ /copilot (CopilotKit)  │
└────────────────────────┘               └────────────┬───────────┘
                                                      │
                                                      ▼
                                       ┌──────────────────────────┐
                                       │ OpenAI / Anthropic /     │
                                       │ Google Generative AI     │
                                       └──────────────────────────┘
```

The frontend sends two custom headers on every chat request:

- `x-explorviz-provider` – provider id (`openai`, `anthropic`, or `google`).
- `x-explorviz-model` – model id within the chosen provider (e.g. `gpt-4o-mini`).

The service maps these to the correct CopilotKit service adapter and proxies the request through `copilotRuntimeNodeHttpEndpoint`.

## Endpoints

| Method    | Path         | Purpose                                                                               |
| --------- | ------------ | ------------------------------------------------------------------------------------- |
| `GET`     | `/health`    | Liveness probe with the list of currently configured providers.                       |
| `GET`     | `/providers` | Lists provider/model pairs that the service is configured to expose.                  |
| `POST`    | `/copilot`   | CopilotKit runtime endpoint. Requires `x-explorviz-provider` and `x-explorviz-model`. |
| `OPTIONS` | `/copilot`   | CORS preflight for the chat endpoint.                                                 |

`/copilot` returns:

- `503` if no provider keys are configured.
- `400` if either of the routing headers is missing or refers to an unknown provider/model.
- The CopilotKit runtime response (typically `200`/`SSE`) on success.

## Requirements

- Node.js 20+ (24+ recommended)
- npm 10+

## Configuration

All configuration is provided through environment variables. A `.env` file at the repository root is loaded automatically via `dotenv`.

| Variable               | Default | Purpose                                                                      |
| ---------------------- | ------- | ---------------------------------------------------------------------------- |
| `PORT`                 | `4300`  | HTTP port the service listens on.                                            |
| `OPENAI_API_KEY`       | unset   | Enables the OpenAI provider when set.                                        |
| `ANTHROPIC_API_KEY`    | unset   | Enables the Anthropic provider when set.                                     |
| `GOOGLE_API_KEY`       | unset   | Enables the Google Generative AI provider when set.                          |
| `COPILOTKIT_LOG_LEVEL` | `info`  | One of `debug`, `info`, `warn`, `error`. Invalid values fall back to `info`. |
| `ALLOWED_ORIGINS`      | `*`     | Comma-separated list of allowed CORS origins. Defaults to allow-all.         |

Provider support is **fully optional**: the service starts even when no keys are configured, but `/copilot` will then return `503` until at least one key is provided.

### Example `.env`

```dotenv
PORT=4300
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
COPILOTKIT_LOG_LEVEL=info
# ALLOWED_ORIGINS=https://app.example.com,https://dev.example.com
```

## Local development

Install dependencies and run the TypeScript build:

```bash
npm install
npm run build
npm start
```

For an iterative dev loop you can run the TypeScript compiler in watch mode in one terminal and `node dist/index.js` in another:

```bash
npm run dev
node dist/index.js
```

## Verifying the deployment

```bash
curl http://localhost:4300/health
curl http://localhost:4300/providers

# Should respond with runtime info JSON
curl -X POST http://localhost:4300/copilot \
  -H 'content-type: application/json' \
  -H 'x-explorviz-provider: openai' \
  -H 'x-explorviz-model: gpt-4o-mini' \
  --data '{"method":"info","params":{}}'
```

## Troubleshooting

- **`Available providers: (none)` at startup** – check that at least one of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GOOGLE_API_KEY` is exported in the environment, and that any `.env` file is in the working directory the service is launched from.
- **Frontend shows "Failed to reach the AI chat service"** – verify that `VITE_COPILOT_SERV_URL` points to the running service URL and that the host is allowed in `ALLOWED_ORIGINS`.
- **`HTTP 400 Unknown provider/model combination`** – the frontend is requesting a provider/model that is not currently exposed by the backend (the response includes the available combinations). Make sure the backend has the corresponding API key configured.
- **`HTTP 503 No LLM provider configured`** – the backend is healthy but has no provider keys; configure at least one and restart.
- **Stale routes / repeated 404s during local development** – kill any stray `node dist/index.js` processes (`pkill -f 'node dist/index.js'`) before restarting; multiple instances may bind to the same port.

## Project layout

```
src/
├── env.ts        # Environment parsing/validation (PORT, API keys, log level)
├── providers.ts  # CopilotKit service adapter wiring per provider/model
└── index.ts      # Express bootstrap, CORS, /health, /providers, /copilot
```

## License

MIT
