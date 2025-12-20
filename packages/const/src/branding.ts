// the code below can only be modified with commercial license
// if you want to use it in the commercial usage
// please contact us for more information: hello@pho.chat
import { BRANDING_CONFIG } from '@/config/customizations';

// Use centralized config as source of truth
export const LOBE_CHAT_CLOUD = `${BRANDING_CONFIG.appName} Cloud`;

export const BRANDING_NAME = BRANDING_CONFIG.appName;
export const BRANDING_LOGO_URL = BRANDING_CONFIG.logoUrl;

export const ORG_NAME = BRANDING_CONFIG.appName;

export const BRANDING_URL = {
  help: BRANDING_CONFIG.legalLinks.help,
  privacy: BRANDING_CONFIG.legalLinks.privacy,
  terms: BRANDING_CONFIG.legalLinks.terms,
};

export const SOCIAL_URL = {
  discord: BRANDING_CONFIG.socialLinks.discord,
  github: BRANDING_CONFIG.socialLinks.github,
  medium: undefined, // Not in customizations
  x: BRANDING_CONFIG.socialLinks.twitter,
  youtube: undefined, // Not in customizations
};

export const BRANDING_EMAIL = {
  business: BRANDING_CONFIG.businessEmail,
  support: BRANDING_CONFIG.supportEmail,
};
