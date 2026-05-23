// charts.js — Fonctions de création de graphiques Chart.js

// ── Config globale Chart.js ─────────────────────────────────────────────────

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

// ── Options de base ─────────────────────────────────────────────────────────

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
        borderColor: getGridColor(),
        borderWidth: 1,
        titleColor: '#e8edf5',
        bodyColor: '#8b9bb8',
        padding: 10,
        cornerRadius: 8,
        titleFont: { size: 12, weight: '600' },
        bodyFont: { size: 12 }
      }
    }
  };
  if (hasAxes) {
    opts.scales = {
      x: {
        grid: { color: grid, drawBorder: false },
        ticks: { color: ticks, font: { size: 11 }, maxRotation: 0 }
      },
      y: {
        grid: { color: grid, drawBorder: false },
        ticks: { color: ticks, font: { size: 11 } },
        beginAtZero: true
      }
    };
  }
  return opts;
}

// ── Merge récursif ──────────────────────────────────────────────────────────

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

// ── Couleur hex → rgba ──────────────────────────────────────────────────────

function rgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Graphique linéaire ──────────────────────────────────────────────────────

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
        tension:          0.35,
        borderWidth:      2.5,
        pointRadius:      4,
        pointHoverRadius: 6,
        pointBorderWidth: 2,
        pointBackgroundColor: ds.borderColor || '#3b82f6',
        fill:             ds.fill || false,
        ...ds
      }))
    },
    options
  });
}

// ── Graphique en barres ─────────────────────────────────────────────────────

function createBarChart(canvasId, labels, datasets, customOptions = {}) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;
  destroyChart(ctx);
  const options = deepMerge(baseOptions(), customOptions);
  return new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: datasets.map(ds => ({
        borderRadius: 4,
        borderSkipped: false,
        ...ds
      }))
    },
    options
  });
}

// ── Graphique donut ─────────────────────────────────────────────────────────

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
        borderColor: getGridColor(),
        borderWidth: 1,
        titleColor: '#e8edf5',
        bodyColor: '#8b9bb8',
        padding: 10,
        cornerRadius: 8,
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
    data: {
      labels,
      datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 8 }]
    },
    options
  });
}

// ── Graphique scatter ───────────────────────────────────────────────────────

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

// ── Détruire un graphique existant sur un canvas ────────────────────────────

function destroyChart(canvasOrId) {
  const canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
  if (!canvas) return;
  const existing = Chart.getChart(canvas);
  if (existing) existing.destroy();
}

// ── Mettre à jour les graphiques après changement de thème ─────────────────

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
