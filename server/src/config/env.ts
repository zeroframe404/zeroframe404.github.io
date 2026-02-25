import 'dotenv/config'
import { z } from 'zod'

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value && value.length > 0 ? value : undefined))

function splitAllowedOrigins(rawValue: string | undefined) {
  if (!rawValue) return []

  return rawValue
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(8787),
  DATABASE_URL: z.string().min(1),
  ADMIN_DASHBOARD_PASSWORD: optionalTrimmedString,
  ADMIN_ROOT_USERNAME: optionalTrimmedString,
  ADMIN_ROOT_PASSWORD: optionalTrimmedString,
  ADMIN_SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(8),
  ADMIN_COOKIE_SAME_SITE: z.enum(['lax', 'none', 'strict']).default('lax'),
  COOKIE_SECRET: z.string().min(1),
  CORS_ALLOWED_ORIGINS: optionalTrimmedString.transform(splitAllowedOrigins),
  SINIESTRO_FILE_STORAGE: z.enum(['db', 's3', 'dual']).default('db'),
  AWS_REGION: optionalTrimmedString,
  AWS_ACCESS_KEY_ID: optionalTrimmedString,
  AWS_SECRET_ACCESS_KEY: optionalTrimmedString,
  S3_BUCKET_SINIESTROS: optionalTrimmedString,
  S3_PUBLIC_BASE_URL: optionalTrimmedString.pipe(z.string().url().optional())
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const message = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  throw new Error(`Invalid server environment variables:\n${message}`)
}

const envData = parsed.data
const rootUsername = envData.ADMIN_ROOT_USERNAME || 'Daniel'
const rootPassword =
  envData.ADMIN_ROOT_PASSWORD ||
  envData.ADMIN_DASHBOARD_PASSWORD ||
  'DockSud1945!#!'

if (envData.SINIESTRO_FILE_STORAGE !== 'db') {
  const missingAwsVars = [
    ['AWS_REGION', envData.AWS_REGION],
    ['AWS_ACCESS_KEY_ID', envData.AWS_ACCESS_KEY_ID],
    ['AWS_SECRET_ACCESS_KEY', envData.AWS_SECRET_ACCESS_KEY],
    ['S3_BUCKET_SINIESTROS', envData.S3_BUCKET_SINIESTROS]
  ]
    .filter(([, value]) => !value)
    .map(([name]) => name)

  if (missingAwsVars.length > 0) {
    throw new Error(
      `Missing server environment variables for SINIESTRO_FILE_STORAGE=${envData.SINIESTRO_FILE_STORAGE}: ${missingAwsVars.join(', ')}`
    )
  }
}

if (
  envData.ADMIN_COOKIE_SAME_SITE === 'none' &&
  envData.NODE_ENV !== 'production'
) {
  console.warn(
    'ADMIN_COOKIE_SAME_SITE=none usually requires NODE_ENV=production and HTTPS.'
  )
}

export const env = {
  ...envData,
  ADMIN_ROOT_USERNAME: rootUsername,
  ADMIN_ROOT_PASSWORD: rootPassword
}

export function isProduction() {
  return env.NODE_ENV === 'production'
}
