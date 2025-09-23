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
    serviceAdapter: CopilotServiceAdapter
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
    models: ['default'].map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new GoogleGenerativeAIAdapter({apiKey: googleApiKey}),
    })),
  })
}

if (anthropicApiKey) {
  providers.push({
    id: 'anthropic',
    name: 'Anthropic',
    models: ['default'].map((model) => ({
      id: model,
      name: model,
      serviceAdapter: new AnthropicAdapter({anthropic: new Anthropic({apiKey: anthropicApiKey})}),
    })),
  })
}
