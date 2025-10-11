import { http } from './http'

export const getRuntimeState = () => http.get('/runtime/state')
