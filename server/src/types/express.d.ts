import type { AdminSessionContext } from '../modules/admin/admin.types.js'

declare global {
  namespace Express {
    interface Request {
      adminSession?: AdminSessionContext
    }
  }
}

export {}
