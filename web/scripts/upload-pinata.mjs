import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'
import { createReadStream } from 'fs'
import FormData from 'form-data'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
import { config } from 'dotenv'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: join(__dirname, '../.env.local') })

const JWT = process.env.PINATA_JWT
if (!JWT) { console.error('PINATA_JWT not set'); process.exit(1) }

const DIST = join(__dirname, '../dist')

function getAllFiles(dir, baseDir = dir) {
  const entries = readdirSync(dir)
  const files = []
  for (const entry of entries) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      files.push(...getAllFiles(full, baseDir))
    } else {
      files.push({ full, rel: relative(baseDir, full) })
    }
  }
  return files
}

async function upload() {
  const files = getAllFiles(DIST)
  console.log(`Uploading ${files.length} files from dist/...`)

  const form = new FormData()
  for (const { full, rel } of files) {
    form.append('file', createReadStream(full), { filepath: `dist/${rel}` })
  }
  form.append('pinataMetadata', JSON.stringify({ name: 'ai-bot-registrar' }))
  form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))

  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${JWT}`, ...form.getHeaders() },
    body: form,
  })

  const data = await res.json()
  if (!res.ok) { console.error('Upload failed:', data); process.exit(1) }

  console.log(`\nSuccess!`)
  console.log(`CID: ${data.IpfsHash}`)
  console.log(`URL: https://${data.IpfsHash}.ipfs.dweb.link`)
  console.log(`\nSet this as the contenthash on ai-bot.eth:`)
  console.log(`ipfs://${data.IpfsHash}`)
}

upload()
