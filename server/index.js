import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = Number(process.env.PORT || 3001);
const DERIV_WS_URL = process.env.DERIV_WS_URL || 'wss://ws.deriv.com/websockets/v3';
const DERIV_OAUTH_URL = process.env.DERIV_OAUTH_URL || 'https://oauth.deriv.com/oauth2/authorize';
const DERIV_APP_ID = process.env.DERIV_APP_ID || 'your_deriv_oauth_client_id';
const DERIV_REDIRECT_URI = process.env.DERIV_REDIRECT_URI || 'http://localhost:3001/api/oauth/callback';

const trackedSymbols = [
  'R_100',
  'R_75',
  'R_50',
  'R_25',
  'R_10',
  '1HZ100V',
  '1HZ75V',
  '1HZ50V',
  '1HZ25V',
  '1HZ10V',
  'B_100',
  'B_75',
  'B_50',
  'B_25',
  'B_10'
];

const digitCounts = new Map();
const marketState = new Map();

const baseDigitStats = () => ({
  lastPrice: 0,
  lastDigit: null,
  history: [],
  matchCount: 0,
  differCount: 0,
  sequence: [],
  tickCount: 0,
  bestDigit: 0,
  momentum: 0,
  volatility: 0
});

for (const symbol of trackedSymbols) {
  marketState.set(symbol, baseDigitStats());
}

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const toNumber = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const getLastDigit = (value) => {
  const numeric = toNumber(value);
  if (numeric === null) return null;
  return Math.abs(Math.round(numeric)) % 10;
};

const getDigitFrequency = (history) => {
  const frequencies = Array.from({ length: 10 }, (_, digit) => ({
    digit,
    count: history.filter((item) => item === digit).length,
    rate: 0
  }));

  const total = history.length || 1;
  frequencies.forEach((item) => {
    item.rate = item.count / total;
  });

  return frequencies;
};

const computeSignal = (history) => {
  if (!history.length) {
    return {
      matches: 0,
      differs: 0,
      matchRate: 0,
      differRate: 0,
      hotDigits: [],
      coldDigits: [],
      probabilities: Array.from({ length: 10 }, (_, digit) => ({ digit, probability: 0.1 })),
      confidence: 0,
      expectedNextDigit: null,
      volatility: 0,
      momentum: 0,
      sequence: []
    };
  }

  const frequency = getDigitFrequency(history);
  const total = history.length;
  const meanCount = total / 10;
  const hotDigits = frequency.filter((item) => item.count > meanCount).sort((a, b) => b.count - a.count).slice(0, 3);
  const coldDigits = frequency.filter((item) => item.count < meanCount).sort((a, b) => a.count - b.count).slice(0, 3);

  let matches = 0;
  let differs = 0;

  for (let index = 1; index < history.length; index += 1) {
    if (history[index] === history[index - 1]) matches += 1;
    else differs += 1;
  }

  const probabilities = frequency.map((item) => {
    const posterior = (item.count + 1) / (total + 10);
    return {
      digit: item.digit,
      count: item.count,
      probability: posterior,
      frequency: item.rate
    };
  });

  const expectedNextDigit = [...probabilities].sort((a, b) => b.probability - a.probability)[0];
  const matchRate = total > 1 ? matches / (matches + differs) : 0;
  const differRate = total > 1 ? differs / (matches + differs) : 0;
  const entropy = probabilities.reduce((accumulator, item) => {
    if (item.frequency <= 0) return accumulator;
    return accumulator - (item.frequency * Math.log(item.frequency) / Math.log(10));
  }, 0);

  const confidence = clamp(((1 - (entropy / 3.32)) * 100) * (total / 200), 0, 100);
  const sequence = history.slice(-20);
  const volatility = history.length > 1 ? (new Set(history).size / 10) * 100 : 0;
  const momentum = sequence.length > 1 ? ((sequence.filter((digit, idx) => idx > 0 && digit === sequence[idx - 1]).length / (sequence.length - 1)) * 100) : 0;

  return {
    matches,
    differs,
    matchRate,
    differRate,
    hotDigits,
    coldDigits,
    probabilities,
    confidence,
    expectedNextDigit,
    volatility,
    momentum,
    sequence
  };
};

const getSnapshot = () => {
  const symbolSnapshots = [...marketState.entries()].map(([symbol, state]) => {
    const history = state.history.slice(-250);
    const signal = computeSignal(history);

    return {
      symbol,
      lastPrice: state.lastPrice,
      lastDigit: state.lastDigit,
      tickCount: state.tickCount,
      history,
      signal,
      signalExpiryMs: 30000
    };
  });

  symbolSnapshots.sort((a, b) => (b.signal?.confidence || 0) - (a.signal?.confidence || 0));

  return {
    generatedAt: Date.now(),
    symbolSnapshots,
    selectedSymbol: symbolSnapshots[0]?.symbol || trackedSymbols[0],
    disclaimer: 'No guaranteed predictions. Real market data only. Trade automation is disabled.'
  };
};

const pushMarketUpdate = () => {
  const snapshot = getSnapshot();
  io.emit('market-update', snapshot);
};

const updateSymbolState = (symbol, quote, epoch) => {
  const entry = marketState.get(symbol) || baseDigitStats();
  const lastDigit = getLastDigit(quote);
  const history = [...entry.history, lastDigit].slice(-250);
  let sequence = entry.sequence || [];
  sequence = [...sequence, lastDigit].slice(-40);

  const previousDigit = history.length > 1 ? history[history.length - 2] : null;
  let matchCount = entry.matchCount || 0;
  let differCount = entry.differCount || 0;

  if (previousDigit !== null) {
    if (lastDigit === previousDigit) matchCount += 1;
    else differCount += 1;
  }

  marketState.set(symbol, {
    ...entry,
    lastPrice: quote,
    lastDigit,
    history,
    sequence,
    matchCount,
    differCount,
    tickCount: (entry.tickCount || 0) + 1,
    lastEpoch: epoch || Date.now()
  });
};

const connectDerivPublicFeed = () => {
  const socket = new WebSocket(DERIV_WS_URL);

  socket.onopen = () => {
    console.log('Connected to Deriv public WebSocket.');
    for (const symbol of trackedSymbols) {
      socket.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
    }
    io.emit('market-connection', { status: 'live', server: 'Deriv public feed', symbols: trackedSymbols });
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data.toString());
      if (!payload || payload.msg_type !== 'tick') return;

      const tick = payload.tick || {};
      const symbol = tick.symbol || payload.echo_req?.ticks || payload.req?.ticks;
      if (!symbol) return;

      const quoteValue = toNumber(tick.quote ?? tick.ask ?? tick.bid ?? tick.price ?? tick.value);
      if (quoteValue === null) return;

      updateSymbolState(symbol, quoteValue, tick.epoch || Date.now());
      pushMarketUpdate();
      digitCounts.set(symbol, getDigitFrequency((marketState.get(symbol)?.history || []).slice(-200)));
    } catch (error) {
      console.error('Deriv WS parse error:', error);
    }
  };

  socket.onclose = () => {
    console.warn('Deriv WebSocket closed. Reconnecting in 5 seconds.');
    setTimeout(connectDerivPublicFeed, 5000);
  };

  socket.onerror = (error) => {
    console.error('Deriv WebSocket error:', error);
  };
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    source: 'Deriv public WebSocket',
    trackedSymbols,
    timestamp: Date.now(),
    disclaimer: 'No guarantees. No auto trade. Real market data only.'
  });
});

app.get('/api/scan', (_req, res) => {
  res.json(getSnapshot());
});

app.get('/api/oauth/authorize', (_req, res) => {
  if (!DERIV_APP_ID || DERIV_APP_ID === 'your_deriv_oauth_client_id') {
    return res.status(400).json({
      error: 'Deriv OAuth is not configured. Add DERIV_APP_ID to the environment file.'
    });
  }

  const params = new URLSearchParams({
    client_id: DERIV_APP_ID,
    redirect_uri: DERIV_REDIRECT_URI,
    response_type: 'code',
    scope: 'read',
    state: Date.now().toString()
  });

  res.json({
    url: `${DERIV_OAUTH_URL}?${params.toString()}`
  });
});

app.get('/api/oauth/callback', (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).json({ error: `OAuth rejected by Deriv: ${error}` });
  }

  if (!code) {
    return res.status(400).json({ error: 'No OAuth code returned from Deriv.' });
  }

  return res.json({
    success: true,
    message: 'Deriv OAuth callback received. Secure token exchange should be implemented in your app backend.',
    code,
    state,
    note: 'This app does not auto-trade. It only supports optional account monitoring with secure server-side token handling.'
  });
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(rootDir, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

io.on('connection', (socket) => {
  socket.emit('market-update', getSnapshot());
  socket.emit('market-connection', { status: 'live', source: 'Deriv public feed' });
});

httpServer.listen(PORT, () => {
  console.log(`Scanner server running on http://localhost:${PORT}`);
  console.log(`Public Deriv websocket: ${DERIV_WS_URL}`);
});

connectDerivPublicFeed();
