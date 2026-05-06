const VALID_LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const
type LogLevel = (typeof VALID_LOG_LEVELS)[number]

function parsePort(rawPort: string | undefined, fallback: number): number {
  if (!rawPort) return fallback
  const parsed = Number.parseInt(rawPort, 10)
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > 65535) {
    console.warn(`Invalid PORT "${rawPort}" – falling back to default ${fallback}.`)
    return fallback
  }
  return parsed
}

function parseLogLevel(rawLevel: string | undefined): LogLevel {
  if (!rawLevel) return 'info'
  return (VALID_LOG_LEVELS as readonly string[]).includes(rawLevel) ? (rawLevel as LogLevel) : 'info'
}

function trimmedOrUndefined(value: string | undefined): string | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

export const port = parsePort(process.env.PORT, 4300)
export const openaiApiKey = trimmedOrUndefined(process.env.OPENAI_API_KEY)
export const googleApiKey = trimmedOrUndefined(process.env.GOOGLE_API_KEY)
export const anthropicApiKey = trimmedOrUndefined(process.env.ANTHROPIC_API_KEY)
export const logLevel: LogLevel = parseLogLevel(process.env.COPILOTKIT_LOG_LEVEL)

export const allowedOrigins = trimmedOrUndefined(process.env.ALLOWED_ORIGINS)
  ?.split(',')
  .map((entry) => entry.trim())
  .filter((entry) => entry.length > 0)

export const hasAnyProvider = Boolean(openaiApiKey || googleApiKey || anthropicApiKey)
