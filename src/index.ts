import 'dotenv/config'
import express from 'express'
import {CopilotRuntime, copilotRuntimeNodeHttpEndpoint} from '@copilotkit/runtime'
import {port} from './env'
import {providers} from './providers'
import cors from 'cors'

const app = express()
const runtime = new CopilotRuntime()
const endpoint = '/copilot'

app.use(
  cors({
    allowedHeaders: [
      'content-type',
      'x-explorviz-provider',
      'x-explorviz-model',
      'x-copilotkit-runtime-client-gql-version',
    ],
    exposedHeaders: [
      'content-type',
      'x-explorviz-provider',
      'x-explorviz-model',
      'x-copilotkit-runtime-client-gql-version',
    ],
  })
)

app.get('/providers', (req, res) => {
  res.json({
    providers: providers.map(({id, name, models}) => ({
      id,
      name,
      models: models.map((model) => ({id: model.id, name: model.name})),
    })),
  })
})

app.use(endpoint, (req, res, next) => {
  try {
    const models = providers.find(({id}) => id === req.headers['x-explorviz-provider'])?.models
    const serviceAdapter = models?.find(({id}) => id === req.headers['x-explorviz-model'])?.serviceAdapter

    if (serviceAdapter) {
      const handler = copilotRuntimeNodeHttpEndpoint({
        endpoint,
        runtime,
        serviceAdapter,
      })
      handler(req, res)
    } else {
      res.status(400).json({error: 'Invalid provider or model.'})
    }
  } catch (error) {
    next(error)
  }
})

app.listen(port)
