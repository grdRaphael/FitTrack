// charts.js — Graphiques style Apple Health

Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#8b9bb8';

function getGridColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#1e2d47';
}
function getTickColor() {
  return getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#4d5c7a';
}
function getTooltipBg() {
  return getComputedStyle(document.documentElement).getPropertyValue('--bg-card').trim() || '#141c2e';
}

function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function deepMerge(target, source) {
  const result = Object.assign({}, target);
  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ── Plugin : highlight de la barre survolée (single-dataset) ─────────────────

Chart.register({
  id: 'ahHighlight',
  beforeUpdate(chart) {
    if (chart.config.type !== 'bar' || chart.data.datasets.length !== 1) return;
    const ds = chart.data.datasets[0];
    if (ds._baseColor) return;
    const raw = ds.backgroundColor;
    ds._baseColor = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw[0] : '#8b5cf6');
    const n = chart.data.labels.length;
    ds.backgroundColor = Array.from({ length: n }, () => rgba(ds._baseColor, 0.62));
  },
  afterEvent(chart, args) {
    if (chart.config.type !== 'bar' || chart.data.datasets.length !== 1) return;
    const e = args.event;
    if (e.type !== 'mousemove' && e.type !== 'mouseout') return;
    let idx = null;
    if (e.type === 'mousemove') {
      const els = chart.getElementsAtEventForMode(e.native, 'index', { intersect: false }, true);
      if (els.length) idx = els[0].index;
    }
    if (chart._ahIdx === idx) return;
    chart._ahIdx = idx;
    const ds = chart.data.datasets[0];
    const c  = ds._baseColor;
    if (!c) return;
    const n = chart.data.labels.length;
    ds.backgroundColor = Array.from({ length: n }, (_, i) =>
      idx == null ? rgba(c, 0.62) : i === idx ? rgba(c, 0.9) : rgba(c, 0.22)
    );
    chart.update('none');
  }
});

// ── Tooltip externe style Apple Health ────────────────────────────────────────

function _ahTooltip(label) {
  return function({ chart, tooltip }) {
    const wrap = chart.canvas.parentNode;
    if (getComputedStyle(wrap).position === 'static') wrap.style.position = 'relative';

    let el = wrap.querySelector('.ah-tt');
    if (!el) {
      el = document.createElement('div');
      el.className = 'ah-tt';
      wrap.appendChild(el);
    }

    if (!tooltip.opacity || !tooltip.dataPoints?.length) {
      el.style.opacity = '0';
      return;
    }

    const dp = tooltip.dataPoints[0];
    const ttLabel = label || dp.dataset.label || 'TOTAL';
    el.innerHTML = `
      <div class="ah-tt-label">${ttLabel.toUpperCase()}</div>
      <div class="ah-tt-value">${dp.formattedValue}</div>
      <div class="ah-tt-date">${dp.label}</div>
    `;

    requestAnimationFrame(() => {
      const elW  = el.offsetWidth  || 110;
      const elH  = el.offsetHeight || 76;
      const cX   = tooltip.caretX;
      const cY   = tooltip.caretY;
      const maxR = chart.chartArea?.right ?? chart.width;

      let left = cX - elW / 2;
      if (left < 2) left = 2;
      if (left + elW > maxR) left = maxR - elW - 2;

      el.style.left    = left + 'px';
      el.style.top     = Math.max(2, cY - elH - 12) + 'px';
      el.style.opacity = '1';
    });
  };
}

// ── Options de base ───────────────────────────────────────────────────────────

function baseOptions(hasAxes = true) {
  const grid  = getGridColor();
  const ticks = getTickColor();
  const opts = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        labels: { color: '#8b9bb8', font: { size: 12, weight: '500' }, boxWidth: 12, padding: 16 }
      },
      tooltip: {
        backgroundColor: getTooltipBg(),
        borderColor:     grid,
        borderWidth:     1,
        titleColor:      '#e8edf5',
        bodyColor:       '#8b9bb8',
        padding:         10,
        cornerRadius:    8,
        titleFont:       { size: 12, weight: '600' },
        bodyFont:        { size: 12 }
      }
    }
  };
  if (hasAxes) {
    opts.scales = {
      x: {
        grid:   { display: false },
        ticks:  { color: ticks, font: { size: 11 }, maxRotation: 0 },
        border: { display: false }
      },
      y: {
        grid:   { color: grid, borderDash: [3, 3], drawBorder: false, drawTicks: false },
        ticks:  { color: ticks, font: { size: 11 }, maxTicksLimit: 5 },
        border: { display: false },
        beginAtZero: true
      }
    };
  }
  return opts;
}

// ── Graphique en barres — style Apple Health ──────────────────────────────────

function createBarChart(canvasId, labels, datasets, customOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  destroyChart(ctx);

  const isSingle     = datasets.length === 1;
  const tooltipLabel = customOptions._tooltipLabel || null;
  if ('_tooltipLabel' in customOptions) delete customOptions._tooltipLabel;

  const prepared = datasets.map(ds => {
    const raw  = ds.backgroundColor || ds.borderColor || '#8b5cf6';
    const base = typeof raw === 'string' ? raw : (Array.isArray(raw) ? raw[0] : '#8b5cf6');
    return {
      borderRadius:  { topLeft: 7, topRight: 7 },
      borderSkipped: false,
      borderWidth:   0,
      backgroundColor: base,
      ...ds
    };
  });

  const opts = deepMerge({
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: !isSingle },
      tooltip: isSingle ? {
        enabled:  false,
        external: _ahTooltip(tooltipLabel)
      } : {
        backgroundColor: getTooltipBg(),
        borderColor:     getGridColor(),
        borderWidth:     1,
        titleColor:      '#e8edf5',
        bodyColor:       '#8b9bb8',
        padding:         10,
        cornerRadius:    8
      }
    },
    scales: {
      x: {
        grid:   { display: false },
        ticks:  { color: getTickColor(), font: { size: 11 }, maxRotation: 0 },
        border: { display: false }
      },
      y: {
        grid:   { color: getGridColor(), borderDash: [3, 3], drawBorder: false, drawTicks: false },
        ticks:  { color: getTickColor(), font: { size: 11 }, maxTicksLimit: 5 },
        border: { display: false },
        beginAtZero: true
      }
    }
  }, customOptions);

  return new Chart(ctx, { type: 'bar', data: { labels, datasets: prepared }, options: opts });
}

// ── Graphique linéaire ────────────────────────────────────────────────────────

function createLineChart(canvasId, labels, datasets, customOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  destroyChart(ctx);
  const options = deepMerge(baseOptions(), customOptions);
  return new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: datasets.map(ds => ({
        tension:              0.4,
        borderWidth:          2,
        pointRadius:          3,
        pointHoverRadius:     5,
        pointBorderWidth:     0,
        pointBackgroundColor: ds.borderColor || '#3b82f6',
        fill:                 ds.fill || false,
        ...ds
      }))
    },
    options
  });
}

// ── Graphique donut ───────────────────────────────────────────────────────────

function createDoughnutChart(canvasId, labels, data, colors, customOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  destroyChart(ctx);
  const options = deepMerge({
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#8b9bb8', font: { size: 12 }, boxWidth: 12, padding: 12 }
      },
      tooltip: {
        backgroundColor: getTooltipBg(),
        borderColor:     getGridColor(),
        borderWidth:     1,
        titleColor:      '#e8edf5',
        bodyColor:       '#8b9bb8',
        padding:         10,
        cornerRadius:    8,
        callbacks: {
          label(ctx) {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct   = Math.round((ctx.raw / total) * 100);
            return ` ${ctx.label} : ${ctx.raw.toLocaleString()} kg (${pct}%)`;
          }
        }
      }
    }
  }, customOptions);
  return new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }] },
    options
  });
}

// ── Graphique scatter ─────────────────────────────────────────────────────────

function createScatterChart(canvasId, datasets, xLabel, yLabel, customOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  destroyChart(ctx);
  const options = deepMerge(deepMerge(baseOptions(), {
    plugins: {
      tooltip: {
        callbacks: {
          label(ctx) { return ` ${xLabel}: ${ctx.raw.x} — ${yLabel}: ${ctx.raw.y}`; }
        }
      }
    },
    scales: {
      x: { title: { display: true, text: xLabel, color: '#8b9bb8', font: { size: 11 } } },
      y: { title: { display: true, text: yLabel, color: '#8b9bb8', font: { size: 11 } } }
    }
  }), customOptions);
  return new Chart(ctx, { type: 'scatter', data: { datasets }, options });
}

// ── Détruire un graphique existant ────────────────────────────────────────────

function destroyChart(canvasOrId) {
  const canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
}

// ── Mettre à jour les graphiques après changement de thème ───────────────────

function refreshAllCharts() {
  Chart.instances && Object.values(Chart.instances).forEach(chart => {
    if (!chart.options.scales) return;
    const grid  = getGridColor();
    const ticks = getTickColor();
    if (chart.options.scales.x) {
      chart.options.scales.x.grid.color  = grid;
      chart.options.scales.x.ticks.color = ticks;
    }
    if (chart.options.scales.y) {
      chart.options.scales.y.grid.color  = grid;
      chart.options.scales.y.ticks.color = ticks;
    }
    chart.update('none');
  });
}
