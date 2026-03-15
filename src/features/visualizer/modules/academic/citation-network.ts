export const citationNetworkModule = {
  category: 'academic',
  content: `## Citation Network Module

### When to Use
Visualizing relationships between academic papers, authors, or research topics. Co-citation analysis, bibliometric mapping.

### Template
Use D3.js force-directed graph or custom SVG:
- Nodes = papers/authors (size proportional to citation count)
- Edges = citation relationships (directed arrows)
- Color = research cluster/topic area

### Best Practices
- Size nodes by citation count or impact factor
- Color-code by research cluster or publication year
- Use force-directed layout for natural clustering
- Show paper title on hover (tooltip)
- Limit to 20-30 nodes for readability
- Add interactive zoom and pan for larger networks
- Edge thickness proportional to co-citation frequency
- Include legend for color coding

### Common Mistakes
- Too many nodes without filtering (cluttered)
- All nodes same size (no visual hierarchy)
- Missing tooltips (nodes become meaningless dots)
- No legend for color coding`,
  name: 'citation-network',
};
