import { Router } from 'express'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const { ships } = JSON.parse(
  readFileSync(join(__dirname, '../data/ships.json'), 'utf8')
)

const router = Router()

// ── Utilities ──────────────────────────────────────────────────────────────

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

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function nl2br(str) {
  return escapeHtml(str).replace(/\n/g, '<br>')
}

// ── Shared styles ──────────────────────────────────────────────────────────

function docStyles() {
  return `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', sans-serif; background: #F0F8F5; color: #1a1a1a; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { max-width: 860px; margin: 0 auto; padding: 28px 16px 64px; }

    .client-message { font-size: 14px; color: #1e2e2e; line-height: 1.7; margin-bottom: 20px; }

    .doc-header { background: #1A3A4A; color: #fff; padding: 22px 28px 18px; border-radius: 10px 10px 0 0; }
    .doc-eyebrow { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #60C8C0; margin-bottom: 5px; }
    .doc-header h1 { font-size: 1.25rem; font-weight: 700; letter-spacing: -0.01em; }
    .doc-header .meta { font-size: 0.72rem; opacity: 0.55; margin-top: 4px; }

    .section { margin-top: 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .section:first-of-type { margin-top: 0; border-radius: 0 0 10px 10px; }

    table { width: 100%; border-collapse: collapse; }
    td { padding: 11px 18px; border-bottom: 1px solid #e4efec; vertical-align: top; font-size: 0.88rem; line-height: 1.45; }
    tr:last-child td { border-bottom: none; }

    strong { font-weight: 600; }
    .sub { color: #4a6868; font-size: 0.83rem; }
    .badge { display: inline-block; background: #e0f2f0; color: #1A3A4A; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; vertical-align: middle; letter-spacing: 0.03em; text-transform: uppercase; margin-left: 4px; }

    .col-headers { display: grid; grid-template-columns: 1fr 1fr; background: #1A3A4A; }
    .col-header { padding: 12px 18px; }
    .col-header .option-label { font-size: 0.68rem; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 3px; }
    .col-header .ship-name { font-size: 1rem; font-weight: 700; color: #fff; }
    .col-header .sailing-meta { font-size: 0.72rem; color: rgba(255,255,255,0.55); margin-top: 2px; }

    .doc-footer { background: #1A3A4A; border-radius: 10px; margin-top: 20px; }
    .doc-footer td { border-bottom: none; text-align: center; padding: 16px 24px; }

    @media print {
      body { background: #fff; }
      .page { padding: 0; max-width: 100%; }
      .section { box-shadow: none; page-break-inside: avoid; }
    }
  `
}

// ── Shared footer ──────────────────────────────────────────────────────────

function footerHtml() {
  return `
  <div class="section doc-footer">
    <table>
      <tr>
        <td>
          <div style="font-size:1rem;font-weight:700;color:#60C8C0;margin-bottom:4px;">Escapes with Leah</div>
          <div style="font-size:0.72rem;color:rgba(255,255,255,0.55);">leah.debruycker@fora.travel &nbsp;&middot;&nbsp; 651-503-0060 &nbsp;&middot;&nbsp; @escapeswithleah</div>
        </td>
      </tr>
    </table>
  </div>`
}

// ── 2-column HTML helpers ──────────────────────────────────────────────────

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
    const cellA = a ? `<strong>${a.name}</strong><br><span class="sub">${a.theme ?? a.description ?? ''}</span>` : ''
    const cellB = b ? `<strong>${b.name}</strong><br><span class="sub">${b.theme ?? b.description ?? ''}</span>` : ''
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

// ── 3-column HTML helpers ──────────────────────────────────────────────────

const LABEL_STYLE = 'width:130px;padding:7px 12px;background:#F0F8F5;border-right:1px solid #c8e8e4;border-bottom:1px solid #edf5f2;font-size:9.5px;font-weight:700;letter-spacing:0.07em;text-transform:uppercase;color:#4a6e72;vertical-align:top;'

function sectionHeader3(title) {
  return `<tr>
    <td colspan="4" style="padding:6px 12px;background:#f0f7f5;font-size:9.5px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#2A7A8A;border-top:1px solid #c8e8e4;border-bottom:1px solid #c8e8e4;">
      ${title}
    </td>
  </tr>`
}

function row3(label, cellA, cellB, cellC, shaded = false) {
  const bg = shaded ? '#f7fbfa' : '#fff'
  const dataTd = `padding:7px 14px;border-right:1px solid #c8e8e4;border-bottom:1px solid #edf5f2;font-size:0.88rem;vertical-align:top;`
  const lastTd = `padding:7px 14px;border-bottom:1px solid #edf5f2;font-size:0.88rem;vertical-align:top;`
  return `<tr style="background:${bg}">
    <td style="${LABEL_STYLE}">${label}</td>
    <td style="${dataTd}">${cellA ?? '—'}</td>
    <td style="${dataTd}">${cellB ?? '—'}</td>
    <td style="${lastTd}">${cellC ?? '—'}</td>
  </tr>`
}

function fmtDining(v) {
  return v ? `<strong>${v.name}</strong><br><span style="color:#4a6868;font-size:0.83rem;">${v.theme ?? v.description ?? ''}</span>` : ''
}

function fmtShow(v) {
  return v ? `<strong>${v.name}</strong><br><span style="color:#4a6868;font-size:0.83rem;">${v.description}</span>` : ''
}

function fmtBar(b) {
  if (!b) return ''
  return `<strong>${b.name}</strong>${b.district ? ` <span class="badge">${b.district}</span>` : ''}<br><span style="color:#4a6868;font-size:0.83rem;">${b.type}</span>`
}

function diningRows3(venuesA, venuesB, venuesC) {
  const len = Math.max(venuesA.length, venuesB.length, venuesC.length)
  return Array.from({ length: len }, (_, i) =>
    row3(`Restaurant ${i + 1}`, fmtDining(venuesA[i]), fmtDining(venuesB[i]), fmtDining(venuesC[i]), i % 2 === 1)
  ).join('')
}

function showRows3(showsA, showsB, showsC) {
  const len = Math.max(showsA.length, showsB.length, showsC.length)
  return Array.from({ length: len }, (_, i) =>
    row3(`Show ${i + 1}`, fmtShow(showsA[i]), fmtShow(showsB[i]), fmtShow(showsC[i]), i % 2 === 1)
  ).join('')
}

function kidsClubRows3(clubsA, clubsB, clubsC) {
  const keys = [...new Set([...Object.keys(clubsA), ...Object.keys(clubsB), ...Object.keys(clubsC)])]
  return keys.map((k, i) => {
    const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return row3(label,
      `<span style="color:#4a6868;font-size:0.83rem;">${clubsA[k] ?? '—'}</span>`,
      `<span style="color:#4a6868;font-size:0.83rem;">${clubsB[k] ?? '—'}</span>`,
      `<span style="color:#4a6868;font-size:0.83rem;">${clubsC[k] ?? '—'}</span>`,
      i % 2 === 1)
  }).join('')
}

function barRows3(barsA, barsB, barsC) {
  const len = Math.max(barsA.length, barsB.length, barsC.length)
  return Array.from({ length: len }, (_, i) =>
    row3(`Venue ${i + 1}`, fmtBar(barsA[i]), fmtBar(barsB[i]), fmtBar(barsC[i]), i % 2 === 1)
  ).join('')
}

// ── HTML document builders ─────────────────────────────────────────────────

function buildHtmlTwo({ clientName, clientMessage, sailingA, sailingB, shipA, shipB }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

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
  <title>Sailing Comparison — ${escapeHtml(clientName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${docStyles()}</style>
</head>
<body>
<div class="page">

  ${clientMessage ? `<p class="client-message">${nl2br(clientMessage)}</p>` : ''}

  <div class="section">
    <div class="doc-header">
      <div class="doc-eyebrow">Escapes with Leah &nbsp;&middot;&nbsp; Disney Cruise Line</div>
      <h1>Sailing Comparison &mdash; ${escapeHtml(clientName)}</h1>
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
      ${row(`<strong>Ship</strong><br>${shipA.name}`, `<strong>Ship</strong><br>${shipB.name}`)}
      ${row(`<strong>Class</strong><br>${shipA.class}`, `<strong>Class</strong><br>${shipB.class}`, true)}
      ${row(`<strong>Year Launched</strong><br>${shipA.launched}`, `<strong>Year Launched</strong><br>${shipB.launched}`)}
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

  ${footerHtml()}

</div>
</body>
</html>`
}

function buildHtmlThree({ clientName, clientMessage, sailingA, sailingB, sailingC, shipA, shipB, shipC }) {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const allCategories = [...new Set([
    ...sailingA.staterooms.map(s => s.category),
    ...sailingB.staterooms.map(s => s.category),
    ...sailingC.staterooms.map(s => s.category),
  ])]

  const colHeaderTd = (label, color, ship, sailing, borderRight = true) => `
    <td style="padding:10px 14px;background:#1A3A4A;${borderRight ? 'border-right:1px solid rgba(255,255,255,0.12);' : ''}border-bottom:2px solid #c8e8e4;">
      <div style="font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${color};margin-bottom:3px;">${label}</div>
      <div style="font-size:16px;font-weight:700;color:#fff;">${ship.name}</div>
      <div style="font-size:10px;color:rgba(255,255,255,0.55);margin-top:1px;">${formatDate(sailing.departureDate)}&nbsp;&middot;&nbsp;${sailing.homeport || '—'}</div>
    </td>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sailing Comparison — ${escapeHtml(clientName)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${docStyles()}
    .badge { display: inline-block; background: #e0f2f0; color: #1A3A4A; font-size: 0.68rem; font-weight: 700; padding: 1px 6px; border-radius: 4px; vertical-align: middle; letter-spacing: 0.03em; text-transform: uppercase; margin-left: 4px; }
  </style>
</head>
<body>
<div class="page">

  ${clientMessage ? `<p class="client-message">${nl2br(clientMessage)}</p>` : ''}

  <div class="section">
    <div class="doc-header">
      <div class="doc-eyebrow">Escapes with Leah &nbsp;&middot;&nbsp; Disney Cruise Line</div>
      <h1>Three Sailings &mdash; ${escapeHtml(clientName)}</h1>
      <div class="meta">Prepared ${today}</div>
    </div>
    <table>
      <tr>
        <td width="130" style="padding:10px 12px;background:#F0F8F5;border-right:1px solid #c8e8e4;border-bottom:2px solid #c8e8e4;"></td>
        ${colHeaderTd('Option A', '#60C8C0', shipA, sailingA)}
        ${colHeaderTd('Option B', '#d0a8ff', shipB, sailingB)}
        ${colHeaderTd('Option C', '#f5c060', shipC, sailingC, false)}
      </tr>

      ${sectionHeader3('Sailing Overview')}
      ${row3('Departure', formatDate(sailingA.departureDate), formatDate(sailingB.departureDate), formatDate(sailingC.departureDate))}
      ${row3('Nights', String(sailingA.nights || '—'), String(sailingB.nights || '—'), String(sailingC.nights || '—'), true)}
      ${row3('Homeport', sailingA.homeport || '—', sailingB.homeport || '—', sailingC.homeport || '—')}

      ${allCategories.length > 0 ? `
        ${sectionHeader3('Pricing — Family of 4 (incl. taxes, fees &amp; port expenses, est.)')}
        ${allCategories.map((cat, i) => {
          const pA = sailingA.staterooms.find(s => s.category === cat)?.price
          const pB = sailingB.staterooms.find(s => s.category === cat)?.price
          const pC = sailingC.staterooms.find(s => s.category === cat)?.price
          return row3(cat, formatPrice(pA) ?? '—', formatPrice(pB) ?? '—', formatPrice(pC) ?? '—', i % 2 === 1)
        }).join('')}
      ` : ''}

      ${sectionHeader3('The Ship')}
      ${row3('Class', shipA.class, shipB.class, shipC.class)}
      ${row3('Launched', String(shipA.launched), String(shipB.launched), String(shipC.launched), true)}
      ${row3('Guest Capacity', shipA.guest_capacity?.toLocaleString('en-US'), shipB.guest_capacity?.toLocaleString('en-US'), shipC.guest_capacity?.toLocaleString('en-US'))}
      ${row3('Gross Tonnage', shipA.gross_tonnage?.toLocaleString('en-US'), shipB.gross_tonnage?.toLocaleString('en-US'), shipC.gross_tonnage?.toLocaleString('en-US'), true)}
      ${row3('Signature Attraction',
        `<span style="color:#4a6868;font-size:0.83rem;">${shipA.signature_attraction}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipB.signature_attraction}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipC.signature_attraction}</span>`
      )}
      ${row3('Theme',
        `<span style="color:#4a6868;font-size:0.83rem;">${shipA.theme}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipB.theme}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipC.theme}</span>`,
        true
      )}

      ${sectionHeader3('Rotational Dining')}
      ${diningRows3(shipA.rotational_dining, shipB.rotational_dining, shipC.rotational_dining)}

      ${sectionHeader3('Specialty Dining')}
      ${diningRows3(shipA.specialty_dining, shipB.specialty_dining, shipC.specialty_dining)}

      ${sectionHeader3('Entertainment — Stage Shows')}
      ${showRows3(shipA.stage_shows, shipB.stage_shows, shipC.stage_shows)}

      ${sectionHeader3('Kids Clubs')}
      ${kidsClubRows3(shipA.kids_clubs, shipB.kids_clubs, shipC.kids_clubs)}

      ${sectionHeader3('Pool Deck')}
      ${row3('Pools',
        `<span style="color:#4a6868;font-size:0.83rem;">${shipA.pool_deck.pools.join(', ')}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipB.pool_deck.pools.join(', ')}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipC.pool_deck.pools.join(', ')}</span>`
      )}
      ${row3('Slides &amp; Attractions',
        `<span style="color:#4a6868;font-size:0.83rem;">${shipA.pool_deck.slides_and_attractions.join(', ')}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipB.pool_deck.slides_and_attractions.join(', ')}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipC.pool_deck.slides_and_attractions.join(', ')}</span>`,
        true
      )}
      ${row3('Notes',
        `<span style="color:#4a6868;font-size:0.83rem;">${shipA.pool_deck.notes}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipB.pool_deck.notes}</span>`,
        `<span style="color:#4a6868;font-size:0.83rem;">${shipC.pool_deck.notes}</span>`
      )}

      ${sectionHeader3('Bars &amp; Lounges')}
      ${barRows3(shipA.bars_and_lounges, shipB.bars_and_lounges, shipC.bars_and_lounges)}

    </table>
  </div>

  ${footerHtml()}

</div>
</body>
</html>`
}

// ── Route ──────────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
  const { clientName, clientMessage, sailingA, sailingB, sailingC } = req.body

  if (!sailingA || !sailingB) {
    return res.status(400).json({ error: 'Request body must include both sailingA and sailingB.' })
  }

  const shipA = ships.find(s => s.id === sailingA.shipId)
  const shipB = ships.find(s => s.id === sailingB.shipId)

  if (!shipA) return res.status(400).json({ error: `Unknown ship ID: "${sailingA.shipId}"` })
  if (!shipB) return res.status(400).json({ error: `Unknown ship ID: "${sailingB.shipId}"` })

  const name = clientName?.trim() || 'Guest'
  const message = clientMessage?.trim() || ''
  const sA = { ...sailingA, staterooms: sailingA.staterooms ?? [] }
  const sB = { ...sailingB, staterooms: sailingB.staterooms ?? [] }

  let html
  if (sailingC) {
    const shipC = ships.find(s => s.id === sailingC.shipId)
    if (!shipC) return res.status(400).json({ error: `Unknown ship ID: "${sailingC.shipId}"` })
    html = buildHtmlThree({
      clientName: name,
      clientMessage: message,
      sailingA: sA,
      sailingB: sB,
      sailingC: { ...sailingC, staterooms: sailingC.staterooms ?? [] },
      shipA,
      shipB,
      shipC,
    })
  } else {
    html = buildHtmlTwo({ clientName: name, clientMessage: message, sailingA: sA, sailingB: sB, shipA, shipB })
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.send(html)
})

export default router
