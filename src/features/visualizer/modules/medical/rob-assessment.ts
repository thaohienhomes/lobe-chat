export const robAssessmentModule = {
  category: 'medical',
  content: `## Risk of Bias Assessment Module

### When to Use
Quality assessment of included studies: RoB 2 (randomized), ROBINS-I (non-randomized), traffic light plots.

### Template
Traffic light table or summary bar chart:

### Traffic Light Template
\`\`\`html
<style>
  .rob-table { width: 100%; border-collapse: collapse; font-family: system-ui; font-size: 13px; }
  .rob-table th, .rob-table td { padding: 8px 12px; border: 1px solid var(--color-border); text-align: center; }
  .rob-table th { background: var(--color-surface); color: var(--color-text); font-weight: 600; }
  .rob-table td { color: var(--color-text); }
  .rob-low { color: #16a34a; } /* green */
  .rob-some { color: #f59e0b; } /* amber */
  .rob-high { color: #ef4444; } /* red */
  .rob-unclear { color: var(--color-text-secondary); }
</style>
<table class="rob-table">
  <tr>
    <th>Study</th><th>D1</th><th>D2</th><th>D3</th><th>D4</th><th>D5</th><th>Overall</th>
  </tr>
  <tr>
    <td style="text-align:left">Smith 2020</td>
    <td class="rob-low">⊕</td><td class="rob-low">⊕</td>
    <td class="rob-some">?</td><td class="rob-low">⊕</td>
    <td class="rob-low">⊕</td><td class="rob-some">?</td>
  </tr>
</table>
\`\`\`

### Best Practices
- Use standard symbols: ⊕ (low), ? (some concerns), ⊖ (high)
- Color-code: green (low), amber/yellow (some concerns), red (high)
- Include all RoB 2 domains: D1-D5 + Overall
- D1: Randomization, D2: Deviations, D3: Missing data, D4: Measurement, D5: Selection
- Show summary bar chart alongside traffic light table
- Add footnotes for domain-specific judgments`,
  name: 'rob-assessment',
};
