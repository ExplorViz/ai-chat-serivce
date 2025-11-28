import {AnthropicAdapter, CopilotServiceAdapter, GoogleGenerativeAIAdapter, OpenAIAdapter} from '@copilotkit/runtime'
import {anthropicApiKey, googleApiKey, openaiApiKey} from './env'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

interface Provider {
  id: string
  name: string
  models: {
    id: string
    name: string
    serviceAdapter: CopilotServiceAdapter | GoogleGenerativeAIAdapter | AnthropicAdapter
  }[]
}

export const providers: Provider[] = []

if (openaiApiKey) {
  providers.push({
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-5', 'gpt-5-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini'].map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new OpenAIAdapter({openai: new OpenAI({apiKey: openaiApiKey}), model}),
    })),
  })
}

if (googleApiKey) {
  providers.push({
    id: 'google',
    name: 'Google',
    models: ['gemini-3-pro-preview', 'gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.5-flash-lite'].map((model) => {
      return {
        id: model,
        name: model,
        serviceAdapter: new GoogleGenerativeAIAdapter({apiKey: googleApiKey, model}),
      }
    }),
  })
}

if (anthropicApiKey) {
  providers.push({
    id: 'anthropic',
    name: 'Anthropic',
    models: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5', 'claude-opus-4-1'].map((model) => {
      return {
        id: model,
        name: model,
        serviceAdapter: new AnthropicAdapter({anthropic: new Anthropic({apiKey: anthropicApiKey}), model}),
      }
    }),
  })
}
