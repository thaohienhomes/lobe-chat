export const drugInteractionModule = {
  category: 'medical',
  content: `## Drug Interaction Diagram Module

### When to Use
Pharmacological interactions: drug-drug, drug-food, enzyme pathways (CYP450), mechanism diagrams.

### Template
Use a network/node diagram showing:
- Drug nodes (colored by class: analgesics, antibiotics, etc.)
- Interaction edges (color-coded by severity: red=major, orange=moderate, yellow=minor)
- CYP enzyme nodes (if showing metabolic pathway)

### Best Practices
- Color-code interaction severity: red (contraindicated/major), orange (moderate), yellow (minor)
- Show direction of effect (inhibits ↓, induces ↑, substrate →)
- Include enzyme pathway (CYP3A4, CYP2D6, etc.) when relevant
- Add legend explaining severity levels
- Keep to max 8-10 drugs per diagram
- Use tooltips or hover for detailed mechanism info
- Group drugs by therapeutic class

### Key Layout
- Central hub: primary drug of interest
- Spokes: interacting drugs
- Edge labels: mechanism (inhibits, induces, competes)
- Edge color: severity level`,
  name: 'drug-interaction',
};
