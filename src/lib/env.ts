/**
 * Validates required environment variables at startup
 */
export function validateEnv() {
  // Add required env vars here
  // For now, no strict client-side env vars required since we use a local API
  return true;
}

/**
 * Gets safe environment variables for use in the app
 */
export const env = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
};
