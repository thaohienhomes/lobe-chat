export const prismaModule = {
  category: 'medical',
  content: `## PRISMA 2020 Flowchart Module

### When to Use
Systematic review reporting: article identification, screening, eligibility, and inclusion stages.

### Template (PRISMA 2020 Standard)
\`\`\`html
<style>
  .prisma { font-family: system-ui; max-width: 700px; margin: 0 auto; }
  .prisma-box {
    padding: 12px 16px; border-radius: 8px; text-align: center;
    border: 2px solid var(--color-border); background: var(--color-surface);
    color: var(--color-text); font-size: 13px; min-width: 180px;
  }
  .prisma-phase {
    writing-mode: vertical-rl; text-orientation: mixed; font-weight: 700;
    padding: 8px; background: var(--color-accent); color: var(--color-bg);
    border-radius: 8px; font-size: 12px;
  }
  .prisma-row { display: flex; align-items: center; justify-content: center; gap: 16px; margin: 8px 0; }
  .prisma-arrow { color: var(--color-border); font-size: 20px; text-align: center; }
  .prisma-excluded { background: transparent; border-style: dashed; opacity: 0.8; }
</style>
<div class="prisma">
  <div class="prisma-row">
    <span class="prisma-phase">Identification</span>
    <div>
      <div class="prisma-box">Records identified through database searching (n = X)</div>
      <div class="prisma-arrow">↓</div>
      <div class="prisma-box">Records after duplicates removed (n = X)</div>
    </div>
    <div class="prisma-box prisma-excluded">Duplicates removed (n = X)</div>
  </div>
  <div class="prisma-arrow">↓</div>
  <div class="prisma-row">
    <span class="prisma-phase">Screening</span>
    <div class="prisma-box">Records screened (n = X)</div>
    <div class="prisma-box prisma-excluded">Records excluded (n = X)</div>
  </div>
  <div class="prisma-arrow">↓</div>
  <div class="prisma-row">
    <span class="prisma-phase">Eligibility</span>
    <div class="prisma-box">Full-text articles assessed (n = X)</div>
    <div class="prisma-box prisma-excluded">Excluded with reasons (n = X)</div>
  </div>
  <div class="prisma-arrow">↓</div>
  <div class="prisma-row">
    <span class="prisma-phase">Included</span>
    <div class="prisma-box" style="border-color:var(--color-accent);border-width:3px">
      Studies included in synthesis (n = X)
    </div>
  </div>
</div>
\`\`\`

### Best Practices
- Follow PRISMA 2020 guidelines (4 phases: Identification, Screening, Eligibility, Included)
- Show exact counts at each stage
- Use dashed borders for excluded/removed items
- Highlight final inclusion box with accent color
- Include exclusion reasons when available
- Left-align phase labels vertically`,
  name: 'prisma',
};
