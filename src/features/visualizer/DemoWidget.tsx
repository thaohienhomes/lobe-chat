// TODO: REMOVE THIS DEMO — Visualizer Sprint 1 test
'use client';

import { useTheme } from 'antd-style';
import { memo, useMemo } from 'react';

import VisualizerRenderer from './VisualizerRenderer';
import type { ShellThemeVars } from './shellHTML';

const DEMO_WIDGET_CODE = `
<style>
  .dashboard { padding: 20px; font-family: system-ui, sans-serif; }
  .title { color: var(--color-text); font-size: 18px; font-weight: 600; margin-bottom: 16px; }
  .chart-wrap { background: var(--color-surface, #f8f9fa); border-radius: 12px; padding: 20px; }
</style>
<div class="dashboard">
  <div class="title">Pho.Chat Revenue Demo</div>
  <div class="chart-wrap"><canvas id="c"></canvas></div>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><` + `/script>
<script>
new Chart(document.getElementById('c'), {
  type: 'bar',
  data: {
    labels: ['Jan','Feb','Mar','Apr','May','Jun'],
    datasets: [{
      label: 'Revenue (USD)',
      data: [1200, 1900, 3000, 5200, 4800, 7100],
      backgroundColor: 'rgba(99, 102, 241, 0.8)',
      borderRadius: 8
    }]
  },
  options: {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: function(v) { return '$' + v; } } } }
  }
});
<` + `/script>
`.trim();

const DEMO_LOADING_MESSAGES = ['Brewing the chart...', 'Pouring data into bars'];

const DemoWidget = memo(() => {
  const token = useTheme();

  const theme: ShellThemeVars = useMemo(
    () => ({
      accent: token.colorPrimary,
      bg: token.colorBgContainer,
      border: token.colorBorder,
      surface: token.colorBgElevated,
      text: token.colorText,
      textSecondary: token.colorTextSecondary,
    }),
    [
      token.colorPrimary,
      token.colorBgContainer,
      token.colorBorder,
      token.colorBgElevated,
      token.colorText,
      token.colorTextSecondary,
    ],
  );

  return (
    <div style={{ maxWidth: 640, padding: '16px 20px', width: '100%' }}>
      <VisualizerRenderer
        isComplete
        isStreaming={false}
        loadingMessages={DEMO_LOADING_MESSAGES}
        theme={theme}
        title="revenue_demo"
        widgetCode={DEMO_WIDGET_CODE}
      />
    </div>
  );
});

DemoWidget.displayName = 'VisualizerDemoWidget';

export default DemoWidget;
