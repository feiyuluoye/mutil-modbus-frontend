import { http } from './http'

export const listServers = () => http.get('/db/servers')
export const getServer = (id: string) => http.get(`/db/servers/${id}`)
export const createServer = (payload: any) => http.post('/db/servers', payload)
export const updateServer = (id: string, payload: any) => http.put(`/db/servers/${id}`, payload)
export const deleteServer = (id: string) => http.delete(`/db/servers/${id}`)

export const listDevicesByServer = (sid: string) => http.get(`/db/servers/${sid}/devices`)
export const getDevice = (deviceId: string) => http.get(`/db/devices/${deviceId}`)
export const createDevice = (sid: string, payload: any) => http.post(`/db/servers/${sid}/devices`, payload)
export const updateDevice = (deviceId: string, payload: any) => http.put(`/db/devices/${deviceId}`, payload)
export const deleteDevice = (deviceId: string) => http.delete(`/db/devices/${deviceId}`)

export const listPointValues = (params: any) => http.get('/db/point_values', { params })
export const latestPoints = (params?: any) => http.get('/db/points/latest', { params })

// Aggregated statistics
export const getStats = () => http.get('/db/stats')
