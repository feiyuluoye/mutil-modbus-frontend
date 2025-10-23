<template>
  <div class="grid gap">
    <el-card>
      <div class="stats">
        <div class="metric neon blue">
          <div class="label">Servers</div>
          <div class="value">{{ serversCount }}</div>
        </div>
        <div class="metric neon green">
          <div class="label">Devices</div>
          <div class="value">{{ devicesCount }}</div>
        </div>
        <div class="metric neon yellow">
          <div class="label">Collectors</div>
          <div class="value">{{ collectorsCount }}</div>
        </div>
      </div>
    </el-card>

    <el-card>
      <div class="runtime-head">
        <div class="title">Runtime Collectors</div>
        <div class="muted">Running: {{ runtimeRunning.length }}</div>
        <el-button text type="primary" @click="refreshRuntime" :loading="loadingRuntime">Refresh</el-button>
      </div>
      <el-table :data="runtimePreview" height="200">
        <el-table-column prop="server" label="Server" width="220" />
        <el-table-column prop="device" label="Device" width="220" />
        <el-table-column prop="status" label="Status" />
      </el-table>
    </el-card>

    <el-card>
      <div class="filters">
        <el-select v-model="serverId" placeholder="Server" clearable style="width:220px">
          <el-option v-for="s in servers" :key="s.ServerID" :label="s.ServerName" :value="s.ServerID" />
        </el-select>
        <el-select v-model="deviceId" placeholder="Device" clearable style="width:220px">
          <el-option v-for="d in devices" :key="d.DeviceID" :label="d.DeviceID" :value="d.DeviceID" />
        </el-select>
        <el-select v-model="refreshMs" style="width:160px" placeholder="刷新间隔">
          <el-option :value="500" label="刷新 0.5s" />
          <el-option :value="1000" label="刷新 1s" />
          <el-option :value="2000" label="刷新 2s" />
          <el-option :value="5000" label="刷新 5s" />
        </el-select>
      </div>
      <el-table :data="paged" height="540">
        <el-table-column prop="timestamp" label="Time" width="180" />
        <el-table-column prop="server_id" label="Server" width="160" />
        <el-table-column prop="device_id" label="Device" width="200" />
        <el-table-column prop="name" label="Point" />
        <el-table-column prop="address" label="Address" width="160" />
        <el-table-column prop="unit" label="Uint" width="160" />
        <el-table-column prop="data_type" label="data_type" width="160" />
        <el-table-column prop="value" label="Value" width="140" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { listDevicesByServer, latestPoints } from '../api/db'
import { type PointMsg } from '../api/stream'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const servers = computed(() => app.servers)
const devices = ref<any[]>([])
const serverId = ref<string>('')
const deviceId = ref<string>('')

const serversCount = computed(() => app.stats.servers)
const devicesCount = computed(() => app.stats.devices)
const collectorsCount = computed(() => app.stats.collectors)

const runtimeRunning = computed(() => app.runtimeRunning)
const loadingRuntime = computed(() => app.loadingRuntime)
const runtimePreview = computed(() => runtimeRunning.value.slice(0, 10).map((r:any) => ({
  server: r.server_id ?? r.ServerID ?? r.server ?? r.ServerName ?? '',
  device: r.device_id ?? r.DeviceID ?? r.device ?? '',
  status: r.status ?? (r.Enabled === true ? 'enabled' : (r.Enabled === false ? 'disabled' : ''))
})))

const rows = ref<PointMsg[]>([])
const MAX_ROWS = 500
const refreshMs = ref<number>(1000) // user-controlled refresh interval (ms)
let stop: (() => void) | null = null
let runtimeTimer: any = null
let pointsTimer: any = null
const lastSeen = new Map<string, string>() // key => ISO time
const pending = new Map<string, PointMsg>() // latest per key waiting to flush
let flushTimer: any = null

// pagination state
const pageSize = ref<number>(50)
const currentPage = ref<number>(1)
const paged = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filtered.value.slice(start, start + pageSize.value)
})

onMounted(async () => {
  await Promise.all([app.loadServers(), app.loadStats(), app.loadRuntime()])
  if (app.servers.length) { serverId.value = app.servers[0].ServerID }
  await loadDevices()

  // polling fallback to ensure updates even if SSE has only heartbeat
  startPolling()
  runtimeTimer = setInterval(() => { app.loadRuntime() }, 5000)
  startFlushLoop()
})
onBeforeUnmount(() => {if (runtimeTimer) clearInterval(runtimeTimer); if (pointsTimer) clearInterval(pointsTimer); if (flushTimer) clearInterval(flushTimer) })

watch(serverId, async () => { await loadDevices(); currentPage.value = 1; restartStream(); restartPolling() })
watch(deviceId, () => { currentPage.value = 1; restartStream(); restartPolling() })
watch(refreshMs, () => { restartPolling(); restartFlushLoop() })

async function loadDevices() {
  if (!serverId.value) { devices.value = []; return }
  const d = await listDevicesByServer(serverId.value)
  devices.value = Array.isArray(d.data) ? d.data : (d.data.devices ?? d.data.data ?? [])
}

const filtered = computed(() => rows.value.filter(r =>
  (!serverId.value || r.server_id === serverId.value) &&
  (!deviceId.value || r.device_id === deviceId.value)
))


function restartStream() {
  // keep current rows; just adjust the upstream filter
  console.log('restartStream', serverId.value, deviceId.value)
}

function startPolling() {
  if (pointsTimer) clearInterval(pointsTimer)
  pointsTimer = setInterval(pollLatest, Math.max(refreshMs.value, 1000))
}

function restartPolling() {
  startPolling()
}

async function pollLatest() {
  try {
    const params: any = {}
    if (serverId.value) params.server_id = serverId.value
    if (deviceId.value) params.device_id = deviceId.value
    const resp = await latestPoints(params)
    const arr: any[] = Array.isArray(resp.data) ? resp.data : (resp.data.data ?? resp.data.rows ?? [])
    for (const r of arr) {
      const m: PointMsg = {
        server_id: r.server_id ?? r.ServerID ?? '',
        device_id: r.device_id ?? r.DeviceID ?? '',
        name: r.name ?? r.Name ?? '',
        value: r.value ?? r.Value ?? 0,
        timestamp: r.timestamp ?? r.Timestamp ?? '',
        data_type: r.data_type ?? r.DataType ?? '',
        unit: r.unit ?? r.Unit ?? '',
        address: r.address ?? r.Address ?? '',
      } 
      const key = `${m.server_id}|${m.device_id}|${m.name}`
      const prev = lastSeen.get(key) || ''
      // Only append if new or newer
      if (!prev || (m.timestamp && m.timestamp > prev)) {
        // enqueue for batched flush to avoid UI thrash
        const ex = pending.get(key)
        if (!ex || (m.timestamp && m.timestamp > (ex.timestamp || ''))) {
          pending.set(key, m)
        }
      }
    }
  } catch {
    // ignore errors; next tick will retry
  }
}

function startFlushLoop() {
  if (flushTimer) clearInterval(flushTimer)
  flushTimer = setInterval(() => {
    if (pending.size === 0) return
    const batch = Array.from(pending.values())
    pending.clear()
    // insert newest first for better UX
    batch.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))
    for (const m of batch) {
      const key = `${m.server_id}|${m.device_id}|${m.name}`
      const prev = lastSeen.get(key) || ''
      if (!prev || (m.timestamp && m.timestamp > prev)) {
        // Update existing row if same key exists, otherwise insert new
        const existingIdx = rows.value.findIndex(r => 
          r.server_id === m.server_id && r.device_id === m.device_id && r.name === m.name
        )
        if (existingIdx >= 0) {
          // Replace existing row with newer data
          rows.value.splice(existingIdx, 1, m)
        } else {
          // Insert new row at the beginning
          rows.value.unshift(m)
        }
        lastSeen.set(key, m.timestamp)
      }
    }
    // cap rows length for performance
    if (rows.value.length > MAX_ROWS) {
      rows.value.splice(MAX_ROWS)
    }
  }, Math.max(refreshMs.value, 100))
}

function restartFlushLoop() {
  startFlushLoop()
}

function refreshRuntime() {
  app.loadRuntime()
}

function onPageChange(p: number) {
  currentPage.value = p
}

function onSizeChange(s: number) {
  pageSize.value = s
  currentPage.value = 1
}
</script>

<style scoped>
.grid { display: grid; grid-template-rows: auto auto 1fr; gap: 16px; }
.stats { display:grid; grid-template-columns: repeat(3, minmax(160px, 1fr)); gap:16px; }
.filters { display:flex; gap:12px; margin-bottom:12px; }
.summary { color:#94a3b8; margin: 4px 0 8px; }
.pager { display:flex; justify-content:flex-end; margin-top:8px; }
.runtime-head { display:flex; align-items:center; gap:12px; margin-bottom:8px; }
.runtime-head .title{ font-weight:700; color:#e2e8f0; }
.runtime-head .muted{ color:#94a3b8; flex:1 }
.metric {
  background: linear-gradient(135deg, #0f172a 0%, #1f2937 100%);
  border: 1px solid #1f2937;
  padding: 12px 16px;
  border-radius: 8px;
}
.metric .label {
  color: #94a3b8;
  font-size: 12px;
}
.metric .value {
  color: #60a5fa;
  font-size: 24px;
  font-weight: 700;
}
</style>
