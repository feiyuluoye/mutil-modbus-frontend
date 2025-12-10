import { http } from './http'

export const getRuntimeState = () => http.get('/runtime/state')
export const enableServer = (id: string) => http.post(`/servers/${id}/start`)
export const disableServer = (id: string) => http.post(`/servers/${id}/stop`)
export const getExecState = (id: string) => http.get(`/servers/${id}/state`)
export const getMockConfig = (id: string) => http.get(`/servers/${id}/mock-config`)
export const uploadMockCSV = (id: string, form: FormData) =>
  http.post(`/servers/${id}/mock-csv`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
