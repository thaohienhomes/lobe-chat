export const kaplanMeierModule = {
  category: 'medical',
  content: `## Kaplan-Meier Survival Curve Module

### When to Use
Survival analysis: time-to-event data, comparing survival between treatment groups, median survival.

### Template (D3.js or Plotly)
Use a step function plot with:
- X-axis: Time (months/years)
- Y-axis: Survival probability (0 to 1.0 or 0% to 100%)
- Step-down function for each event
- Censoring marks (+ or | ticks)
- At-risk table below the plot

### Best Practices
- Use step function (not smooth lines) — this is the standard
- Show censored observations as tick marks on the curve
- Include 95% confidence intervals (shaded bands)
- Add at-risk table below: number at risk at each time point per group
- Show median survival with dashed horizontal line at 0.5
- Include log-rank test p-value
- Color-code treatment groups consistently
- Y-axis starts at 0 (or at minimum 0, maximum 1.0)
- Label axes: "Time (months)" and "Survival Probability"
- Add legend identifying each group

### Common Mistakes
- Using smooth curves instead of step functions
- Missing censoring marks
- Y-axis not starting at 0 or not reaching 1.0
- No at-risk table (essential for clinical interpretation)
- Missing p-value from log-rank test
- Confidence intervals as lines instead of shaded bands`,
  name: 'kaplan-meier',
};
