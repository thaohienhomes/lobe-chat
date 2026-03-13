export const VisualizerApiNames = {
  showWidget: 'show_widget',
  visualizerReadMe: 'visualizer_read_me',
};

const MODULE_ENUM = [
  'chart',
  'diagram',
  'interactive',
  'mockup',
  'art',
  'prisma',
  'consort',
  'forest-plot',
  'drug-interaction',
  'kaplan-meier',
  'rob-assessment',
  'citation-network',
  'methodology-flow',
  'stats-dashboard',
  'step-by-step',
  'quiz',
  'math-plot',
];

export const VisualizerAPIs = [
  {
    description:
      'Render interactive HTML/SVG visualization inline in chat. Call visualizer_read_me first.',
    name: VisualizerApiNames.showWidget,
    parameters: {
      properties: {
        i_have_seen_read_me: {
          description: 'Confirm you have called visualizer_read_me in this conversation.',
          type: 'boolean',
        },
        loading_messages: {
          description: '1-4 loading messages shown while rendering, ~5 words each.',
          items: { type: 'string' },
          maxItems: 4,
          minItems: 1,
          type: 'array',
        },
        title: {
          description: 'Short snake_case identifier. Must be specific and disambiguating.',
          type: 'string',
        },
        widget_code: {
          description:
            'SVG or HTML code. No DOCTYPE/html/head/body. Use CSS variables for theming.',
          type: 'string',
        },
      },
      required: ['i_have_seen_read_me', 'title', 'loading_messages', 'widget_code'],
      type: 'object',
    },
  },
  {
    description: 'Load design guidelines. Call once before first show_widget. Silent — no UI.',
    name: VisualizerApiNames.visualizerReadMe,
    parameters: {
      properties: {
        modules: {
          description: 'Which guideline modules to load. Pick all that fit.',
          items: {
            enum: MODULE_ENUM,
            type: 'string',
          },
          type: 'array',
        },
      },
      required: ['modules'],
      type: 'object',
    },
  },
];
