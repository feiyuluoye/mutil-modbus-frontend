import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

export interface CSVImportResult {
  success: boolean
  servers_created: number
  servers_updated: number
  devices_created: number
  devices_updated: number
  points_created: number
  points_updated: number
  errors?: string[]
  message: string
}

export async function uploadServersCSV(file: File): Promise<CSVImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await axios.post(`${API_BASE}/api/v1/import/servers`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}

export async function uploadDevicesCSV(file: File): Promise<CSVImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await axios.post(`${API_BASE}/api/v1/import/devices`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}

export async function uploadPointsCSV(file: File): Promise<CSVImportResult> {
  const formData = new FormData()
  formData.append('file', file)
  const resp = await axios.post(`${API_BASE}/api/v1/import/points`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return resp.data
}
