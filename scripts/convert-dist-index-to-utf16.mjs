import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const rootDir = process.cwd()
const distDir = path.join(rootDir, 'dist')

function ensureUtf16Meta(html) {
  return html.replace(
    /<meta\s+charset\s*=\s*["']utf-8["']\s*\/?>/i,
    '<meta charset="UTF-16" />'
  )
}

async function main() {
  let entries
  try {
    entries = await readdir(distDir, { withFileTypes: true })
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      throw new Error(`No se encontro ${distDir}. Ejecuta primero el build de Vite.`)
    }
    throw error
  }

  const htmlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.html'))
    .map((entry) => path.join(distDir, entry.name))

  if (htmlFiles.length === 0) {
    console.log('No HTML files found in dist/. Nothing to convert.')
    return
  }

  for (const htmlPath of htmlFiles) {
    const html = await readFile(htmlPath, 'utf8')
    const htmlWithUtf16Meta = ensureUtf16Meta(html)
    const utf16WithBom = `\uFEFF${htmlWithUtf16Meta}`
    await writeFile(htmlPath, utf16WithBom, 'utf16le')
    console.log(`Converted ${path.relative(rootDir, htmlPath)} to UTF-16LE with BOM`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
