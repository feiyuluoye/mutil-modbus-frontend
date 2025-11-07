import { http } from './http'

export const getRuntimeState = () => http.get('/runtime/state')
export const enableServer = (id: string) => http.post(`/runtime/servers/${id}/enable`)
export const disableServer = (id: string) => http.post(`/runtime/servers/${id}/disable`)
export const getExecState = (id: string) => http.get(`/runtime/servers/${id}/exec_state`)
