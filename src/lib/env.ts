/**
 * Validates required environment variables at startup
 */
export function validateEnv() {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  ];

  const missingEnvVars = requiredEnvVars.filter(
    (envVar) => !import.meta.env[envVar]
  );

  if (missingEnvVars.length > 0) {
    const envFile = import.meta.env.VITE_SUPABASE_URL ? '.env.local' : '.env.example';
    throw new Error(
      `Missing required environment variables:\n${missingEnvVars
        .map((v) => `- ${v}`)
        .join(
          '\n'
        )}\n\nPlease set these variables in your ${envFile} file.`
    );
  }

  return true;
}

/**
 * Gets safe environment variables for use in the app
 */
export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL as string,
  supabasePublishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
};
