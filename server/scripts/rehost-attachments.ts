import 'dotenv/config'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { uploadSiniestroFile } from '../src/modules/storage/s3Client.js'

const prisma = new PrismaClient()
const dryRun = process.argv.includes('--dry-run')

function sanitizeFileName(fileName: string) {
  const ext = path.extname(fileName).toLowerCase()
  const name = path.basename(fileName, ext).replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${name}${ext || '.bin'}`
}

async function run() {
  const legacyFiles = await prisma.siniestroArchivo.findMany({
    where: {
      publicUrl: {
        contains: 'supabase.co'
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  })

  let migrated = 0
  const errors: string[] = []

  for (const file of legacyFiles) {
    if (!file.publicUrl) {
      continue
    }

    try {
      const response = await fetch(file.publicUrl)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const contentType =
        response.headers.get('content-type') || file.mimeType || 'application/octet-stream'

      const safeName = sanitizeFileName(file.originalName || 'archivo.bin')
      const key = `migrated/${file.siniestroId}/${Date.now()}-${file.id}-${safeName}`

      if (!dryRun) {
        const uploaded = await uploadSiniestroFile({
          key,
          body: buffer,
          contentType
        })

        await prisma.siniestroArchivo.update({
          where: { id: file.id },
          data: {
            storageMode: 's3',
            s3Key: uploaded.key,
            publicUrl: uploaded.publicUrl,
            mimeType: contentType,
            sizeBytes: buffer.length
          }
        })
      }

      migrated += 1
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'unknown error'
      errors.push(`id=${file.id}; ${message}`)
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: dryRun ? 'dry-run' : 'write',
        scanned: legacyFiles.length,
        migrated,
        errors: errors.length
      },
      null,
      2
    )
  )

  if (errors.length > 0) {
    console.log(errors.join('\n'))
  }
}

run()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
