import { Elysia, t } from 'elysia'
import cors from '@elysiajs/cors'
import { fromTypes, openapi } from '@elysiajs/openapi'
import staticPlugin from '@elysiajs/static'
import { env } from '@yolk-oss/elysia-env'

import packageJson from 'package.json'
import { log } from '@/log'
import { devices } from '@/modules/devices'
import { plates } from '@/modules/plates'
import { projects } from '@/modules/projects'
import { scans } from '@/modules/scans'

const staticFilesPrefix = '/public'

const app = new Elysia()
  .use(log.into())
  .use(
    env({
      DATABASE_URL: t.String({
        format: 'uri',
        description: 'Database connection URL',
      }),
    }),
  )
  .use(
    openapi({
      documentation: {
        info: {
          title: 'Snapmaker Farm API',
          version: packageJson.version,
          description:
            'This is the API documentation for Snapmaker Farm, ' +
            'a management system for Snapmaker 3D printers and devices.',
        },
      },
      exclude: {
        paths: [`${staticFilesPrefix}/*`],
      },
      references: fromTypes(
        process.env.NODE_ENV === 'production' ? 'dist/index.d.ts' : 'src/index.ts',
      ),
    }),
  )
  .use(staticPlugin({ prefix: staticFilesPrefix }))
  .use(cors())
  .use(devices)
  .use(plates)
  .use(projects)
  .use(scans)
  .onError((ctx) => {
    ctx.log?.error(ctx, ctx.error.toString())
    return 'onError'
  })
  .listen(3000)

log.info(`🦊 ElysiaJS is running at ${app.server?.url}`)
log.info(`⚡️ Check OpenAPI docs at ${app.server?.url}openapi`)
