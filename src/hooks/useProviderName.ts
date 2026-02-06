/**
 * Returns a generic label for provider name to hide internal infrastructure details
 * This prevents exposing provider names like "OpenAI", "Anthropic", "Vertex AI" in error messages
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const useProviderName = (_provider: string) => {
  // Hide provider names from users - return generic label
  return 'Dịch vụ AI';
};
