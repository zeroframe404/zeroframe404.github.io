import type { AdminSession } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSession
    }
  }
}

export {}

