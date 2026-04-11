# DCL Cruise Comparator — Project Context

A tool for Disney Cruise Line travel agents to compare two sailings side-by-side, including ship features, itinerary ports, onboard experiences, and dining options.

## Architecture

```
dcl-cruise-comparator/
├── client/          # React 18 + Vite 5 frontend (port 5173)
│   └── src/
│       ├── main.jsx
│       └── App.jsx
├── server/          # Node 20+ / Express 4 API (port 3001)
│   ├── index.js
│   ├── routes/
│   │   └── compare.js   # POST /api/compare
│   └── data/
│       └── ships.json   # Static DCL ship reference data
└── package.json     # Root workspace with concurrently dev script
```

## Running Locally

```bash
# Install all dependencies
npm run install:all

# Start both client and server in watch mode
npm run dev
```

Client proxies `/api/*` to `http://localhost:3001` via `vite.config.js`.

## Key Files

| File | Purpose |
|---|---|
| `server/data/ships.json` | Static ship reference data — all DCL ships with dining, pools, kids clubs, shows, and activities |
| `server/routes/compare.js` | `POST /api/compare` — accepts `{ sailingA, sailingB }`, returns comparison; currently a stub |
| `client/src/App.jsx` | Root React component; comparison UI lives here |

## Ships Data (`ships.json`)

Covers six ships across three classes:

| Ship | Class | Launched |
|---|---|---|
| Disney Magic | Magic | 1998 |
| Disney Wonder | Magic | 1999 |
| Disney Dream | Dream | 2011 |
| Disney Fantasy | Dream | 2012 |
| Disney Wish | Triton | 2022 |
| Disney Treasure | Triton | 2024 |

Each ship record includes: `id`, `name`, `class`, `launched`, `gross_tonnage`, `length_ft`, `decks`, `staterooms`, `guest_capacity`, `crew`, `theme`, `signature_attraction`, `pool_deck`, `kids_clubs`, `stage_shows`, `rotational_dining`, `specialty_dining`, `bars_and_lounges`, `onboard_activities`.

## API Shape

### `POST /api/compare`

Request:
```json
{
  "sailingA": {
    "shipId": "wish",
    "itinerary": "Bahamas 3-Night",
    "nights": 3,
    "departureDate": "2025-06-14",
    "homeport": "Port Canaveral"
  },
  "sailingB": {
    "shipId": "dream",
    "itinerary": "Bahamas 4-Night",
    "nights": 4,
    "departureDate": "2025-06-11",
    "homeport": "Port Canaveral"
  }
}
```

Response (planned):
```json
{
  "sailingA": { "sailing": {}, "ship": {} },
  "sailingB": { "sailing": {}, "ship": {} },
  "highlights": []
}
```

### `GET /api/health`

Returns `{ "status": "ok" }` — useful for verifying the server is up.

## Development Conventions

- Both `client` and `server` use ES modules (`"type": "module"`).
- Server uses `node --watch` for hot reload; no nodemon dependency needed.
- Keep ships.json as the single source of truth for static ship data — do not duplicate it in the client.
- Travel-agent–facing language: prefer DCL terminology (e.g., "rotational dining", "Castaway Club", "homeport") over generic cruise industry terms.
