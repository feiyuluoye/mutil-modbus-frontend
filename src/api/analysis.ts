import { http } from './http'

export const getKpis = (params?: any) => http.get('/analysis/kpis', { params })
export const getStatusDistribution = (params?: any) => http.get('/analysis/status-distribution', { params })
export const getKeyComparison = (params?: any) => http.get('/analysis/key-comparison', { params })
