import { env } from './config/env.js'
import { createApp } from './app.js'
import { prisma } from './modules/db/prisma.js'

const app = createApp()

const server = app.listen(env.PORT, () => {
  console.log(`API server listening on port ${env.PORT}`)
})

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}. Closing server...`)
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}

process.on('SIGINT', () => {
  void shutdown('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdown('SIGTERM')
})
