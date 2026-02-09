'use client';

// ============================================================================
// CENTRALIZED BILLING ENFORCEMENT
// ============================================================================
// pho.chat uses a strictly managed list of providers.
// Adding custom providers is disabled to maintain centralized billing and Phở Points.
// This component returns null to hide the "Add New Provider" button.
// ============================================================================

const AddNewProvider = () => {
  // Hidden: Users should not add custom providers in OpenRouter-only mode
  return null;
};

export default AddNewProvider;
