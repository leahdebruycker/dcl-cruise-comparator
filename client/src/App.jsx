import { useState, useEffect, useMemo } from 'react'
import './App.css'

const STATEROOM_CATEGORIES = ['Interior', 'Oceanview', 'Verandah']

function emptySailing() {
  return {
    sailingId: '',
    shipId: '',
    departureDate: '',
    nights: '',
    homeport: '',
    itinerary: '',
    categories: { Interior: false, Oceanview: false, Verandah: false },
    prices: { Interior: '', Oceanview: '', Verandah: '' },
  }
}

function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[Number(m) - 1]} ${Number(d)}, ${y}`
}

function SailingPanel({ label, state, setState, sailings, ships }) {
  // Group sailings by ship for the dropdown
  const sailingsByShip = useMemo(() => {
    const groups = {}
    for (const s of sailings) {
      const ship = ships.find(sh => sh.id === s.shipId)
      const shipName = ship ? ship.name : s.shipId
      if (!groups[shipName]) groups[shipName] = []
      groups[shipName].push(s)
    }
    return groups
  }, [sailings, ships])

  function selectSailing(sailingId) {
    if (!sailingId) {
      setState(prev => ({
        ...emptySailing(),
        categories: prev.categories,
        prices: prev.prices,
      }))
      return
    }
    const found = sailings.find(s => s.id === sailingId)
    if (!found) return
    setState(prev => ({
      ...prev,
      sailingId: found.id,
      shipId: found.shipId,
      departureDate: found.departureDate,
      nights: String(found.nights),
      homeport: found.homeport,
      itinerary: found.itinerary,
    }))
  }

  function toggleCategory(cat) {
    setState(prev => ({
      ...prev,
      categories: { ...prev.categories, [cat]: !prev.categories[cat] },
    }))
  }

  function setPrice(cat, value) {
    setState(prev => ({
      ...prev,
      prices: { ...prev.prices, [cat]: value },
    }))
  }

  return (
    <div className="sailing-panel">
      <h2>{label}</h2>

      <div className="field-group">
        <label>Sailing</label>
        <select
          value={state.sailingId}
          onChange={e => selectSailing(e.target.value)}
          required
        >
          <option value="">— Select a sailing —</option>
          {Object.entries(sailingsByShip).map(([shipName, shipSailings]) => (
            <optgroup key={shipName} label={shipName}>
              {shipSailings.map(s => (
                <option key={s.id} value={s.id}>
                  {formatDate(s.departureDate)} &mdash; {s.itinerary}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {state.sailingId && (
        <div className="sailing-summary">
          <div className="summary-row">
            <span className="summary-label">Ship</span>
            <span>{ships.find(s => s.id === state.shipId)?.name ?? state.shipId}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Departure</span>
            <span>{formatDate(state.departureDate)}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Nights</span>
            <span>{state.nights}</span>
          </div>
          <div className="summary-row">
            <span className="summary-label">Homeport</span>
            <span>{state.homeport}</span>
          </div>
        </div>
      )}

      <div className="field-group">
        <label>Stateroom Categories &amp; Pricing</label>
        <div className="stateroom-list">
          {STATEROOM_CATEGORIES.map(cat => (
            <div key={cat} className="stateroom-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={state.categories[cat]}
                  onChange={() => toggleCategory(cat)}
                />
                {cat}
              </label>
              {state.categories[cat] && (
                <div className="price-field">
                  <span className="price-prefix">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Total — family of 4"
                    value={state.prices[cat]}
                    onChange={e => setPrice(cat, e.target.value)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [clientName, setClientName] = useState('')
  const [ships, setShips] = useState([])
  const [sailings, setSailings] = useState([])
  const [sailingA, setSailingA] = useState(emptySailing)
  const [sailingB, setSailingB] = useState(emptySailing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [comparisonHtml, setComparisonHtml] = useState(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/ships').then(r => r.json()),
      fetch('/api/sailings').then(r => r.json()),
    ])
      .then(([shipsData, sailingsData]) => {
        setShips(shipsData)
        setSailings(sailingsData)
      })
      .catch(() => setError('Failed to load data. Is the server running?'))
  }, [])

  function buildStateroomsPayload(sailing) {
    return STATEROOM_CATEGORIES
      .filter(cat => sailing.categories[cat])
      .map(cat => ({ category: cat, price: sailing.prices[cat] || null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setComparisonHtml(null)
    setLoading(true)

    try {
      const res = await fetch('/api/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          sailingA: {
            shipId: sailingA.shipId,
            departureDate: sailingA.departureDate,
            nights: Number(sailingA.nights),
            homeport: sailingA.homeport,
            staterooms: buildStateroomsPayload(sailingA),
          },
          sailingB: {
            shipId: sailingB.shipId,
            departureDate: sailingB.departureDate,
            nights: Number(sailingB.nights),
            homeport: sailingB.homeport,
            staterooms: buildStateroomsPayload(sailingB),
          },
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Server error ${res.status}`)
      }

      setComparisonHtml(await res.text())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function openInNewTab() {
    const blob = new Blob([comparisonHtml], { type: 'text/html' })
    window.open(URL.createObjectURL(blob), '_blank')
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>DCL Cruise Comparator</h1>
        <p>Build a side-by-side sailing comparison for your clients</p>
      </header>

      <main className="app-main">
        <form onSubmit={handleSubmit} className="compare-form">
          <div className="field-group client-name-row">
            <label htmlFor="clientName">Client Name</label>
            <input
              id="clientName"
              type="text"
              placeholder="e.g. Bancroft Family"
              value={clientName}
              onChange={e => setClientName(e.target.value)}
              required
            />
          </div>

          <div className="sailings-grid">
            <SailingPanel label="Sailing A" state={sailingA} setState={setSailingA} sailings={sailings} ships={ships} />
            <SailingPanel label="Sailing B" state={sailingB} setState={setSailingB} sailings={sailings} ships={ships} />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="form-actions">
            <button type="submit" className="btn-generate" disabled={loading}>
              {loading ? 'Generating…' : 'Generate Comparison'}
            </button>
          </div>
        </form>

        {comparisonHtml && (
          <div className="output-section">
            <div className="output-toolbar">
              <span className="output-label">Comparison Preview</span>
              <button type="button" className="btn-open" onClick={openInNewTab}>
                Open in New Tab ↗
              </button>
            </div>
            <iframe
              className="comparison-frame"
              srcDoc={comparisonHtml}
              title="Sailing Comparison Document"
            />
          </div>
        )}
      </main>
    </div>
  )
}
