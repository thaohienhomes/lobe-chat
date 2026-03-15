export const mathPlotModule = {
  category: 'education',
  content: `## Math Plot Module

### When to Use
Mathematical function plotting, geometric constructions, calculus illustrations, number theory visualizations.

### Preferred Libraries
- **Plotly.js** for interactive function plots
- **D3.js** for custom mathematical visualizations
- **KaTeX** (via CDN) for math notation rendering

### Template
\`\`\`html
<div id="mathPlot" style="width:100%;height:400px"></div>
<script src="https://cdn.jsdelivr.net/npm/plotly.js-dist-min"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<script>
  var x = [];
  var y = [];
  for (var i = -10; i <= 10; i += 0.1) {
    x.push(i);
    y.push(Math.sin(i));
  }
  Plotly.newPlot('mathPlot', [{
    x: x, y: y, type: 'scatter', mode: 'lines',
    line: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim(), width: 2 }
  }], {
    paper_bgcolor: 'transparent',
    plot_bgcolor: 'transparent',
    font: { color: getComputedStyle(document.documentElement).getPropertyValue('--color-text').trim() },
    xaxis: { gridcolor: 'var(--color-border)', zerolinecolor: 'var(--color-text-secondary)', title: 'x' },
    yaxis: { gridcolor: 'var(--color-border)', zerolinecolor: 'var(--color-text-secondary)', title: 'f(x)' },
    margin: { t: 40, r: 20, b: 50, l: 50 }
  }, { responsive: true });
</script>
\`\`\`

### Best Practices
- Use transparent backgrounds (works with any theme)
- Show grid lines and axis labels
- Include zero lines for reference
- Use KaTeX for equation rendering: katex.render("f(x) = x^2", element)
- For calculus: shade areas under curves, show tangent lines
- For geometry: use SVG with precise coordinates
- For statistics: show normal distributions, histograms with theoretical curves
- Interactive: let users adjust parameters (sliders) to see function changes

### Common Mistakes
- Not reading CSS vars at render time (colors stale)
- Plotly config_bgcolor not set to transparent
- Missing axis labels and units
- KaTeX CSS not loaded (math renders as plain text)
- Function domain too narrow or too wide`,
  name: 'math-plot',
};
