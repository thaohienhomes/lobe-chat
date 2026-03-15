export const mockupModule = {
  category: 'general',
  content: `## Mockup Module Guidelines

### When to Use
UI wireframes, app screen mockups, layout prototypes, design system previews, component showcases.

### Template
\`\`\`html
<style>
  .mockup-frame {
    max-width: 400px; margin: 0 auto; border-radius: 16px;
    border: 2px solid var(--color-border); overflow: hidden;
    background: var(--color-bg); font-family: system-ui;
  }
  .mockup-header {
    padding: 12px 16px; background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
    display: flex; align-items: center; gap: 8px;
  }
  .mockup-body { padding: 16px; }
  .mockup-input {
    width: 100%; padding: 10px 12px; border-radius: 8px;
    border: 1px solid var(--color-border); background: var(--color-surface);
    color: var(--color-text); font-size: 14px; box-sizing: border-box;
  }
  .mockup-btn {
    padding: 10px 20px; border-radius: 8px; border: none;
    background: var(--color-accent); color: var(--color-bg);
    font-weight: 600; cursor: pointer; width: 100%; margin-top: 12px;
  }
</style>
<div class="mockup-frame">
  <div class="mockup-header">
    <div style="width:12px;height:12px;border-radius:50%;background:#ff5f57"></div>
    <div style="width:12px;height:12px;border-radius:50%;background:#ffbd2e"></div>
    <div style="width:12px;height:12px;border-radius:50%;background:#28c840"></div>
    <span style="flex:1;text-align:center;color:var(--color-text-secondary);font-size:12px">App Title</span>
  </div>
  <div class="mockup-body">
    <h3 style="color:var(--color-text);margin:0 0 16px">Welcome</h3>
    <input class="mockup-input" placeholder="Enter your email" />
    <button class="mockup-btn">Sign Up</button>
  </div>
</div>
\`\`\`

### Best Practices
- Use device-like frames (rounded corners, traffic light dots)
- Keep proportions realistic (mobile: ~375px, tablet: ~768px)
- Use placeholder content that looks real
- Show visual hierarchy with font sizes and weights
- Gray out non-interactive areas

### Common Mistakes
- Making mockups too wide (should max at 400-500px)
- Missing proper spacing and padding
- Not using theme CSS variables (breaks in dark mode)`,
  name: 'mockup',
};
