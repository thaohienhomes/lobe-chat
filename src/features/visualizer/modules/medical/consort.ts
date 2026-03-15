export const consortModule = {
  category: 'medical',
  content: `## CONSORT Trial Diagram Module

### When to Use
Reporting randomized controlled trials: enrollment, allocation, follow-up, and analysis.

### Template Structure
Use an SVG flowchart following CONSORT 2010 standard:
- **Enrollment**: Assessed for eligibility → Excluded (with reasons)
- **Allocation**: Randomized → Intervention group / Control group
- **Follow-up**: Lost to follow-up, discontinued (with reasons per arm)
- **Analysis**: Analysed, excluded from analysis (per arm)

### Best Practices
- Two-column layout for intervention vs control arms
- Show exact participant counts at each stage
- Use solid arrows for main flow, dashed for exclusions
- Color-code arms (e.g., blue for intervention, green for control)
- Include timepoints if multi-visit
- Follow CONSORT 2010 checklist item 13a

### Key Elements
- Enrollment box at top (single)
- Randomization diamond/box (single, centered)
- Two parallel columns below randomization
- Loss/discontinuation boxes branching right from each column
- Final analysis boxes at bottom of each column`,
  name: 'consort',
};
