import { Router } from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { ships } = JSON.parse(
  readFileSync(join(__dirname, '../data/ships.json'), 'utf8')
)

const router = Router()

// ── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`
}

function formatPrice(price) {
  if (price === null || price === undefined || price === '') return null
  return '$' + Number(price).toLocaleString('en-US')
}

// ── HTML building blocks ───────────────────────────────────────────────────

function sectionHeader(title) {
  return `<tr>
    <td colspan="2" style="background:#f0f7f5;color:#2A7A8A;font-weight:700;font-size:0.72rem;letter-spacing:0.1em;text-transform:uppercase;padding:7px 18px;border-top:1px solid #c8e8e4;border-bottom:1px solid #c8e8e4;">
      ${title}
    </td>
  </tr>`
}

function subheader(title) {
  return `<tr>
    <td colspan="2" style="background:#daeee9;color:#1A3A4A;font-weight:700;font-size:0.75rem;letter-spacing:0.05em;text-transform:uppercase;padding:7px 18px;">
      ${title}
    </td>
  </tr>`
}

function row(cellA, cellB, shaded = false) {
  const bg = shaded ? 'background:#f7fbfa' : 'background:#fff'
  return `<tr style="${bg}">
    <td>${cellA ?? '—'}</td>
    <td>${cellB ?? '—'}</td>
  </tr>`
}

function diningRows(venuesA, venuesB) {
  const len = Math.max(venuesA.length, venuesB.length)
  return Array.from({ length: len }, (_, i) => {
    const a = venuesA[i]
    const b = venuesB[i]
    const cellA = a
      ? `<strong>${a.name}</strong><br><span class="sub">${a.theme ?? a.description ?? ''}</span>`
      : ''
    const cellB = b
      ? `<strong>${b.name}</strong><br><span class="sub">${b.theme ?? b.description ?? ''}</span>`
      : ''
    return row(cellA, cellB, i % 2 === 1)
  }).join('')
}

function showRows(showsA, showsB) {
  const len = Math.max(showsA.length, showsB.length)
  return Array.from({ length: len }, (_, i) => {
    const a = showsA[i]
    const b = showsB[i]
    const cellA = a ? `<strong>${a.name}</strong><br><span class="sub">${a.description}</span>` : ''
    const cellB = b ? `<strong>${b.name}</strong><br><span class="sub">${b.description}</span>` : ''
    return row(cellA, cellB, i % 2 === 1)
  }).join('')
}

function kidsClubRows(clubsA, clubsB) {
  const keys = [...new Set([...Object.keys(clubsA), ...Object.keys(clubsB)])]
  return keys.map((k, i) => {
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return `
      ${subheader(label)}
      ${row(
        `<span class="sub">${clubsA[k] ?? '—'}</span>`,
        `<span class="sub">${clubsB[k] ?? '—'}</span>`,
        false
      )}`
  }).join('')
}

function barRows(barsA, barsB) {
  const len = Math.max(barsA.length, barsB.length)
  return Array.from({ length: len }, (_, i) => {
    const a = barsA[i]
    const b = barsB[i]
    const cellA = a
      ? `<strong>${a.name}</strong>${a.district ? ` <span class="badge">${a.district}</span>` : ''}<br><span class="sub">${a.type}</span>`
      : ''
    const cellB = b
      ? `<strong>${b.name}</strong>${b.district ? ` <span class="badge">${b.district}</span>` : ''}<br><span class="sub">${b.type}</span>`
      : ''
    return row(cellA, cellB, i % 2 === 1)
  }).join('')
}

// ── HTML document ──────────────────────────────────────────────────────────

function buildHtml({ clientName, sailingA, sailingB, shipA, shipB }) {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  // Collect all stateroom categories mentioned in either sailing
  const allCategories = [...new Set([
    ...sailingA.staterooms.map(s => s.category),
    ...sailingB.staterooms.map(s => s.category),
  ])]

  const pricingSection = allCategories.length === 0 ? '' : `
    ${sectionHeader('Pricing — Family of 4 (incl. taxes, fees &amp; port expenses, est.)')}
    ${allCategories.map((cat, i) => {
      const pA = sailingA.staterooms.find(s => s.category === cat)?.price
      const pB = sailingB.staterooms.find(s => s.category === cat)?.price
      return row(
        `<strong>${cat}</strong>&ensp;${formatPrice(pA) ?? '<span style="color:#999">—</span>'}`,
        `<strong>${cat}</strong>&ensp;${formatPrice(pB) ?? '<span style="color:#999">—</span>'}`,
        i % 2 === 1
      )
    }).join('')}
  `

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sailing Comparison — ${clientName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #F0F8F5; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 860px; margin: 0 auto; padding: 28px 16px 64px; }

    .doc-header { background: #1A3A4A; color: #fff; padding: 22px 28px 18px; border-radius: 10px 10px 0 0; }
    .doc-eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #60C8C0; margin-bottom: 5px; }
    .doc-header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.01em; }
    .doc-header .meta { font-size: 0.72rem; opacity: 0.55; margin-top: 4px; }

    .col-headers { display: grid; grid-template-columns: 1fr 1fr; background: #1A3A4A; }
    .col-header { padding: 12px 18px; }
    .col-header .option-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 3px; }
    .col-header .ship-name { font-size: 1rem; font-weight: 700; color: #fff; }
    .col-header .sailing-meta { font-size: 0.72rem; color: rgba(255,255,255,0.55); margin-top: 2px; }

    .section { margin-top: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section:first-of-type { margin-top: 0; border-radius: 0 0 10px 10px; }

    table { width: 100%; border-collapse: collapse; }
    td { padding: 11px 18px; border-bottom: 1px solid #e4efec; vertical-align: top; font-size: 0.88rem; width: 50%; line-height: 1.45; }
    tr:last-child td { border-bottom: none; }

    strong { font-weight: 600; }
    .sub { color: #4a6868; font-size: 0.83rem; }
    .badge { display: inline-block; background: #e0f2f0; color: #1A3A4A; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; vertical-align: middle; letter-spacing: 0.03em; text-transform: uppercase; margin-left: 4px; }

    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: 100%; }
      .section { box-shadow: none; page-break-inside: avoid; }
    }
  </style>
</head>
<body>
<div class="page">

  <div class="section">
    <div class="doc-header">
      <div class="doc-eyebrow">Escapes with Leah &nbsp;&middot;&nbsp; Disney Cruise Line</div>
      <h1>Sailing Comparison &mdash; ${clientName}</h1>
      <div class="meta">Prepared ${today}</div>
    </div>
    <div class="col-headers">
      <div class="col-header" style="border-right:1px solid rgba(255,255,255,0.12);">
        <div class="option-label" style="color:#60C8C0;">Option A</div>
        <div class="ship-name">${shipA.name}</div>
        <div class="sailing-meta">${formatDate(sailingA.departureDate)}&nbsp;&middot;&nbsp;${sailingA.homeport || '—'}</div>
      </div>
      <div class="col-header">
        <div class="option-label" style="color:#d0a8ff;">Option B</div>
        <div class="ship-name">${shipB.name}</div>
        <div class="sailing-meta">${formatDate(sailingB.departureDate)}&nbsp;&middot;&nbsp;${sailingB.homeport || '—'}</div>
      </div>
    </div>
    <table>
      ${sectionHeader('Sailing Overview')}
      ${row(
        `<strong>Departure</strong><br>${formatDate(sailingA.departureDate)}`,
        `<strong>Departure</strong><br>${formatDate(sailingB.departureDate)}`
      )}
      ${row(
        `<strong>Nights</strong><br>${sailingA.nights || '—'}`,
        `<strong>Nights</strong><br>${sailingB.nights || '—'}`,
        true
      )}
      ${row(
        `<strong>Homeport</strong><br>${sailingA.homeport || '—'}`,
        `<strong>Homeport</strong><br>${sailingB.homeport || '—'}`
      )}
      ${pricingSection}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Ship Highlights')}
      ${row(
        `<strong>Ship</strong><br>${shipA.name}`,
        `<strong>Ship</strong><br>${shipB.name}`
      )}
      ${row(
        `<strong>Class</strong><br>${shipA.class}`,
        `<strong>Class</strong><br>${shipB.class}`,
        true
      )}
      ${row(
        `<strong>Year Launched</strong><br>${shipA.launched}`,
        `<strong>Year Launched</strong><br>${shipB.launched}`
      )}
      ${row(
        `<strong>Guest Capacity</strong><br>${shipA.guest_capacity?.toLocaleString('en-US')}`,
        `<strong>Guest Capacity</strong><br>${shipB.guest_capacity?.toLocaleString('en-US')}`,
        true
      )}
      ${row(
        `<strong>Gross Tonnage</strong><br>${shipA.gross_tonnage?.toLocaleString('en-US')}`,
        `<strong>Gross Tonnage</strong><br>${shipB.gross_tonnage?.toLocaleString('en-US')}`
      )}
      ${row(
        `<strong>Signature Attraction</strong><br><span class="sub">${shipA.signature_attraction}</span>`,
        `<strong>Signature Attraction</strong><br><span class="sub">${shipB.signature_attraction}</span>`,
        true
      )}
      ${row(
        `<strong>Theme</strong><br><span class="sub">${shipA.theme}</span>`,
        `<strong>Theme</strong><br><span class="sub">${shipB.theme}</span>`
      )}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Rotational Dining')}
      ${diningRows(shipA.rotational_dining, shipB.rotational_dining)}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Specialty Dining')}
      ${diningRows(shipA.specialty_dining, shipB.specialty_dining)}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Entertainment — Stage Shows')}
      ${showRows(shipA.stage_shows, shipB.stage_shows)}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Kids Clubs')}
      ${kidsClubRows(shipA.kids_clubs, shipB.kids_clubs)}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Pool Deck')}
      ${row(
        `<strong>Pools</strong><br><span class="sub">${shipA.pool_deck.pools.join(', ')}</span>`,
        `<strong>Pools</strong><br><span class="sub">${shipB.pool_deck.pools.join(', ')}</span>`
      )}
      ${row(
        `<strong>Slides &amp; Attractions</strong><br><span class="sub">${shipA.pool_deck.slides_and_attractions.join(', ')}</span>`,
        `<strong>Slides &amp; Attractions</strong><br><span class="sub">${shipB.pool_deck.slides_and_attractions.join(', ')}</span>`,
        true
      )}
      ${row(
        `<span class="sub">${shipA.pool_deck.notes}</span>`,
        `<span class="sub">${shipB.pool_deck.notes}</span>`
      )}
    </table>
  </div>

  <div class="section">
    <table>
      ${sectionHeader('Bars &amp; Lounges')}
      ${barRows(shipA.bars_and_lounges, shipB.bars_and_lounges)}
    </table>
  </div>

</div>
</body>
</html>`
}

// ── Route ──────────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
  const { clientName, sailingA, sailingB } = req.body

  if (!sailingA || !sailingB) {
    return res.status(400).json({ error: 'Request body must include both sailingA and sailingB.' })
  }

  const shipA = ships.find(s => s.id === sailingA.shipId)
  const shipB = ships.find(s => s.id === sailingB.shipId)

  if (!shipA) return res.status(400).json({ error: `Unknown ship ID: "${sailingA.shipId}"` })
  if (!shipB) return res.status(400).json({ error: `Unknown ship ID: "${sailingB.shipId}"` })

  const html = buildHtml({
    clientName: clientName?.trim() || 'Guest',
    sailingA: { ...sailingA, staterooms: sailingA.staterooms ?? [] },
    sailingB: { ...sailingB, staterooms: sailingB.staterooms ?? [] },
    shipA,
    shipB,
  })

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

export default router
