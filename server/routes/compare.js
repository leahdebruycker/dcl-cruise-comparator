import { Router } from 'express'

const router = Router()

/**
 * POST /api/compare
 *
 * Body:
 * {
 *   sailingA: { shipId: string, itinerary: string, nights: number, departureDate: string, homeport: string },
 *   sailingB: { shipId: string, itinerary: string, nights: number, departureDate: string, homeport: string }
 * }
 *
 * Returns a side-by-side comparison of the two sailings and their ships.
 */
router.post('/', (req, res) => {
  const { sailingA, sailingB } = req.body

  if (!sailingA || !sailingB) {
    return res.status(400).json({
      error: 'Request body must include both sailingA and sailingB.',
    })
  }

  // TODO: load ship data from ships.json and build a real comparison
  res.json({
    status: 'stub',
    message: 'Comparison endpoint is not yet implemented.',
    received: { sailingA, sailingB },
  })
})

export default router
