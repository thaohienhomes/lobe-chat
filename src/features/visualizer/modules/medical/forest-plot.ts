export const forestPlotModule = {
  category: 'medical',
  content: `## Forest Plot Module

### When to Use
Meta-analysis results: effect sizes with confidence intervals across multiple studies, summary diamond.

### Template (D3.js or SVG)
\`\`\`html
<style>
  .forest-plot { font-family: system-ui; overflow-x: auto; }
  .study-label { font-size: 12px; fill: var(--color-text); }
  .ci-line { stroke: var(--color-text); stroke-width: 1.5; }
  .point-estimate { fill: var(--color-accent); }
  .null-line { stroke: var(--color-border); stroke-dasharray: 4,4; }
  .diamond { fill: var(--color-accent); opacity: 0.8; }
  .weight-text { font-size: 11px; fill: var(--color-text-secondary); }
</style>
<svg id="forest" viewBox="0 0 700 300" style="width:100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Build programmatically with D3 or manual SVG -->
</svg>
<script>
  // Data: [{study, or, ci_lower, ci_upper, weight}, ...]
  // Render: study labels left, CI lines center, weight% right
  // Vertical null line at OR=1 (or RR=1 / MD=0)
  // Diamond at bottom for pooled estimate
</script>
\`\`\`

### Best Practices
- Vertical null line at effect = 1 (for OR/RR) or 0 (for MD/SMD)
- Square size proportional to study weight
- Diamond for pooled summary estimate
- Show I² heterogeneity statistic
- Label axes: "Favours Treatment" / "Favours Control"
- Use log scale for ratio measures (OR, RR)
- Right column: effect estimate [95% CI], weight %
- Order studies chronologically or by effect size

### Common Mistakes
- Linear scale for odds ratios (should be log)
- Missing null line
- All squares same size (should reflect weight)
- No diamond for pooled estimate
- Missing heterogeneity stats (I², Q, p)`,
  name: 'forest-plot',
};
