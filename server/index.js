import express from 'express'
import cors from 'cors'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import compareRouter from './routes/compare.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { ships } = JSON.parse(
  readFileSync(join(__dirname, 'data/ships.json'), 'utf8')
)

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.get('/api/ships', (_req, res) => {
  res.json(ships.map(({ id, name, class: shipClass }) => ({ id, name, class: shipClass })))
})

app.use('/api/compare', compareRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dcl-cruise-comparator-api' })
})

app.listen(PORT, () => {
  console.log(`DCL API server running on http://localhost:${PORT}`)
})
