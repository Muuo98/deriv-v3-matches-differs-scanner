# Deriv Match & Differ AI Scanner

A professional dark-mode market intelligence dashboard for Deriv public volatility indices with live tick processing, digit analysis, hot/cold tracking, signal expiry, and optional Deriv OAuth account monitoring.

Features
- Direct WebSocket connection to live Deriv public market data
- Coverage of major Volatility Indices including 1-second indices
- Live last-digit analysis and match/differ scanning
- Digit frequency bars 0-9 with hot/cold detection
- Rolling probability and confidence scoring
- AI SCANNER control and next-digit estimate panel
- Market rankings and comparison cards
- 30-second signal expiry timer
- SVG tick history charts and recent tick table
- CSV export for analysis snapshots
- Optional Deriv OAuth for account monitoring only
- Android-friendly responsive layout
- No simulated market data and no automatic trading

Important
- This app does not guarantee predictions.
- It does not generate simulated ticks.
- It never auto-executes trades.
- It only visualizes and analyzes live public market data from Deriv.

Quick start
1. Install dependencies:
   npm install
2. Create a local environment file:
   cp .env.example .env
3. Start the app:
   npm run dev
4. Open:
   http://localhost:5173

Production build
- npm run build
- npm run start

Optional OAuth setup
- Register a Deriv OAuth app from your Deriv developer account.
- Set DERIV_APP_ID and DERIV_REDIRECT_URI in .env.
- The app will provide a secure Deriv login flow for optional account monitoring.

Backend endpoints
- GET /api/health
- GET /api/scan
- GET /api/oauth/authorize
- GET /api/oauth/callback

The scanner listens to live public symbols such as:
- R_100, R_75, R_50, R_25, R_10
- 1HZ100V, 1HZ75V, 1HZ50V, 1HZ25V, 1HZ10V
- Additional major volatility indices are included when available from the market feed

This project uses a real public WebSocket feed from Deriv and does not simulate ticks.
