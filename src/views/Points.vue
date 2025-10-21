<template>
  <el-card>
    <div class="toolbar">
      <el-select v-model="sid" placeholder="Server" clearable style="width:200px; margin-right:8px" @change="onServerChange">
        <el-option v-for="s in servers" :key="s.ServerID" :value="s.ServerID" :label="s.ServerName" />
      </el-select>
      <el-select v-model="did" placeholder="Device" clearable style="width:220px; margin-right:8px" :disabled="!sid">
        <el-option v-for="d in devices" :key="d.DeviceID" :value="d.DeviceID" :label="d.DeviceName || d.DeviceID" />
      </el-select>
      <el-input v-model="name" placeholder="Point name" clearable style="width:220px; margin-right:8px" />
      <el-date-picker
        v-model="dateRange"
        type="datetimerange"
        range-separator="to"
        start-placeholder="Start"
        end-placeholder="End"
        :default-time="[new Date(2000, 1, 1, 0, 0, 0), new Date(2099, 1, 1, 23, 59, 59)]"
        style="margin-right:8px"
      />
      <el-select v-model="pageSize" style="width:120px; margin-right:8px">
        <el-option :value="20" label="20 / page" />
        <el-option :value="50" label="50 / page" />
        <el-option :value="100" label="100 / page" />
      </el-select>
      <el-button type="primary" @click="resetAndQuery" :loading="loading">Query</el-button>
    </div>

    <el-table :data="rows" height="560" v-loading="loading">
      <el-table-column prop="timestamp" label="Time" width="200" />
      <el-table-column prop="server_id" label="Server" width="160" />
      <el-table-column prop="device_id" label="Device" width="200" />
      <el-table-column prop="name" label="Point" min-width="160" />
      <el-table-column prop="unit" label="Unit" min-width="160" />
      <el-table-column prop="data_type" label="DataType" min-width="140" />
      <el-table-column prop="value" label="Value" width="160" />
    </el-table>

    <div class="pager">
      <el-button @click="prevPage" :disabled="page <= 1 || loading">Prev</el-button>
      <span class="page-indicator">Page {{ page }}</span>
      <el-button @click="nextPage" :disabled="!canNext || loading">Next</el-button>
      <el-button text @click="resetAndQuery" :disabled="loading">Reset</el-button>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listServers, listDevicesByServer, listPointValues } from '../api/db'

type PointRow = {
  Timestamp: string
  ServerID: string
  DeviceID: string
  Name: string
  Value: number | string | boolean | null
  Unit?: string
  Scale?: number
  Offset?: number
}

const servers = ref<any[]>([])
const devices = ref<any[]>([])
const sid = ref<string>('')
const did = ref<string>('')
const name = ref<string>('')
const dateRange = ref<[Date, Date] | null>(null)

const rows = ref<PointRow[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(50)
const canNext = ref(false)

// stack of cursors (RFC3339 end timestamps) for prev navigation
const cursorStack = ref<string[]>([])

onMounted(async () => {
  const s = await listServers()
  servers.value = Array.isArray(s.data) ? s.data : (s.data.servers ?? s.data.data ?? [])
  const r = await queryFirstPage()
  console.log(r)
})

watch(pageSize, () => {
  resetAndQuery()
})

async function onServerChange() {
  devices.value = []
  did.value = ''
  if (!sid.value) return
  const r = await listDevicesByServer(sid.value)
  devices.value = Array.isArray(r.data) ? r.data : (r.data.devices ?? r.data.data ?? [])
}

function toRFC3339(d: Date): string { return d.toISOString() }

function buildParams(cursorEnd?: string) {
  const params: any = { limit: pageSize.value, asc: false }
  if (sid.value) params.server_id = sid.value
  if (did.value) params.device_id = did.value
  if (name.value) params.name = name.value
  if (dateRange.value) {
    params.start = toRFC3339(dateRange.value[0])
    params.end = toRFC3339(dateRange.value[1])
  }
  if (cursorEnd) params.end = cursorEnd
  return params
}

async function queryFirstPage() {
  loading.value = true
  try {
    const r = await listPointValues(buildParams())
    rows.value = r.data ?? []
    // set next availability
    canNext.value = Array.isArray(rows.value) && rows.value.length === pageSize.value
  } finally {
    loading.value = false
  }
}

async function nextPage() {
  if (!canNext.value || rows.value.length === 0) return
  // push current end cursor (last timestamp) for prev
  const lastTs = rows.value[rows.value.length - 1].Timestamp
  cursorStack.value.push(lastTs)
  page.value += 1
  loading.value = true
  try {
    const r = await listPointValues(buildParams(lastTs))
    rows.value = r.data ?? []
    canNext.value = Array.isArray(rows.value) && rows.value.length === pageSize.value
  } finally {
    loading.value = false
  }
}

async function prevPage() {
  if (page.value <= 1) return
  // pop to previous cursor
  cursorStack.value.pop() // discard cursor for current page
  const prevCursor = cursorStack.value.pop() // cursor for previous page's end
  page.value -= 1
  loading.value = true
  try {
    const r = await listPointValues(buildParams(prevCursor || undefined))
    rows.value = r.data ?? []
    canNext.value = Array.isArray(rows.value) && rows.value.length === pageSize.value
    if (prevCursor) cursorStack.value.push(prevCursor)
  } finally {
    loading.value = false
  }
}

async function resetAndQuery() {
  page.value = 1
  cursorStack.value = []
  await queryFirstPage()
}
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 0 0 0;
}
.page-indicator { color: var(--el-text-color-regular); }
</style>
