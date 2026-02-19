import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const rootDir = process.cwd()
const outputDir = path.join(rootDir, 'public', 'optimized')

const jobs = [
  {
    input: path.join(rootDir, 'public', 'logo.png'),
    variants: [
      { fileName: 'logo-96.webp', width: 96, format: 'webp', options: { quality: 82 } },
      { fileName: 'logo-96.avif', width: 96, format: 'avif', options: { quality: 56 } }
    ]
  },
  {
    input: path.join(rootDir, 'public', 'ATMDockSud.png'),
    variants: [
      { fileName: 'atm-dock-sud-480.webp', width: 480, format: 'webp', options: { quality: 72 } },
      { fileName: 'atm-dock-sud-480.avif', width: 480, format: 'avif', options: { quality: 48 } }
    ]
  },
  {
    input: path.join(rootDir, 'public', 'ATMLanus.png'),
    variants: [
      { fileName: 'atm-lanus-480.webp', width: 480, format: 'webp', options: { quality: 72 } },
      { fileName: 'atm-lanus-480.avif', width: 480, format: 'avif', options: { quality: 48 } }
    ]
  }
]

async function buildVariant(inputPath, variant) {
  const outputPath = path.join(outputDir, variant.fileName)
  const image = sharp(inputPath).rotate().resize({
    width: variant.width,
    withoutEnlargement: true
  })

  if (variant.format === 'webp') {
    await image.webp(variant.options).toFile(outputPath)
    return outputPath
  }

  if (variant.format === 'avif') {
    await image.avif(variant.options).toFile(outputPath)
    return outputPath
  }

  throw new Error(`Unsupported format for ${variant.fileName}`)
}

async function main() {
  await mkdir(outputDir, { recursive: true })
  const generated = []

  for (const job of jobs) {
    for (const variant of job.variants) {
      const outputPath = await buildVariant(job.input, variant)
      generated.push(path.relative(rootDir, outputPath))
    }
  }

  for (const file of generated) {
    console.log(`Generated ${file}`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
