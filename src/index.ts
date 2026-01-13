import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import openapi from '@elysiajs/openapi'
import staticPlugin from '@elysiajs/static'
import { env } from '@yolk-oss/elysia-env'

import { log } from '@/log'
import { device } from '@/modules/device'

const app = new Elysia()
  .use(cors())
  .use(
    env({
      DATABASE_URL: t.String({
        format: 'uri',
        description: 'Database connection URL',
      }),
    }),
  )
  .use(log.into())
  .use(openapi())
  .use(staticPlugin())
  .use(device)
  .listen(3000)

log.info(`🦊 ElysiaJS is running at ${app.server?.url}`)
log.info(`⚡️ Check OpenAPI docs at ${app.server?.url}openapi`)
