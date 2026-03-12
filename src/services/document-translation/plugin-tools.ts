/**
 * Document Translation Plugin — Tool Definitions
 *
 * These are the tool schemas that the AI model can call when a user
 * asks to translate a document. The tools trigger the extract→translate→apply
 * pipeline via the API routes.
 *
 * Usage: Registered as a built-in plugin (no separate manifest server needed).
 * The AI model generates a TranslatedDocument artifact with the results.
 */

// Inline tool type to avoid external dependency
interface ChatCompletionToolFunction {
  description: string;
  name: string;
  parameters: Record<string, any>;
}

interface ChatCompletionTool {
  function: ChatCompletionToolFunction;
  type: 'function';
}
export const PLUGIN_IDENTIFIER = '@pho/doc-translator';

export const documentTranslationTools: ChatCompletionTool[] = [
  {
    function: {
      description:
        'Extract translatable text from a Word document (.docx). The document should contain shapes, textboxes, diagrams, or regular text. Returns extracted text elements with their types and a jobId for subsequent translation.',
      name: 'extractDocumentText',
      parameters: {
        properties: {
          fileName: {
            description: 'Original filename of the document',
            type: 'string',
          },
          fileUrl: {
            description: 'URL or base64 data of the uploaded .docx file',
            type: 'string',
          },
        },
        required: ['fileUrl', 'fileName'],
        type: 'object',
      },
    },
    type: 'function',
  },
  {
    function: {
      description:
        'Translate extracted text elements from a document. Requires a jobId from extractDocumentText. Returns translations with confidence scores.',
      name: 'translateDocumentText',
      parameters: {
        properties: {
          glossary: {
            additionalProperties: { type: 'string' },
            description:
              'Optional glossary for domain-specific terms (key: original, value: translated)',
            type: 'object',
          },
          jobId: {
            description: 'Job ID from the extractDocumentText step',
            type: 'string',
          },
          targetLang: {
            description: 'Target language code or name (e.g., "vi", "en", "Vietnamese", "English")',
            type: 'string',
          },
        },
        required: ['jobId', 'targetLang'],
        type: 'object',
      },
    },
    type: 'function',
  },
  {
    function: {
      description:
        'Apply translations back to the document and generate the translated .docx file for download. Requires a jobId from translateDocumentText.',
      name: 'applyDocumentTranslation',
      parameters: {
        properties: {
          jobId: {
            description: 'Job ID from the previous steps',
            type: 'string',
          },
          translations: {
            description: 'Optional user-edited translations to override AI translations',
            items: {
              properties: {
                id: { type: 'string' },
                translated: { type: 'string' },
              },
              required: ['id', 'translated'],
              type: 'object',
            },
            type: 'array',
          },
        },
        required: ['jobId'],
        type: 'object',
      },
    },
    type: 'function',
  },
];

/**
 * System prompt instruction for the AI model to use these tools correctly.
 */
export const DOCUMENT_TRANSLATION_SYSTEM_PROMPT = `## Document Translation Tool

When the user uploads a .docx file and asks to translate it while preserving layout/diagrams:

1. Call \`extractDocumentText\` with the file to extract all text from shapes, textboxes, and paragraphs
2. Call \`translateDocumentText\` with the jobId and target language
3. Present results as a \`translated-document\` artifact showing the diff view
4. Call \`applyDocumentTranslation\` to generate the final .docx for download

IMPORTANT:
- Always detect the source language automatically
- For construction/engineering documents, maintain technical terminology
- Show the translation diff to the user before applying
- The output .docx will preserve 100% of the original layout, shapes, and formatting`;
