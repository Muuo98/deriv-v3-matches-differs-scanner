import { useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';

const digitValues = Array.from({ length: 10 }, (_, index) => index);

const formatNumber = (value) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—';
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 4 });
};

const getSignalBadge = (signal) => {
  if (!signal) return 'Waiting';
  if (signal.confidence >= 70) return 'Strong';
  if (signal.confidence >= 50) return 'Moderate';
  return 'Watch';
};

const TickChart = ({ history }) => {
  if (!history || history.length === 0) {
    return <div className="chart-empty">No live ticks yet</div>;
  }

  const width = 700;
  const height = 220;
  const padding = 12;
  const maxValue = Math.max(...history, 1);
  const minValue = Math.min(...history, 0);
  const range = maxValue - minValue || 1;

  const points = history
    .map((tick, index) => {
      const x = padding + (index / Math.max(history.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - ((tick - minValue) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="tick-chart" preserveAspectRatio="none">
      <defs>
        <linearGradient id="chartGradient" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor="#44d7b6" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#5aa6ff" stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <polyline fill="none" stroke="url(#chartGradient)" strokeWidth="3" points={points} />
    </svg>
  );
};

const DigitBars = ({ probabilities }) => {
  const sorted = [...(probabilities || [])].sort((a, b) => b.probability - a.probability);
  const max = Math.max(...sorted.map((item) => item.probability), 0.01);

  return (
    <div className="digit-bars">
      {digitValues.map((digit) => {
        const item = sorted.find((entry) => entry.digit === digit) || { digit, probability: 0.0, count: 0 };
        const height = 24 + (item.probability / max) * 125;
        return (
          <div key={digit} className="digit-bar-item">
            <div className="digit-bar-value">{item.count}</div>
            <div className="digit-bar-track">
              <div className="digit-bar-fill" style={{ height: `${height}px` }} />
            </div>
            <div className="digit-bar-label">{digit}</div>
          </div>
        );
      })}
    </div>
  );
};

function App() {
  const [marketData, setMarketData] = useState([]);
  const [selectedSymbol, setSelectedSymbol] = useState('R_100');
  const [status, setStatus] = useState('Connecting');
  const [lastScanAt, setLastScanAt] = useState(Date.now());
  const [signalExpiry, setSignalExpiry] = useState(Date.now() + 30000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin, {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setStatus('Live feed');
      setIsLoading(false);
    });

    socket.on('disconnect', () => setStatus('Reconnecting'));

    socket.on('market-connection', (payload) => {
      if (payload?.status) setStatus(payload.status === 'live' ? 'Live feed' : payload.status);
    });

    socket.on('market-update', (payload) => {
      if (!payload?.symbolSnapshots) return;
      setMarketData(payload.symbolSnapshots);
      if (payload.selectedSymbol) setSelectedSymbol(payload.selectedSymbol);
      setLastScanAt(Date.now());
      setSignalExpiry(Date.now() + 30000);
    });

    return () => socket.disconnect();
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSignalExpiry((oldExpiry) => oldExpiry - 1000);
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const selectedSymbolData = useMemo(() => {
    if (!marketData.length) {
      return null;
    }

    return marketData.find((item) => item.symbol === selectedSymbol) || marketData[0];
  }, [marketData, selectedSymbol]);

  const topSymbol = marketData[0];
  const remainingSignalMs = Math.max(signalExpiry - Date.now(), 0);
  const signalRemainingSeconds = Math.ceil(remainingSignalMs / 1000);
  const signalExpired = signalRemainingSeconds <= 0;

  const triggerAiScan = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/scan');
      const payload = await response.json();
      if (payload && payload.symbolSnapshots?.length) {
        setMarketData(payload.symbolSnapshots);
        setSelectedSymbol(payload.selectedSymbol || selectedSymbol);
        setLastScanAt(Date.now());
        setSignalExpiry(Date.now() + 30000);
      }
    } catch (error) {
      console.error('AI scan failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCsvExport = () => {
    if (!selectedSymbolData) return;

    const rows = [
      ['symbol', 'last_price', 'last_digit', 'tick_count', 'match_count', 'differ_count', 'confidence', 'expected_next_digit', 'hot_digits', 'cold_digits'],
      [
        selectedSymbolData.symbol,
        selectedSymbolData.lastPrice,
        selectedSymbolData.lastDigit,
        selectedSymbolData.tickCount,
        selectedSymbolData.signal?.matches ?? 0,
        selectedSymbolData.signal?.differs ?? 0,
        selectedSymbolData.signal?.confidence ?? 0,
        selectedSymbolData.signal?.expectedNextDigit?.digit ?? '',
        (selectedSymbolData.signal?.hotDigits || []).map((item) => item.digit).join(' | '),
        (selectedSymbolData.signal?.coldDigits || []).map((item) => item.digit).join(' | ')
      ]
    ];

    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedSymbolData.symbol || 'deriv'}-scanner.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDerivLogin = async () => {
    try {
      const response = await fetch('/api/oauth/authorize');
      const payload = await response.json();
      if (payload.url) {
        window.open(payload.url, '_blank');
      }
    } catch (error) {
      console.error('OAuth login error:', error);
    }
  };

  if (!selectedSymbolData) {
    return <div className="loading-shell">Loading Deriv live market feed...</div>;
  }

  const selectedSignal = selectedSymbolData.signal || {
    matches: 0,
    differs: 0,
    confidence: 0,
    expectedNextDigit: { digit: 0, probability: 0 },
    probabilities: digitValues.map((digit) => ({ digit, probability: 0.1, count: 0 })),
    hotDigits: [],
    coldDigits: []
  };

  const rankingRows = [...marketData].sort((a, b) => (b.signal?.confidence || 0) - (a.signal?.confidence || 0));

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Deriv V3</p>
          <h1>Matches &amp; Differs AI Analysis Scanner</h1>
        </div>

        <div className="header-actions">
          <button className="secondary-button" onClick={handleDerivLogin}>
            Optional OAuth
          </button>
          <button className="primary-button" onClick={triggerAiScan} disabled={isLoading}>
            {isLoading ? 'Scanning…' : 'AI SCANNER'}
          </button>
          <button className="secondary-button" onClick={handleCsvExport}>
            CSV Export
          </button>
        </div>
      </header>

      <div className="top-bar">
        <div className="connection-badge">
          <span className={`dot ${status === 'Live feed' ? 'online' : 'offline'}`} />
          {status}
        </div>
        <div className="status-pill">Last scan: {new Date(lastScanAt).toLocaleTimeString()}</div>
        <div className={`signal-pill ${signalExpired ? 'expired' : 'active'}`}>
          Signal expiry: {signalExpired ? 'Expired' : `${signalRemainingSeconds}s`}
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-card accent">
          <span className="small-label">Selected market</span>
          <div className="summary-header">
            <h2>{selectedSymbolData.symbol}</h2>
            <span className="score-badge">{getSignalBadge(selectedSignal)}</span>
          </div>
          <div className="metric-row">
            <span className="metric-value">{formatNumber(selectedSymbolData.lastPrice)}</span>
            <span className="metric-unit">Last price</span>
          </div>
        </div>

        <div className="summary-card">
          <span className="small-label">Last digit</span>
          <div className="metric-value large">{selectedSymbolData.lastDigit ?? '—'}</div>
          <small>Current trailing digit</small>
        </div>

        <div className="summary-card">
          <span className="small-label">Matches / Differs</span>
          <div className="metric-row split">
            <div>
              <div className="metric-value small">{selectedSignal.matches}</div>
              <small>Matches</small>
            </div>
            <div>
              <div className="metric-value small">{selectedSignal.differs}</div>
              <small>Differs</small>
            </div>
          </div>
        </div>

        <div className="summary-card">
          <span className="small-label">Statistical confidence</span>
          <div className="metric-value large">{Math.round(selectedSignal.confidence || 0)}%</div>
          <small>Rolling probability model</small>
        </div>
      </div>

      <div className="scanner-row">
        <div className="market-selector panel">
          <div className="panel-title-row">
            <h3>Markets</h3>
          </div>
          <div className="symbol-grid">
            {marketData.map((market) => (
              <button
                key={market.symbol}
                className={`symbol-button ${market.symbol === selectedSymbol ? 'active' : ''}`}
                onClick={() => setSelectedSymbol(market.symbol)}
              >
                <span>{market.symbol}</span>
                <strong>{formatNumber(market.lastPrice)}</strong>
              </button>
            ))}
          </div>
        </div>

        <div className="signal-panel panel">
          <div className="panel-title-row">
            <h3>Next-digit estimate</h3>
          </div>
          <div className="next-digit-box">
            <span className="digit-pill">{selectedSignal.expectedNextDigit?.digit ?? '—'}</span>
            <div>
              <div className="metric-value small">{((selectedSignal.expectedNextDigit?.probability || 0) * 100).toFixed(2)}%</div>
              <small>Probable next digit</small>
            </div>
          </div>
          <div className="signal-row">
            <span>Hot digits</span>
            <strong>{(selectedSignal.hotDigits || []).map((item) => item.digit).join(', ') || '—'}</strong>
          </div>
          <div className="signal-row">
            <span>Cold digits</span>
            <strong>{(selectedSignal.coldDigits || []).map((item) => item.digit).join(', ') || '—'}</strong>
          </div>
          <div className="signal-row warning">
            <span>Risk note</span>
            <strong>No guaranteed prediction. Real data only.</strong>
          </div>
        </div>
      </div>

      <div className="content-grid">
        <div className="panel chart-panel">
          <div className="panel-title-row">
            <h3>Live tick history</h3>
            <span className="subtle">{selectedSymbolData.history.length} ticks</span>
          </div>
          <TickChart history={selectedSymbolData.history} />

          <div className="history-list">
            {selectedSymbolData.history.slice(-10).map((tick, index) => (
              <span key={`${tick}-${index}`} className="history-pill">
                {tick}
              </span>
            ))}
          </div>
        </div>

        <div className="panel digits-panel">
          <div className="panel-title-row">
            <h3>Digit frequencies</h3>
            <span className="subtle">0–9</span>
          </div>
          <DigitBars probabilities={selectedSignal.probabilities} />
        </div>
      </div>

      <div className="bottom-grid">
        <div className="panel rankings-panel">
          <div className="panel-title-row">
            <h3>Market comparison</h3>
            <span className="subtle">Ranked</span>
          </div>

          <div className="ranking-table">
            <div className="ranking-header">
              <span>Market</span>
              <span>Price</span>
              <span>Confidence</span>
            </div>

            {rankingRows.map((market, index) => (
              <div className="ranking-row" key={market.symbol}>
                <span>
                  #{index + 1} {market.symbol}
                </span>
                <span>{formatNumber(market.lastPrice)}</span>
                <span>{Math.round(market.signal?.confidence || 0)}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel stats-panel">
          <div className="panel-title-row">
            <h3>Scanner metrics</h3>
          </div>
          <div className="metric-stack">
            <div className="metric-box">
              <span>Match rate</span>
              <strong>{((selectedSignal.matchRate || 0) * 100).toFixed(1)}%</strong>
            </div>
            <div className="metric-box">
              <span>Differ rate</span>
              <strong>{((selectedSignal.differRate || 0) * 100).toFixed(1)}%</strong>
            </div>
            <div className="metric-box">
              <span>Volatility</span>
              <strong>{(selectedSignal.volatility || 0).toFixed(1)}%</strong>
            </div>
            <div className="metric-box">
              <span>Momentum</span>
              <strong>{(selectedSignal.momentum || 0).toFixed(1)}%</strong>
            </div>
          </div>
        </div>
      </div>

      {topSymbol && (
        <div className="footer-note">
          Top market: <strong>{topSymbol.symbol}</strong> · Confidence {Math.round(topSymbol.signal?.confidence || 0)}% · Signal expires in {signalExpired ? '0s' : `${signalRemainingSeconds}s`}
        </div>
      )}
    </div>
  );
}

export default App;
