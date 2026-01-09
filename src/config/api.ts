/**
 * API endpoints configuration
 * Centralized API endpoint definitions
 */

export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    register: '/auth/register',
    profile: '/auth/profile',
    users: '/auth/users',
  },

  // Servers
  servers: {
    list: '/servers',
    detail: (id: string) => `/servers/${id}`,
    state: (id: string) => `/servers/${id}/state`,
    start: (id: string) => `/servers/${id}/start`,
    stop: (id: string) => `/servers/${id}/stop`,
    restart: (id: string) => `/servers/${id}/restart`,
  },

  // Devices
  devices: {
    list: '/devices',
    detail: (id: string) => `/devices/${id}`,
    byServer: (serverId: string) => `/servers/${serverId}/devices`,
  },

  // Points
  points: {
    list: '/points',
    detail: (id: string) => `/points/${id}`,
    byDevice: (deviceId: string) => `/devices/${deviceId}/points`,
    values: '/point-values',
    latest: '/point-values/latest',
  },

  // Alarms
  alarms: {
    list: '/alarms',
    detail: (id: string) => `/alarms/${id}`,
    active: '/alarms/active',
    history: '/alarms/history',
    acknowledge: (id: string) => `/alarms/${id}/acknowledge`,
  },

  // Analysis
  analysis: {
    dashboard: '/analysis/dashboard',
    trends: '/analysis/trends',
    statistics: '/analysis/statistics',
  },

  // Import
  import: {
    upload: '/import/upload',
    status: '/import/status',
    history: '/import/history',
  },

  // Runtime
  runtime: {
    info: '/runtime/info',
    health: '/health',
    metrics: '/runtime/metrics',
  },

  // Database
  database: {
    tables: '/db/tables',
    query: '/db/query',
    export: '/db/export',
  },

  // Stream (SSE)
  stream: {
    points: '/stream/points',
    alarms: '/stream/alarms',
  },
} as const

// Helper function to build query string
export const buildQueryString = (params: Record<string, any>): string => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, String(value))
    }
  })
  const queryString = query.toString()
  return queryString ? `?${queryString}` : ''
}

// Helper function to build full URL with query params
export const buildUrl = (endpoint: string, params?: Record<string, any>): string => {
  if (!params) return endpoint
  return `${endpoint}${buildQueryString(params)}`
}
