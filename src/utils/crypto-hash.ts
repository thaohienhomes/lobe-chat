'use client';

/**
 * SHA-256 hashing utility for PII data
 * Used for TikTok Pixel user identification to comply with privacy requirements
 */

/**
 * Generate SHA-256 hash of a string (client-side)
 * @param input - The string to hash
 * @returns Promise<string> - The SHA-256 hash in hexadecimal format
 */
export const sha256Hash = async (input: string): Promise<string> => {
  if (typeof window === 'undefined') {
    throw new Error('sha256Hash can only be used in browser environment');
  }

  if (!input || typeof input !== 'string') {
    throw new Error('Input must be a non-empty string');
  }

  try {
    // Encode the input string as UTF-8
    const encoder = new TextEncoder();
    const data = encoder.encode(input.trim().toLowerCase());

    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);

    // Convert hash to hexadecimal string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return hashHex;
  } catch (error) {
    console.error('Failed to generate SHA-256 hash:', error);
    throw new Error('Hash generation failed');
  }
};

/**
 * Hash email address for TikTok Pixel identification
 * @param email - Email address to hash
 * @returns Promise<string> - SHA-256 hashed email
 */
export const hashEmail = async (email: string): Promise<string> => {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email address');
  }

  return sha256Hash(email);
};

/**
 * Hash phone number for TikTok Pixel identification
 * Normalizes phone number format before hashing
 * @param phone - Phone number to hash
 * @returns Promise<string> - SHA-256 hashed phone number
 */
export const hashPhoneNumber = async (phone: string): Promise<string> => {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Normalize phone number: remove all non-digit characters
  const normalizedPhone = phone.replace(/\D/g, '');
  
  if (normalizedPhone.length < 10) {
    throw new Error('Phone number must be at least 10 digits');
  }

  return sha256Hash(normalizedPhone);
};

/**
 * Hash external ID (user ID) for TikTok Pixel identification
 * @param externalId - External ID to hash
 * @returns Promise<string> - SHA-256 hashed external ID
 */
export const hashExternalId = async (externalId: string): Promise<string> => {
  if (!externalId) {
    throw new Error('External ID is required');
  }

  return sha256Hash(externalId);
};

/**
 * Safely hash user PII data for TikTok Pixel identification
 * Returns only successfully hashed values, skips invalid ones
 * @param userData - User data to hash
 * @returns Promise<object> - Object with hashed PII data
 */
export const hashUserPII = async (userData: {
  email?: string;
  phone?: string;
  userId?: string;
}): Promise<{
  email?: string;
  phone_number?: string;
  external_id?: string;
}> => {
  const hashedData: {
    email?: string;
    phone_number?: string;
    external_id?: string;
  } = {};

  try {
    if (userData.email) {
      hashedData.email = await hashEmail(userData.email);
    }
  } catch (error) {
    console.warn('Failed to hash email:', error);
  }

  try {
    if (userData.phone) {
      hashedData.phone_number = await hashPhoneNumber(userData.phone);
    }
  } catch (error) {
    console.warn('Failed to hash phone number:', error);
  }

  try {
    if (userData.userId) {
      hashedData.external_id = await hashExternalId(userData.userId);
    }
  } catch (error) {
    console.warn('Failed to hash external ID:', error);
  }

  return hashedData;
};

/**
 * Test if crypto.subtle is available (for debugging)
 * @returns boolean - True if Web Crypto API is available
 */
export const isCryptoAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof window.crypto !== 'undefined' && 
         typeof window.crypto.subtle !== 'undefined';
};
