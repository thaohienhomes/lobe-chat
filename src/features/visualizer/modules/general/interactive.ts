export const interactiveModule = {
  category: 'general',
  content: `## Interactive Module Guidelines

### When to Use
Widgets requiring user input: comparison tools, calculators, config builders, decision trees, data explorers.

### Key Pattern: sendPrompt()
Use the parent bridge function to send user choices back to the AI:
\`\`\`js
sendPrompt("User selected option: " + selectedValue);
\`\`\`

### Template
\`\`\`html
<style>
  .interactive-container { font-family: system-ui; padding: 16px; }
  .btn-group { display: flex; gap: 8px; flex-wrap: wrap; margin: 12px 0; }
  .btn {
    padding: 8px 16px; border-radius: 8px; border: 1px solid var(--color-border);
    background: var(--color-surface); color: var(--color-text); cursor: pointer;
    transition: all 0.2s ease; font-size: 14px;
  }
  .btn:hover { background: var(--color-accent); color: var(--color-bg); }
  .btn.active { background: var(--color-accent); color: var(--color-bg); font-weight: 600; }
  .result { padding: 16px; border-radius: 8px; background: var(--color-surface); margin-top: 12px; }
</style>
<div class="interactive-container">
  <h3 style="color:var(--color-text)">Choose an option:</h3>
  <div class="btn-group" id="options"></div>
  <div class="result" id="result" style="display:none"></div>
</div>
<script>
  var options = ['Option A', 'Option B', 'Option C'];
  var container = document.getElementById('options');
  options.forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = opt;
    btn.onclick = function() {
      document.querySelectorAll('.btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      document.getElementById('result').style.display = 'block';
      document.getElementById('result').innerHTML = '<p style="color:var(--color-text)">You selected: <strong>' + opt + '</strong></p>';
      sendPrompt('User selected: ' + opt + '. Please provide more details.');
    };
    container.appendChild(btn);
  });
</script>
\`\`\`

### Best Practices
- Touch-friendly targets: minimum 44px height for buttons
- Visual feedback on hover/click (color transitions)
- Show selected state clearly (active class)
- Use sendPrompt() to create conversational drill-downs
- Keep interactions simple: 1-2 levels deep
- Always provide visual feedback for user actions

### Common Mistakes
- Buttons too small for touch (< 44px)
- No visual feedback on selection
- sendPrompt() called with unclear context for the AI
- Missing active/selected states for buttons
- Using var(--color-accent) for both text and background (invisible)`,
  name: 'interactive',
};
