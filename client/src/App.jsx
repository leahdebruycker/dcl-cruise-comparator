import { useState, useEffect } from 'react'
import './App.css'

const STATEROOM_CATEGORIES = ['Interior', 'Oceanview', 'Verandah']

function emptySailing() {
  return {
    shipId: '',
    departureDate: '',
    nights: '',
    homeport: '',
    categories: { Interior: false, Oceanview: false, Verandah: false },
    prices: { Interior: '', Oceanview: '', Verandah: '' },
  }
}

function SailingPanel({ label, state, setState, ships }) {
  function set(field, value) {
    setState(prev => ({ ...prev, [field]: value }))
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
        <label>Ship</label>
        <select value={state.shipId} onChange={e => set('shipId', e.target.value)} required>
          <option value="">— Select a ship —</option>
          {ships.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="field-group">
        <label>Departure Date</label>
        <input
          type="date"
          value={state.departureDate}
          onChange={e => set('departureDate', e.target.value)}
          required
        />
      </div>

      <div className="field-group">
        <label>Number of Nights</label>
        <input
          type="number"
          min="2"
          max="14"
          placeholder="e.g. 4"
          value={state.nights}
          onChange={e => set('nights', e.target.value)}
          required
        />
      </div>

      <div className="field-group">
        <label>Homeport</label>
        <input
          type="text"
          placeholder="e.g. Port Canaveral"
          value={state.homeport}
          onChange={e => set('homeport', e.target.value)}
          required
        />
      </div>

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
  const [sailingA, setSailingA] = useState(emptySailing)
  const [sailingB, setSailingB] = useState(emptySailing)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [comparisonHtml, setComparisonHtml] = useState(null)

  useEffect(() => {
    fetch('/api/ships')
      .then(r => r.json())
      .then(setShips)
      .catch(() => setError('Failed to load ship list. Is the server running?'))
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
            <SailingPanel label="Sailing A" state={sailingA} setState={setSailingA} ships={ships} />
            <SailingPanel label="Sailing B" state={sailingB} setState={setSailingB} ships={ships} />
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
