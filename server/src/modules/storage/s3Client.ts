import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { env } from '../../config/env.js'

type S3RuntimeConfig = {
  region: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
}

let cachedS3Client: S3Client | null = null

function resolveS3Config(): S3RuntimeConfig {
  if (
    !env.AWS_REGION ||
    !env.AWS_ACCESS_KEY_ID ||
    !env.AWS_SECRET_ACCESS_KEY ||
    !env.S3_BUCKET_SINIESTROS
  ) {
    throw new Error('S3 is not configured. Set AWS_* and S3_BUCKET_SINIESTROS.')
  }

  return {
    region: env.AWS_REGION,
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    bucket: env.S3_BUCKET_SINIESTROS
  }
}

function getS3Client(config: S3RuntimeConfig) {
  if (cachedS3Client) {
    return cachedS3Client
  }

  cachedS3Client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })

  return cachedS3Client
}

function buildPublicUrl(key: string) {
  const config = resolveS3Config()

  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/+$/, '')}/${key}`
  }

  return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`
}

export async function uploadSiniestroFile(params: {
  key: string
  body: Buffer
  contentType: string
}) {
  const config = resolveS3Config()

  await getS3Client(config).send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: params.key,
      Body: params.body,
      ContentType: params.contentType
    })
  )

  return {
    bucket: config.bucket,
    key: params.key,
    publicUrl: buildPublicUrl(params.key)
  }
}
