export const statsDashboardModule = {
  category: 'academic',
  content: `## Stats Dashboard Module

### When to Use
Statistical results presentation: regression results, descriptive statistics, correlation matrices, test results.

### Template
Multi-panel dashboard with cards:

\`\`\`html
<style>
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; font-family: system-ui; }
  .stat-card {
    padding: 16px; border-radius: 10px; background: var(--color-surface);
    border: 1px solid var(--color-border);
  }
  .stat-value { font-size: 28px; font-weight: 700; color: var(--color-accent); }
  .stat-label { font-size: 12px; color: var(--color-text-secondary); margin-top: 4px; }
  .stat-detail { font-size: 11px; color: var(--color-text-secondary); margin-top: 8px; }
</style>
<div class="stats-grid">
  <div class="stat-card">
    <div class="stat-value">0.847</div>
    <div class="stat-label">R² (Adjusted)</div>
    <div class="stat-detail">F(3, 196) = 362.4, p < .001</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">p < .001</div>
    <div class="stat-label">Overall Significance</div>
  </div>
</div>
\`\`\`

### Best Practices
- Use card layout for key metrics (R², p-value, n, effect size)
- Large numbers for primary metrics, small text for details
- Include confidence intervals where appropriate
- Color-code significance: green (p<.05), red (p≥.05)
- Show effect sizes alongside p-values (Cohen's d, η², etc.)
- For regression: show coefficient table + residual plot
- For correlations: use heatmap with color gradient
- Use proper statistical notation (italics for test stats)`,
  name: 'stats-dashboard',
};
