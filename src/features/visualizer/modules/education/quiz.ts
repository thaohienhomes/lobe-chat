export const quizModule = {
  category: 'education',
  content: `## Quiz Module

### When to Use
Interactive knowledge checks: multiple choice, true/false, matching, fill-in-the-blank.

### Template
\`\`\`html
<style>
  .quiz { font-family: system-ui; max-width: 600px; margin: 0 auto; }
  .question { margin: 16px 0; padding: 16px; border-radius: 10px; background: var(--color-surface); border: 1px solid var(--color-border); }
  .q-text { color: var(--color-text); font-weight: 600; margin-bottom: 12px; }
  .option {
    padding: 10px 14px; margin: 6px 0; border-radius: 8px; cursor: pointer;
    border: 1px solid var(--color-border); color: var(--color-text);
    transition: all 0.2s ease; display: flex; align-items: center; gap: 10px;
  }
  .option:hover { background: var(--color-surface); border-color: var(--color-accent); }
  .option.correct { background: rgba(22,163,74,0.15); border-color: #16a34a; }
  .option.incorrect { background: rgba(239,68,68,0.15); border-color: #ef4444; }
  .feedback { margin-top: 8px; font-size: 13px; padding: 8px 12px; border-radius: 6px; }
</style>
<div class="quiz" id="quiz"></div>
<script>
  var questions = [
    {
      text: 'Question text here?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct: 1, // index of correct answer
      explanation: 'Explanation of why B is correct.'
    }
  ];
  // Render with click handlers that show correct/incorrect + explanation
  // Use sendPrompt('I got Q1 wrong, explain more about...') for follow-up
</script>
\`\`\`

### Best Practices
- Immediate visual feedback (green=correct, red=incorrect)
- Show explanation after answer selection
- Use sendPrompt() for "explain this answer" follow-ups
- Shuffle options to prevent pattern recognition
- Show score summary at the end
- Disable re-clicking after answer (prevent gaming)
- Use emoji indicators: ✅ correct, ❌ incorrect`,
  name: 'quiz',
};
