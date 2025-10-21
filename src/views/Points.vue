<template>
  <div class="page">
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
        style="margin-right:8px" />
      <el-select v-model="pageSize" style="width:120px; margin-right:8px">
        <el-option :value="20" label="20 / page" />
        <el-option :value="50" label="50 / page" />
        <el-option :value="100" label="100 / page" />
      </el-select>
      <el-button type="primary" @click="resetAndQuery" :loading="loading">Query</el-button>
      <div style="flex:1"></div>
      <el-button type="primary" @click="openCreate">New Point</el-button>
    </div>

    <el-table :data="rows" height="560" v-loading="loading">
      <el-table-column prop="timestamp" label="Time" width="200" />
      <el-table-column prop="server_id" label="Server" width="160" />
      <el-table-column prop="device_id" label="Device" width="200" />
      <el-table-column prop="name" label="Point" min-width="160" />
      <el-table-column prop="unit" label="Unit" min-width="160" />
      <el-table-column prop="data_type" label="DataType" min-width="140" />
      <el-table-column prop="value" label="Value" width="160" />
      <el-table-column label="Actions" width="220">
        <template #default="{ row }">
          <el-button size="small" @click="editPoint(row)">Edit</el-button>
          <el-popconfirm title="Delete this point?" @confirm="removePoint(row)">
            <template #reference>
              <el-button size="small" type="danger">Delete</el-button>
            </template>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager">
      <el-button @click="prevPage" :disabled="page <= 1 || loading">Prev</el-button>
      <span class="page-indicator">Page {{ page }}</span>
      <el-button @click="nextPage" :disabled="!canNext || loading">Next</el-button>
      <el-button text @click="resetAndQuery" :disabled="loading">Reset</el-button>
    </div>
  </el-card>

  <!-- Create/Update Point Drawer -->
  <el-drawer v-model="drawer" title="Point" size="40%">
    <el-form :model="form" label-width="120px">
      <el-form-item label="Server">
        <el-select v-model="form.ServerID" placeholder="Select server" :disabled="!!form._edit" filterable style="width:100%" @change="onDrawerServerChange">
          <el-option v-for="s in servers" :key="s.ServerID" :value="s.ServerID" :label="s.ServerName || s.ServerID" />
        </el-select>
      </el-form-item>
      <el-form-item label="Device">
        <el-select v-model="form.DeviceID" placeholder="Select device" :disabled="!!form._edit" filterable style="width:100%">
          <el-option v-for="d in devices" :key="d.DeviceID" :value="d.DeviceID" :label="d.DeviceName || d.DeviceID" />
        </el-select>
      </el-form-item>
      <el-form-item label="Name"><el-input v-model="form.Name" :disabled="!!form._edit"/></el-form-item>
      <el-form-item label="Address"><el-input-number v-model="form.Address" :min="0" :step="1" style="width:100%" /></el-form-item>
      <el-form-item label="RegisterType"><el-input v-model="form.RegisterType"/></el-form-item>
      <el-form-item label="DataType"><el-input v-model="form.DataType"/></el-form-item>
      <el-form-item label="ByteOrder"><el-input v-model="form.ByteOrder"/></el-form-item>
      <el-form-item label="Unit"><el-input v-model="form.Unit"/></el-form-item>
      <el-form-item label="Value"><el-input v-model="form.Value"/></el-form-item>
      <el-form-item label="Enabled"><el-switch v-model="form.Enabled"/></el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="drawer=false">Cancel</el-button>
      <el-button type="primary" @click="savePoint">Save</el-button>
    </template>
  </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listServers, listDevicesByServer, queryPointsPaged, createPoint, updatePoint, deletePoint } from '../api/db'

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

const rows = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(50)
const canNext = ref(false)
const total = ref(0)
const totalPages = ref(1)

const drawer = ref(false)
const form = ref<any>({})

// stack of cursors (RFC3339 end timestamps) for prev navigation
const cursorStack = ref<string[]>([])

onMounted(async () => {
  const s = await listServers()
  servers.value = Array.isArray(s.data) ? s.data : (s.data.servers ?? s.data.data ?? [])
  const r = await queryFirstPage()
  console.log(r)
})

// Trigger query when filter inputs change
watch(pageSize, () => { resetAndQuery() })
watch(sid, async () => { await onServerChange(); resetAndQuery() })
watch(did, () => { resetAndQuery() })
watch(name, () => { resetAndQuery() })
watch(dateRange, () => { resetAndQuery() })

async function onServerChange() {
  devices.value = []
  did.value = ''
  if (!sid.value) return
  const r = await listDevicesByServer(sid.value)
  devices.value = Array.isArray(r.data) ? r.data : (r.data.devices ?? r.data.data ?? [])
}

// Drawer server change: refresh devices list for selected server in the drawer
async function onDrawerServerChange(val: string) {
  form.value.DeviceID = ''
  devices.value = []
  if (!val) return
  const r = await listDevicesByServer(val)
  devices.value = Array.isArray(r.data) ? r.data : (r.data.devices ?? r.data.data ?? [])
}

function toRFC3339(d: Date): string { return d.toISOString() }

function buildParamsForQuery() {
  const params: any = { page: page.value, size: pageSize.value }
  if (sid.value) params.server_id = sid.value
  if (did.value) params.device_id = did.value
  if (name.value) params.name = name.value
  if (dateRange.value) {
    params.start = toRFC3339(dateRange.value[0])
    params.end = toRFC3339(dateRange.value[1])
  }
  return params
}

async function queryFirstPage() {
  loading.value = true
  try {
    const r = await queryPointsPaged(buildParamsForQuery())
    const data = r.data || {}
    rows.value = data.rows || []
    total.value = data.total || 0
    totalPages.value = data.total_pages || 1
    canNext.value = page.value < totalPages.value
  } finally {
    loading.value = false
  }
}

async function nextPage() {
  if (!canNext.value) return
  page.value += 1
  await queryFirstPage()
}

async function prevPage() {
  if (page.value <= 1) return
  page.value -= 1
  await queryFirstPage()
}

async function resetAndQuery() {
  page.value = 1
  await queryFirstPage()
}

function openCreate() {
  form.value = { Enabled: true, ServerID: sid.value || '', DeviceID: did.value || '' }
  drawer.value = true
}

async function editPoint(row:any) {
  // Map row fields (supports both snake_case and CamelCase from different APIs)
  const serverId = row.server_id || row.ServerID || ''
  const deviceId = row.device_id || row.DeviceID || ''
  const name = row.name || row.Name || ''
  const hashId = row.hash_id || row.HashID

  // Base form
  form.value = {
    _edit: true,
    HashID: hashId,
    ServerID: serverId,
    DeviceID: deviceId,
    Name: name,
    Address: row.address || row.Address,
    RegisterType: row.register_type || row.RegisterType,
    DataType: row.data_type || row.DataType,
    ByteOrder: row.byte_order || row.ByteOrder,
    Unit: row.unit || row.Unit,
    Enabled: row.enabled ?? row.Enabled ?? true,
  }

  // Ensure devices list matches the form's server for display in drawer
  if (serverId) {
    await onDrawerServerChange(serverId)
    // keep the device selection after devices loaded
    form.value.DeviceID = deviceId
  }

  drawer.value = true
}

async function savePoint() {
  if (form.value._edit && form.value.HashID) {
    await updatePoint(form.value.HashID, form.value)
  } else {
    // Ensure Address is an integer when creating
    const payload = { ...form.value }
    if (payload.Address !== undefined) {
      const n = Number(payload.Address)
      payload.Address = Number.isFinite(n) ? Math.trunc(n) : 0
    }
    await createPoint(payload)
  }
  drawer.value = false
  await resetAndQuery()
}

async function removePoint(row:any) {
  const id = row.hash_id || row.HashID
  if (!id) return
  await deletePoint(id)
  await resetAndQuery()
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
