export const stepByStepModule = {
  category: 'education',
  content: `## Step-by-Step Module

### When to Use
Progressive disclosure of educational content: tutorials, problem solutions, proof walkthroughs, process explanations.

### Template
\`\`\`html
<style>
  .steps { font-family: system-ui; max-width: 600px; margin: 0 auto; }
  .step {
    padding: 16px; margin: 8px 0; border-radius: 10px;
    border: 1px solid var(--color-border); background: var(--color-surface);
    cursor: pointer; transition: all 0.3s ease;
  }
  .step.active { border-color: var(--color-accent); }
  .step-header { display: flex; align-items: center; gap: 10px; color: var(--color-text); }
  .step-num {
    width: 28px; height: 28px; border-radius: 50%; display: flex;
    align-items: center; justify-content: center; font-weight: 700; font-size: 13px;
    background: var(--color-border); color: var(--color-text);
  }
  .step.active .step-num { background: var(--color-accent); color: var(--color-bg); }
  .step-content { display: none; margin-top: 12px; color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; }
  .step.active .step-content { display: block; }
</style>
<div class="steps" id="steps"></div>
<script>
  var steps = [
    { title: 'Step 1: Understand', content: 'Explanation...' },
    { title: 'Step 2: Apply', content: 'Details...' },
    { title: 'Step 3: Verify', content: 'Check...' }
  ];
  var container = document.getElementById('steps');
  steps.forEach(function(s, i) {
    var div = document.createElement('div');
    div.className = 'step' + (i === 0 ? ' active' : '');
    div.innerHTML = '<div class="step-header"><span class="step-num">' + (i+1) +
      '</span><strong>' + s.title + '</strong></div><div class="step-content">' + s.content + '</div>';
    div.onclick = function() {
      document.querySelectorAll('.step').forEach(function(el) { el.classList.remove('active'); });
      div.classList.add('active');
    };
    container.appendChild(div);
  });
</script>
\`\`\`

### Best Practices
- First step open by default, rest collapsed
- Clear numbered indicators
- Progressive disclosure (click to reveal)
- Use sendPrompt() for "I need help with this step"
- Keep each step concise (2-3 sentences + formula/diagram)
- Add visual indicators for completed steps`,
  name: 'step-by-step',
};
