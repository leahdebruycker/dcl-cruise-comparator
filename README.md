# DCL Cruise Comparator

A tool for Disney Cruise Line travel agents to quickly build personalized sailing comparison documents for clients.

## What it does

A travel agent enters a client name, an optional personal message, and selects two or three DCL sailings side-by-side with optional stateroom pricing. Clicking **Generate Comparison** produces a polished, print-ready HTML document that renders in an inline preview. From there the agent can open it in a new tab or copy the raw HTML to paste directly into Mailchimp.

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

The sailing catalog is filterable by month, duration (short 3–5 nights / long 7+ nights), and ship. Two-sailing comparisons use a side-by-side layout; adding a third sailing switches to a labeled row layout with columns for each option.

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
│       └── App.jsx  # Comparison form + iframe preview + Copy HTML
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

**`POST /api/compare`** — accepts two or three sailings and returns a complete HTML comparison document.

`clientMessage` and `sailingC` are optional. When `sailingC` is included the response uses a three-column labeled layout; otherwise a two-column side-by-side layout is returned.

```json
{
  "clientName": "Smith Family",
  "clientMessage": "Hi Sarah and Joe — here are the three sailings we discussed on our call. The Fantasy and Dream are sister ships so the main differences come down to the show lineup and which rotational dining restaurants you'll rotate through. Let me know what questions come up!",
  "sailingA": {
    "shipId": "fantasy",
    "departureDate": "2027-03-26",
    "nights": 5,
    "homeport": "Port Canaveral",
    "staterooms": [
      { "category": "Interior", "price": 7579 },
      { "category": "Verandah", "price": 8277 }
    ]
  },
  "sailingB": {
    "shipId": "wish",
    "departureDate": "2027-03-27",
    "nights": 5,
    "homeport": "Port Canaveral",
    "staterooms": [
      { "category": "Interior", "price": 7605 },
      { "category": "Verandah", "price": 8895 }
    ]
  },
  "sailingC": {
    "shipId": "dream",
    "departureDate": "2027-03-29",
    "nights": 4,
    "homeport": "Fort Lauderdale",
    "staterooms": [
      { "category": "Interior", "price": 5331 },
      { "category": "Verandah", "price": 5771 }
    ]
  }
}
```

**`GET /api/health`** — returns `{ "status": "ok" }`.
