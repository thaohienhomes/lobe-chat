'use client';

// ============================================================================
// OPENROUTER-ONLY ENFORCEMENT (per SPECS_BUSINESS.md)
// ============================================================================
// pho.chat uses OpenRouter as the ONLY provider.
// Adding custom providers is disabled to maintain centralized billing.
// This component returns null to hide the "Add New Provider" button.
// ============================================================================

const AddNewProvider = () => {
  // Hidden: Users should not add custom providers in OpenRouter-only mode
  return null;
};

export default AddNewProvider;
