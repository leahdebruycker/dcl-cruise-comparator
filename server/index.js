import express from 'express'
import cors from 'cors'
import compareRouter from './routes/compare.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())

app.use('/api/compare', compareRouter)

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'dcl-cruise-comparator-api' })
})

app.listen(PORT, () => {
  console.log(`DCL API server running on http://localhost:${PORT}`)
})
