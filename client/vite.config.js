* {
  box-sizing: border-box;
}

:root {
  color-scheme: dark;
  --bg: #07111f;
  --bg-raised: #0f1d31;
  --panel: rgba(17, 31, 49, 0.92);
  --panel-soft: rgba(25, 41, 60, 0.9);
  --panel-border: rgba(124, 147, 180, 0.2);
  --text: #edf4ff;
  --muted: #9eb7d2;
  --green: #44d7b6;
  --blue: #59aafc;
  --orange: #ffb357;
  --red: #ff6a7d;
  --shadow: 0 18px 40px rgba(2, 6, 12, 0.45);
}

html, body, #root {
  margin: 0;
  min-height: 100%;
  background:
    radial-gradient(circle at top left, rgba(81, 170, 255, 0.16), transparent 26%),
    radial-gradient(circle at bottom right, rgba(30, 255, 200, 0.12), transparent 18%),
    var(--bg);
  color: var(--text);
  font-family: Inter, 'Segoe UI', sans-serif;
}

body {
  min-height: 100vh;
}

button {
  font: inherit;
}

.app-shell {
  max-width: 1440px;
  margin: 0 auto;
  padding: 20px 18px 42px;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 16px 6px 22px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--green);
  font-size: 11px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(1.9rem, 2vw + 0.8rem, 3rem);
  line-height: 1.16;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.primary-button,
.secondary-button,
.symbol-button {
  border: 1px solid var(--panel-border);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.primary-button,
.secondary-button {
  cursor: pointer;
  padding: 0.8rem 1.1rem;
  font-weight: 700;
}

.primary-button {
  background: linear-gradient(135deg, var(--blue), #4de5ff);
  color: #061018;
  box-shadow: var(--shadow);
}

.secondary-button {
  background: rgba(21, 38, 57, 0.8);
  color: var(--text);
}

.top-bar,
.summary-grid,
.scanner-row,
.content-grid,
.bottom-grid,
.summary-header,
.panel-title-row,
.metric-row,
.signal-row,
.ranking-header,
.ranking-row,
.history-list,
.next-digit-box {
  display: flex;
  align-items: center;
}

.top-bar {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
  flex-wrap: wrap;
}

.connection-badge,
.status-pill,
.signal-pill {
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--panel-border);
  border-radius: 999px;
  background: rgba(18, 29, 41, 0.78);
  color: var(--muted);
  font-size: 0.85rem;
}

.dot {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  margin-right: 8px;
}

.dot.online {
  background: var(--green);
  box-shadow: 0 0 10px rgba(68, 215, 182, 0.75);
}

.dot.offline {
  background: var(--red);
}

.signal-pill.active {
  background: rgba(68, 215, 182, 0.1);
  color: var(--green);
}

.signal-pill.expired {
  background: rgba(255, 106, 125, 0.1);
  color: var(--red);
}

.summary-grid {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  margin-bottom: 20px;
}

.summary-card,
.panel {
  background: rgba(14, 24, 38, 0.88);
  border: 1px solid var(--panel-border);
  border-radius: 18px;
  box-shadow: var(--shadow);
}

.summary-card {
  padding: 18px 18px 16px;
  min-height: 140px;
}

.summary-card.accent {
  background: linear-gradient(135deg, rgba(15, 29, 49, 0.92), rgba(17, 55, 66, 0.78));
}

.small-label {
  color: var(--muted);
  font-size: 11px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.summary-header,
.panel-title-row,
.metric-row,
.signal-row,
.ranking-header,
.ranking-row,
.next-digit-box {
  justify-content: space-between;
  gap: 10px;
}

.summary-header {
  margin-top: 12px;
  margin-bottom: 12px;
}

.summary-header h2,
.panel-title-row h3 {
  margin: 0;
}

.score-badge {
  background: rgba(80, 195, 160, 0.12);
  color: var(--green);
  border: 1px solid rgba(68, 215, 182, 0.3);
  border-radius: 999px;
  padding: 0.4rem 0.7rem;
  font-size: 0.72rem;
  white-space: nowrap;
}

.metric-value {
  font-size: clamp(1.5rem, 2vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.05em;
}

.metric-value.large {
  font-size: clamp(2rem, 2.6vw, 3rem);
}

.metric-value.small {
  font-size: 1.45rem;
}

.metric-unit,
small,
.subtle {
  color: var(--muted);
}

.metric-row.split {
  justify-content: flex-start;
  gap: 28px;
  margin-top: 10px;
}

.scanner-row,
.content-grid,
.bottom-grid {
  display: grid;
  gap: 16px;
  margin-bottom: 20px;
}

.scanner-row {
  grid-template-columns: 1.5fr 0.9fr;
}

.content-grid {
  grid-template-columns: 1.4fr 0.9fr;
}

.bottom-grid {
  grid-template-columns: 1.3fr 0.9fr;
}

.panel {
  padding: 18px;
}

.panel-title-row {
  margin-bottom: 16px;
}

.symbol-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.symbol-button {
  background: rgba(18, 30, 44, 0.85);
  color: var(--text);
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 12px 14px;
  cursor: pointer;
}

.symbol-button.active {
  border-color: rgba(89, 170, 252, 0.8);
  background: rgba(18, 44, 69, 0.9);
}

.symbol-button strong {
  font-size: 0.9rem;
  color: var(--green);
}

.signal-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.next-digit-box {
  padding: 16px;
  background: rgba(17, 24, 38, 0.8);
  border-radius: 14px;
  border: 1px solid var(--panel-border);
}

.digit-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(68, 215, 182, 0.18), rgba(89, 170, 252, 0.24));
  color: var(--green);
  border: 1px solid rgba(68, 215, 182, 0.25);
  font-size: 2rem;
  font-weight: 800;
}

.signal-row {
  padding: 0.8rem 0.2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.signal-row strong {
  font-size: 0.78rem;
  color: var(--muted);
  text-align: right;
}

.signal-row.warning strong {
  color: var(--orange);
}

.tick-chart {
  width: 100%;
  height: 220px;
  background: linear-gradient(180deg, rgba(12, 19, 29, 0.9), rgba(19, 31, 49, 0.7));
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.chart-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 180px;
  color: var(--muted);
}

.history-list {
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 14px;
}

.history-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 0.45rem 0.55rem;
  border-radius: 8px;
  background: rgba(32, 48, 68, 0.96);
  border: 1px solid rgba(120, 144, 168, 0.14);
  font-size: 0.72rem;
  color: var(--muted);
}

.digit-bars {
  display: grid;
  grid-template-columns: repeat(10, minmax(0, 1fr));
  align-items: end;
  gap: 8px;
  min-height: 220px;
  padding-top: 16px;
}

.digit-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-height: 185px;
}

.digit-bar-value {
  font-size: 0.68rem;
  color: var(--muted);
}

.digit-bar-track {
  width: 100%;
  height: 145px;
  border-radius: 10px 10px 6px 6px;
  background: linear-gradient(180deg, rgba(30, 43, 59, 0.65), rgba(16, 24, 37, 0.9));
  border: 1px solid rgba(255, 255, 255, 0.04);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}

.digit-bar-fill {
  width: 100%;
  background: linear-gradient(180deg, var(--blue), var(--green));
  border-radius: 8px 8px 0 0;
}

.digit-bar-label {
  font-size: 0.85rem;
  color: var(--muted);
}

.ranking-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-header,
.ranking-row {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1fr;
  gap: 10px;
  padding: 0.8rem 0.6rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.ranking-header {
  color: var(--muted);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.ranking-row {
  color: var(--text);
  font-size: 0.94rem;
}

.metric-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.metric-box {
  padding: 1rem;
  border-radius: 12px;
  background: rgba(17, 30, 44, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.04);
}

.metric-box span {
  display: block;
  color: var(--muted);
  font-size: 0.78rem;
  margin-bottom: 8px;
}

.metric-box strong {
  font-size: 1.3rem;
}

.footer-note {
  margin-top: 16px;
  padding: 0.9rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  color: var(--muted);
  background: rgba(8, 15, 23, 0.76);
}

.loading-shell {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  color: var(--text);
  font-size: 1.2rem;
}

@media (max-width: 960px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .scanner-row,
  .content-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }

  .app-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 680px) {
  .app-shell {
    padding: 12px 12px 32px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .header-actions,
  .top-bar {
    width: 100%;
  }

  .header-actions > * {
    flex: 1;
  }

  .symbol-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card,
  .panel {
    border-radius: 14px;
  }

  .digit-bars {
    gap: 5px;
  }

  .ranking-header,
  .ranking-row {
    grid-template-columns: 1.5fr 1fr 0.8fr;
    font-size: 0.75rem;
  }
}
