# Camille Ayase Personal Brand Website

High-end personal brand website for a fintech market risk manager and global market analyst.

## Stack

- React
- Vite
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React

## Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Structure

```text
src/
  assets/
  components/
  data/
  styles/
api/
  market-radar.js
```

Content is centralized in `src/data/site.ts`. Main sections are split into modular React components under `src/components`.

## Market Radar Data Policy

`api/market-radar.js` is the production data proxy for the hero market radar.

- Frontend calls `VITE_MARKET_RADAR_API_URL`, usually `/api/market-radar`.
- API keys stay on the server. Never expose vendor keys in React code.
- Missing sources are marked as unavailable. The site does not fabricate market values.
- US risk appetite uses Alpha Vantage `GLOBAL_QUOTE` for `SPY` and `QQQ` when `ALPHA_VANTAGE_API_KEY` is configured.
- Taiwan foreign investor flow uses TWSE official OpenAPI `fund/T86`, which is an official post-market dataset.
- Hong Kong Stock Connect flow requires an HKEX-authorized or licensed vendor endpoint via `HKEX_STOCK_CONNECT_FLOW_URL`.

Required production environment variables are listed in `.env.example`.
