// Disabled: pho.chat is deployed on Vercel, so this upstream version check
// against LobeChat GitHub releases is misleading to customers.
export const useNewVersion = () => {
  return false;
};
