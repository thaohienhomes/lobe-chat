export const diagramModule = {
  category: 'general',
  content: `## Diagram Module Guidelines

### When to Use
Flowcharts, sequence diagrams, state machines, entity relationships, mind maps, architecture diagrams.

### Preferred Libraries
- **Mermaid** for standard diagram types (flowchart, sequence, state, ER, gantt)
- **Custom SVG** for unique layouts requiring precise control

### Mermaid Template
\`\`\`html
<div id="mermaid-container"></div>
<script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
<script>
  mermaid.initialize({
    startOnLoad: false,
    theme: 'base',
    themeVariables: {
      primaryColor: 'var(--color-accent)',
      primaryTextColor: 'var(--color-text)',
      lineColor: 'var(--color-border)',
      secondaryColor: 'var(--color-surface)',
      tertiaryColor: 'var(--color-bg)'
    }
  });
  document.getElementById('mermaid-container').innerHTML =
    '<div class="mermaid">flowchart TD\\n  A[Start] --> B{Decision}\\n  B -->|Yes| C[Action 1]\\n  B -->|No| D[Action 2]</div>';
  mermaid.run();
</script>
\`\`\`

### Custom SVG Template
\`\`\`html
<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" style="width:100%;font-family:system-ui">
  <rect x="50" y="50" width="160" height="60" rx="8" fill="var(--color-surface)" stroke="var(--color-border)"/>
  <text x="130" y="85" text-anchor="middle" fill="var(--color-text)" font-size="14">Step 1</text>
  <line x1="210" y1="80" x2="280" y2="80" stroke="var(--color-border)" marker-end="url(#arrow)"/>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-border)"/></marker></defs>
</svg>
\`\`\`

### Best Practices
- Keep text readable: minimum 12px font size
- Use clear directional flow (top-to-bottom or left-to-right)
- Limit complexity: max 15-20 nodes per diagram
- Color-code different categories/paths
- Add labels to all connections/edges
- Use rounded rectangles for processes, diamonds for decisions

### Common Mistakes
- Mermaid syntax errors (wrong arrow types, missing quotes in labels with special chars)
- SVG viewBox not matching content dimensions
- Text color invisible against node fill
- Diagram too wide for container (use viewBox for responsive scaling)`,
  name: 'diagram',
};
