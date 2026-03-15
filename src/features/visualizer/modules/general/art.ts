export const artModule = {
  category: 'general',
  content: `## Art / Creative Module Guidelines

### When to Use
Generative art, data art, creative visualizations, animated backgrounds, particle systems, 3D scenes.

### Preferred Libraries
- **Three.js** for 3D scenes
- **D3.js** for data-driven art
- **Canvas API** for 2D generative art
- **CSS animations** for simple motion effects

### Canvas Generative Art Template
\`\`\`html
<canvas id="artCanvas" style="width:100%;border-radius:8px"></canvas>
<script>
var canvas = document.getElementById('artCanvas');
var ctx = canvas.getContext('2d');
canvas.width = canvas.offsetWidth;
canvas.height = 400;

function draw() {
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim() || '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (var i = 0; i < 50; i++) {
    ctx.beginPath();
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height,
            Math.random() * 30 + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'hsla(' + (Math.random() * 360) + ', 70%, 60%, 0.6)';
    ctx.fill();
  }
}
draw();
</script>
\`\`\`

### Best Practices
- Use requestAnimationFrame for smooth animations (but be mindful of performance)
- Keep animations subtle — avoid seizure-inducing flashing
- Ensure art respects theme (use CSS variables for background)
- Set explicit canvas dimensions (width/height attributes, not just CSS)
- Use HSL colors for harmonious palettes

### Common Mistakes
- Canvas width/height not set (defaults to 300x150)
- Infinite animations without cleanup (memory leak)
- Ignoring theme colors (art looks wrong in opposite mode)
- Too many particles/elements causing frame drops`,
  name: 'art',
};
