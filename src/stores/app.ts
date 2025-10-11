import { defineStore } from 'pinia'
import { listServers, getStats } from '../api/db'
import { getRuntimeState } from '../api/runtime'

export interface Stats {
  servers: number
  devices: number
  collectors: number
}

export const useAppStore = defineStore('app', {
  state: () => ({
    servers: [] as any[],
    stats: { servers: 0, devices: 0, collectors: 0 } as Stats,
    loadingServers: false,
    loadingStats: false,
    runtimeRunning: [] as any[],
    loadingRuntime: false,
  }),
  actions: {
    async loadServers() {
      if (this.loadingServers) return
      this.loadingServers = true
      try {
        const res = await listServers()
        this.servers = Array.isArray(res.data) ? res.data : (res.data.servers ?? res.data.data ?? [])
      } finally {
        this.loadingServers = false
      }
    },
    async loadStats() {
      if (this.loadingStats) return
      this.loadingStats = true
      try {
        const res = await getStats()
        const d = res.data || {}
        this.stats = {
          servers: Number(d.servers || 0),
          devices: Number(d.devices || 0),
          collectors: Number(d.collectors || 0),
        }
      } finally {
        this.loadingStats = false
      }
    },
    async loadRuntime() {
      if (this.loadingRuntime) return
      this.loadingRuntime = true
      try {
        const res = await getRuntimeState()
        const d = res.data || {}
        this.runtimeRunning = Array.isArray(d.running) ? d.running : []
      } finally {
        this.loadingRuntime = false
      }
    },
  },
})
