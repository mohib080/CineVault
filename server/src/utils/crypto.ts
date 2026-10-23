import crypto from 'crypto';

/**
 * Generates a URL-safe cryptographically secure random token
 * Used for UNLISTED sharing (e.g., share_token)
 */
export function generateShareToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}
