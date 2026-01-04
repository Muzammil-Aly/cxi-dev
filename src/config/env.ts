/**
 * Environment configuration
 * Centralized access to environment variables with type safety
 */

export const env = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_BASE_URL || "",
    databricksPat: process.env.NEXT_PUBLIC_DATABRICKS_PAT || "",
    timeout: 30000, // 30 seconds
  },

  // App Configuration
  app: {
    name: "Kavtech CRM",
    version: "2.0",
    environment: process.env.NODE_ENV || "development",
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    enableDebugMode: process.env.NODE_ENV === "development",
  },
} as const;

/**
 * Validate required environment variables
 */
export function validateEnv(): void {
  const required = {
    NEXT_PUBLIC_BASE_URL: env.api.baseUrl,
    NEXT_PUBLIC_DATABRICKS_PAT: env.api.databricksPat,
  };

  const missing: string[] = [];

  Object.entries(required).forEach(([key, value]) => {
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

/**
 * Check if app is in development mode
 */
export function isDevelopment(): boolean {
  return env.app.environment === "development";
}

/**
 * Check if app is in production mode
 */
export function isProduction(): boolean {
  return env.app.environment === "production";
}
