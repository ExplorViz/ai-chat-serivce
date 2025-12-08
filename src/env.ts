export const port = process.env.PORT || 4300
export const openaiApiKey = process.env.OPENAI_API_KEY
export const googleApiKey = process.env.GOOGLE_API_KEY
export const anthropicApiKey = process.env.ANTHROPIC_API_KEY
export const logLevel = filterValidLogLevels(process.env.COPILOTKIT_LOG_LEVEL)

function filterValidLogLevels(level?: string) {
  const validLogLevels = ['debug', 'info', 'warn', 'error'] as const
  return validLogLevels.includes(level as any) ? (level as (typeof validLogLevels)[number]) : 'info'
}
