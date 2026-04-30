# DCL Cruise Comparator

A tool for Disney Cruise Line travel agents to quickly build personalized sailing comparison documents for clients.

## What it does

A travel agent selects two DCL sailings side-by-side, optionally enters stateroom pricing for each, and clicks **Generate Comparison**. The app produces a polished, print-ready HTML document that can be previewed inline, opened in a new tab, or sent directly to the client.

The comparison document covers:

- Sailing overview (departure date, nights, homeport)
- Stateroom pricing by category (Interior, Oceanview, Verandah)
- Ship highlights (class, year launched, guest capacity, signature attraction)
- Rotational dining venues
- Specialty dining venues
- Entertainment & stage shows
- Kids clubs
- Pool deck (pools, slides & attractions)
- Bars & lounges

The sailing catalog is filterable by month, duration (short 3–5 nights / long 7+ nights), and ship.

## Ships covered

| Ship | Class | Launched |
|---|---|---|
| Disney Magic | Magic | 1998 |
| Disney Wonder | Magic | 1999 |
| Disney Dream | Dream | 2011 |
| Disney Fantasy | Dream | 2012 |
| Disney Wish | Triton | 2022 |
| Disney Treasure | Triton | 2024 |

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite 5 |
| Backend | Node 20 + Express 4 |
| Data | Static JSON (`ships.json`, `sailings.json`) |

## Running locally

```bash
# Install dependencies for both client and server
npm run install:all

# Start both in watch mode (client :5173, server :3001)
npm run dev
```

The client proxies `/api/*` to `http://localhost:3001`.

## Project structure

```
dcl-cruise-comparator/
├── client/          # React + Vite frontend
│   └── src/
│       └── App.jsx  # Comparison form + iframe preview
├── server/          # Express API
│   ├── index.js
│   ├── routes/
│   │   └── compare.js   # POST /api/compare — builds HTML document
│   └── data/
│       ├── ships.json   # Ship reference data
│       └── sailings.json  # Sailing catalog
└── package.json     # Root workspace
```

## API

**`POST /api/compare`** — accepts two sailings and returns a complete HTML comparison document.

```json
{
  "clientName": "Smith Family",
  "sailingA": {
    "shipId": "wish",
    "departureDate": "2025-06-14",
    "nights": 3,
    "homeport": "Port Canaveral",
    "staterooms": [{ "category": "Verandah", "price": 5200 }]
  },
  "sailingB": {
    "shipId": "dream",
    "departureDate": "2025-06-11",
    "nights": 4,
    "homeport": "Port Canaveral",
    "staterooms": [{ "category": "Verandah", "price": 4800 }]
  }
}
```

**`GET /api/health`** — returns `{ "status": "ok" }`.
