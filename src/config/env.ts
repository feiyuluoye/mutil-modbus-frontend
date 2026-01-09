/**
 * Environment configuration
 * Supports both development and production environments
 */

interface EnvConfig {
  apiBaseUrl: string
  apiTimeout: number
  isDevelopment: boolean
  isProduction: boolean
}

// Get environment variables
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  // In Vite, environment variables are exposed via import.meta.env
  return (import.meta.env[key] as string) || defaultValue
}

// API Base URL configuration
const getApiBaseUrl = (): string => {
  // Priority: Environment variable > Default
  const envApiUrl = getEnvVar('VITE_API_BASE_URL')
  
  if (envApiUrl) {
    return envApiUrl
  }

  // Development: use relative path (proxied by Vite)
  // Production: use relative path (proxied by Nginx)
  return '/api/v1'
}

// Export environment configuration
export const env: EnvConfig = {
  apiBaseUrl: getApiBaseUrl(),
  apiTimeout: parseInt(getEnvVar('VITE_API_TIMEOUT', '15000'), 10),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
}

// Export helper function
export const getApiUrl = (path: string): string => {
  const baseUrl = env.apiBaseUrl
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}

// Log configuration in development
if (env.isDevelopment) {
  console.log('[ENV] Configuration:', {
    apiBaseUrl: env.apiBaseUrl,
    apiTimeout: env.apiTimeout,
    mode: import.meta.env.MODE,
  })
}
