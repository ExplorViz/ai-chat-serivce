import {AnthropicAdapter, CopilotServiceAdapter, GoogleGenerativeAIAdapter, OpenAIAdapter} from '@copilotkit/runtime'
import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import {anthropicApiKey, googleApiKey, openaiApiKey} from './env'

export interface ProviderModel {
  id: string
  name: string
  serviceAdapter: CopilotServiceAdapter
}

export interface Provider {
  id: string
  name: string
  models: ProviderModel[]
}

const OPENAI_MODELS = ['gpt-5', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini'] as const

const GOOGLE_MODELS = ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'] as const

const ANTHROPIC_MODELS = ['claude-opus-4-7', 'claude-sonnet-4-5', 'claude-haiku-4-5'] as const

function buildOpenAiProvider(apiKey: string): Provider {
  const openai = new OpenAI({apiKey})
  return {
    id: 'openai',
    name: 'OpenAI',
    models: OPENAI_MODELS.map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new OpenAIAdapter({openai, model}),
    })),
  }
}

function buildGoogleProvider(apiKey: string): Provider {
  return {
    id: 'google',
    name: 'Google',
    models: GOOGLE_MODELS.map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new GoogleGenerativeAIAdapter({apiKey, model}),
    })),
  }
}

function buildAnthropicProvider(apiKey: string): Provider {
  const anthropic = new Anthropic({apiKey, baseURL: "https://api.anthropic.com/v1"})
  return {
    id: 'anthropic',
    name: 'Anthropic',
    models: ANTHROPIC_MODELS.map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new AnthropicAdapter({anthropic, model}),
    })),
  }
}

export const providers: Provider[] = []

if (openaiApiKey) providers.push(buildOpenAiProvider(openaiApiKey))
if (googleApiKey) providers.push(buildGoogleProvider(googleApiKey))
if (anthropicApiKey) providers.push(buildAnthropicProvider(anthropicApiKey))

export function findProvider(providerId: string | undefined): Provider | undefined {
  if (!providerId) return undefined
  return providers.find((provider) => provider.id === providerId)
}

export function findModel(providerId: string | undefined, modelId: string | undefined): ProviderModel | undefined {
  if (!modelId) return undefined
  return findProvider(providerId)?.models.find((model) => model.id === modelId)
}
