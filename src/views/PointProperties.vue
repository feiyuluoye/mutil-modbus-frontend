<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-select v-model="sid" placeholder="Server" clearable style="width:200px; margin-right:8px" @change="onServerFilterChange">
          <el-option v-for="s in servers" :key="s.ServerID" :value="s.ServerID" :label="s.ServerName || s.ServerID" />
        </el-select>
        <el-select v-model="did" placeholder="Device" clearable style="width:220px; margin-right:8px" :disabled="!sid">
          <el-option v-for="d in devices" :key="d.DeviceID" :value="d.DeviceID" :label="d.DeviceName || d.DeviceID" />
        </el-select>
        <el-input v-model="qname" placeholder="Point name" clearable style="width:220px; margin-right:8px" />
        <el-select v-model="pageSize" style="width:120px; margin-right:8px">
          <el-option :value="20" label="20 / page" />
          <el-option :value="50" label="50 / page" />
          <el-option :value="100" label="100 / page" />
        </el-select>
        <el-button type="primary" @click="resetAndQuery" :loading="loading">Query</el-button>
        <div style="flex:1"></div>
        <el-button type="primary" @click="openCreate">Add PointProperty</el-button>
      </div>

      <el-table :data="rows" height="560" v-loading="loading">
        <el-table-column prop="ServerID" label="Server" width="160" />
        <el-table-column prop="DeviceID" label="Device" width="200" />
        <el-table-column prop="Name" label="Name" min-width="160" />
        <el-table-column prop="Address" label="Address" width="110" />
        <el-table-column prop="RegisterType" label="RegisterType" width="140" />
        <el-table-column prop="DataType" label="DataType" width="120" />
        <el-table-column prop="ByteOrder" label="ByteOrder" width="120" />
        <el-table-column prop="Unit" label="Unit" width="100" />
        <el-table-column prop="Enabled" label="Enabled" width="100">
          <template #default="{ row }"><el-tag :type="row.Enabled ? 'success' : 'info'">{{ row.Enabled ? 'ON' : 'OFF' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Actions" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="editRow(row)">Edit</el-button>
            <el-popconfirm title="Delete this point property?" @confirm="removeRow(row)">
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

    <el-drawer v-model="drawer" title="PointProperty" size="40%">
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
        <el-form-item label="Scale"><el-input-number v-model="form.Scale" :step="0.1" style="width:100%" /></el-form-item>
        <el-form-item label="Offset"><el-input-number v-model="form.Offset" :step="0.1" style="width:100%" /></el-form-item>
        <el-form-item label="Enabled"><el-switch v-model="form.Enabled"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawer=false">Cancel</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { listServers, listDevicesByServer, queryPointPropertiesPaged, createPoint, updatePoint, deletePoint } from '../api/db'

const servers = ref<any[]>([])
const devices = ref<any[]>([])
const sid = ref<string>('')
const did = ref<string>('')
const qname = ref<string>('')

const rows = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(50)
const total = ref(0)
const totalPages = ref(1)
const canNext = ref(false)

const drawer = ref(false)
const form = ref<any>({})

onMounted(async () => {
  const s = await listServers()
  servers.value = Array.isArray(s.data) ? s.data : (s.data.servers ?? s.data.data ?? [])
  await query()
})

watch(pageSize, () => resetAndQuery())
watch(qname, () => resetAndQuery())
watch(sid, async () => { await onServerFilterChange(); resetAndQuery() })
watch(did, () => resetAndQuery())

async function onServerFilterChange() {
  devices.value = []
  did.value = ''
  if (!sid.value) return
  const r = await listDevicesByServer(sid.value)
  devices.value = Array.isArray(r.data) ? r.data : (r.data.devices ?? r.data.data ?? [])
}

async function onDrawerServerChange(val: string) {
  form.value.DeviceID = ''
  devices.value = []
  if (!val) return
  const r = await listDevicesByServer(val)
  devices.value = Array.isArray(r.data) ? r.data : (r.data.devices ?? r.data.data ?? [])
}

function buildParams() {
  const params: any = { page: page.value, size: pageSize.value }
  if (sid.value) params.server_id = sid.value
  if (did.value) params.device_id = did.value
  if (qname.value) params.name = qname.value
  return params
}

async function query() {
  loading.value = true
  try {
    const r = await queryPointPropertiesPaged(buildParams())
    const data = r.data || {}
    rows.value = data.rows || []
    total.value = data.total || 0
    totalPages.value = data.total_pages || 1
    canNext.value = page.value < totalPages.value
  } finally {
    loading.value = false
  }
}

async function nextPage() { if (!canNext.value) return; page.value += 1; await query() }
async function prevPage() { if (page.value <= 1) return; page.value -= 1; await query() }
async function resetAndQuery() { page.value = 1; await query() }

function openCreate() {
  form.value = { Enabled: true, ServerID: sid.value || '', DeviceID: did.value || '', Scale: 1, Offset: 0 }
  drawer.value = true
}

async function editRow(row:any) {
  form.value = {
    _edit: true,
    HashID: row.HashID || row.hash_id,
    ServerID: row.ServerID || row.server_id,
    DeviceID: row.DeviceID || row.device_id,
    Name: row.Name || row.name,
    Address: row.Address || row.address,
    RegisterType: row.RegisterType || row.register_type,
    DataType: row.DataType || row.data_type,
    ByteOrder: row.ByteOrder || row.byte_order,
    Unit: row.Unit || row.unit,
    Scale: row.Scale ?? 1,
    Offset: row.Offset ?? 0,
    Enabled: row.Enabled ?? true,
  }
  if (form.value.ServerID) {
    await onDrawerServerChange(form.value.ServerID)
    form.value.DeviceID = row.DeviceID || row.device_id
  }
  drawer.value = true
}

async function save() {
  if (form.value._edit && form.value.HashID) {
    await updatePoint(form.value.HashID, form.value)
  } else {
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

async function removeRow(row:any) {
  const id = row.HashID || row.hash_id
  if (!id) return
  await deletePoint(id)
  await resetAndQuery()
}
</script>

<style scoped>
.toolbar { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.pager { display: flex; align-items: center; justify-content: flex-end; gap: 8px; padding: 12px 0 0 0; }
.page-indicator { color: var(--el-text-color-regular); }
</style>
