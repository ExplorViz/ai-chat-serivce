import 'dotenv/config'
import {CopilotRuntime, copilotRuntimeNodeHttpEndpoint} from '@copilotkit/runtime'
import cors, {CorsOptions} from 'cors'
import express, {Request, Response, NextFunction} from 'express'
import {allowedOrigins, hasAnyProvider, logLevel, port} from './env'
import {findModel, providers} from './providers'

const PROVIDER_HEADER = 'x-explorviz-provider'
const MODEL_HEADER = 'x-explorviz-model'
const COPILOT_GQL_HEADER = 'x-copilotkit-runtime-client-gql-version'
const ALLOWED_HEADERS = ['content-type', PROVIDER_HEADER, MODEL_HEADER, COPILOT_GQL_HEADER]

const corsOptions: CorsOptions = {
  origin: allowedOrigins && allowedOrigins.length > 0 ? allowedOrigins : true,
  allowedHeaders: ALLOWED_HEADERS,
  exposedHeaders: ALLOWED_HEADERS,
  credentials: true,
}

const app = express()

app.use(cors(corsOptions))

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    providers: providers.map((provider) => provider.id),
    hasAnyProvider,
  })
})

app.get('/providers', (_req: Request, res: Response) => {
  res.json({
    providers: providers.map(({id, name, models}) => ({
      id,
      name,
      models: models.map((model) => ({id: model.id, name: model.name})),
    })),
  })
})

const copilotHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!hasAnyProvider) {
    res.status(503).json({
      error: 'No LLM provider configured. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY on the service.',
    })
    return
  }

  const providerId = stringHeader(req.headers[PROVIDER_HEADER]) ?? queryString(req.query.provider)
  const modelId = stringHeader(req.headers[MODEL_HEADER]) ?? queryString(req.query.model)

  // CopilotKit performs an initial runtime "info" handshake before the UI has
  // provider/model state ready. If headers are missing, fall back to the first
  // available provider/model so that the handshake can succeed.
  const defaultModel = providers[0]?.models[0]
  const model = providerId && modelId ? findModel(providerId, modelId) : defaultModel

  if (!model) {
    res.status(400).json({
      error:
        providerId || modelId
          ? `Unknown provider/model combination: ${providerId}/${modelId}.`
          : `Missing required headers: ${PROVIDER_HEADER} and ${MODEL_HEADER}.`,
      availableProviders: providers.map(({id, models}) => ({
        id,
        models: models.map(({id: modelKey}) => modelKey),
      })),
    })
    return
  }

  try {
    // A new CopilotRuntime must be created per request. The singleton pattern
    // causes handleServiceAdapter() to chain onto the same agents Promise,
    // making it see isAgentsListEmpty=false on the second call and skip
    // overriding the default agent — so every request would always use
    // whichever adapter was selected first (typically OpenAI).
    const runtime = new CopilotRuntime()
    const handler = copilotRuntimeNodeHttpEndpoint({
      endpoint: '/copilot',
      runtime,
      serviceAdapter: model.serviceAdapter,
      logLevel,
    })
    handler(req, res)
  } catch (error) {
    next(error)
  }
}

// IMPORTANT: Use app.post/app.options instead of app.use here. Using app.use
// would strip the `/copilot` prefix from req.url, but the underlying hono
// runtime mounts its routes at basePath `/copilot`, so it requires the full
// path on the request to match. Mounting per-method preserves req.url and
// avoids the silent 404s that otherwise hit the runtime.
app.post('/copilot', copilotHandler)
app.options('/copilot', copilotHandler)

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error in /copilot route:', err)
  if (res.headersSent) return
  res.status(500).json({
    error: 'Internal server error in copilot runtime.',
    message: err instanceof Error ? err.message : 'Unknown error',
  })
})

function stringHeader(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function queryString(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined
  }
  return typeof value === 'string' ? value : undefined
}

const server = app.listen(port, () => {
  if (!hasAnyProvider) {
    console.warn(
      'Warning: No LLM provider API keys configured. The /copilot endpoint will reject requests with 503 until at least one of OPENAI_API_KEY, ANTHROPIC_API_KEY, or GOOGLE_API_KEY is set.'
    )
  }
  console.log(`ExplorViz AI chat service listening on port ${port} (log level: ${logLevel}).`)
  console.log(`Available providers: ${providers.length > 0 ? providers.map(({id}) => id).join(', ') : '(none)'}`)
})

const shutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`)
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(1), 10_000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
