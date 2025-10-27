import { http } from './http'

export type AlarmSeverity = 'info' | 'warning' | 'critical' | 'emergency'
export type TriggerType = 'threshold' | 'state' | 'offline'

export interface AlarmRuleTarget {
  server_id: string
  device_id: string
  name: string
  hash_id: string
}

export interface AlarmTriggerDelay { enabled: boolean; value: number; unit: 'sec' | 'min' }
export interface OfflineDuration { value: number; unit: 'sec' | 'min' | 'hour' }

export interface AlarmTrigger {
  type: TriggerType
  operator?: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'between' | 'outside'
  value1?: number
  value2?: number
  offline_duration?: OfflineDuration
  delay?: AlarmTriggerDelay
}

export interface AlarmRule {
  id?: string
  name: string
  description?: string
  enabled: boolean
  target: AlarmRuleTarget
  trigger: AlarmTrigger
  severity: AlarmSeverity
  message_template: string
  last_triggered_at?: string
}

export interface Paged<T> {
  rows: T[]
  total: number
  page: number
  size: number
  total_pages: number
}

export async function listAlarms(params: { query?: string; severity?: AlarmSeverity; enabled?: boolean; page?: number; size?: number }) {
  const { data } = await http.get<Paged<AlarmRule>>('/alarms', { params })
  return data
}

export async function createAlarm(rule: AlarmRule) {
  const { data } = await http.post<{ ok: boolean; id: string }>('/alarms', rule)
  return data
}

export async function updateAlarm(id: string, rule: Partial<AlarmRule>) {
  const { data } = await http.put<{ ok: boolean }>(`/alarms/${id}`, rule)
  return data
}

export async function deleteAlarm(id: string) {
  const { data } = await http.delete<{ ok: boolean }>(`/alarms/${id}`)
  return data
}

export async function enableAlarm(id: string) {
  const { data } = await http.post<{ ok: boolean }>(`/alarms/${id}/enable`)
  return data
}

export async function disableAlarm(id: string) {
  const { data } = await http.post<{ ok: boolean }>(`/alarms/${id}/disable`)
  return data
}

export interface AlarmHistoryRow {
  id: number
  rule_id: string
  severity: AlarmSeverity
  message: string
  server_id: string
  device_id: string
  name: string
  hash_id: string
  value: number
  threshold: string
  triggered_at: string
  status?: 'active' | 'resolved'
  resolved_at?: string | null
}

export async function listAlarmHistory(params: { rule_id?: string; hash_id?: string; severity?: AlarmSeverity; start?: string; end?: string; page?: number; size?: number }) {
  const { data } = await http.get<{ rows: AlarmHistoryRow[]; total: number; page: number; size: number; total_pages: number }>(`/alarms/history`, { params })
  return data
}

export async function resolveHistory(id: number) {
  const { data } = await http.post<{ ok: boolean }>(`/alarms/history/${id}/resolve`)
  return data
}

export async function muteAlarm(id: string) {
  const { data } = await http.post<{ ok: boolean }>(`/alarms/${id}/mute`)
  return data
}

export async function unmuteAlarm(id: string) {
  const { data } = await http.post<{ ok: boolean }>(`/alarms/${id}/unmute`)
  return data
}
