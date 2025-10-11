<template>
  <div class="grid gap">
    <el-card>
      <div class="stats">
        <div class="stat"><div class="label">Servers</div><div class="val">{{ serversCount }}</div></div>
        <div class="stat"><div class="label">Devices</div><div class="val">{{ devicesCount }}</div></div>
        <div class="stat"><div class="label">Collectors</div><div class="val">{{ collectorsCount }}</div></div>
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
      </div>

      <el-table :data="filtered" height="540">
        <el-table-column prop="timestamp" label="Time" width="180" />
        <el-table-column prop="server_id" label="Server" width="160" />
        <el-table-column prop="device_id" label="Device" width="200" />
        <el-table-column prop="name" label="Point" />
        <el-table-column prop="value" label="Value" width="140" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, computed, watch } from 'vue'
import { listDevicesByServer } from '../api/db'
import { subscribePoints, type PointMsg } from '../api/stream'
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
let stop: (() => void) | null = null
let runtimeTimer: any = null

onMounted(async () => {
  await Promise.all([app.loadServers(), app.loadStats(), app.loadRuntime()])
  if (app.servers.length) { serverId.value = app.servers[0].ServerID }
  await loadDevices()
  stop = subscribePoints((m) => {
    rows.value.unshift(m)
    if (rows.value.length > 2000) rows.value.pop()
  })
  runtimeTimer = setInterval(() => { app.loadRuntime() }, 5000)
})
onBeforeUnmount(() => { if (stop) stop(); if (runtimeTimer) clearInterval(runtimeTimer) })

watch(serverId, async () => { await loadDevices() })

async function loadDevices() {
  if (!serverId.value) { devices.value = []; return }
  const d = await listDevicesByServer(serverId.value)
  devices.value = Array.isArray(d.data) ? d.data : (d.data.devices ?? d.data.data ?? [])
}

const filtered = computed(() => rows.value.filter(r =>
  (!serverId.value || r.server_id === serverId.value) &&
  (!deviceId.value || r.device_id === deviceId.value)
))
</script>

<style scoped>
.grid { display: grid; grid-template-rows: auto 1fr; gap: 16px; }
.stats { display:flex; gap:24px; }
.stat { background:#0f172a; border:1px solid #1f2937; padding:12px 16px; border-radius:8px; }
.label { color:#94a3b8; font-size:12px; }
.val { color:#60a5fa; font-size:24px; font-weight:700; }
.filters { display:flex; gap:12px; margin-bottom:12px; }
</style>
