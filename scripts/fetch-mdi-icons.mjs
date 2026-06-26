import { mkdir, writeFile } from 'node:fs/promises'
import { get } from 'node:https'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const VERSION = '7.4.47'
const META_URL = `https://cdn.jsdelivr.net/npm/@mdi/svg@${VERSION}/meta.json`

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const root = dirname(__dirname)
const outputDir = join(root, 'src', 'assets')
const outputPath = join(outputDir, 'mdi-icons.json')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    get(url, response => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        fetchJson(response.headers.location).then(resolve, reject)
        return
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch ${url}: ${response.statusCode}`))
        return
      }
      let data = ''
      response.setEncoding('utf8')
      response.on('data', chunk => {
        data += chunk
      })
      response.on('end', () => {
        try {
          resolve(JSON.parse(data))
        } catch (error) {
          reject(error)
        }
      })
      response.on('error', reject)
    }).on('error', reject)
  })
}

async function main() {
  console.log(`Fetching MDI meta.json for version ${VERSION}...`)
  const meta = await fetchJson(META_URL)

  if (!Array.isArray(meta)) {
    throw new TypeError('Unexpected meta.json structure: top level is not an array')
  }

  const icons = meta
    .map(item => item?.name)
    .filter(name => typeof name === 'string' && name.length > 0)
    .toSorted((a, b) => a.localeCompare(b))

  const result = {
    version: VERSION,
    count: icons.length,
    icons,
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, JSON.stringify(result, null, 2) + '\n', 'utf8')

  console.log(`Saved ${icons.length} icon names to ${outputPath}`)
}

main().catch(error => {
  console.error(error)
})
