<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-select v-model="sid" placeholder="Server" style="width:220px; margin-right:8px">
          <el-option v-for="s in servers" :key="s.ServerID" :value="s.ServerID" :label="s.ServerID"/>
        </el-select>
        <el-button type="primary" @click="openCreate" :disabled="!sid">New Device</el-button>
      </div>
      <el-table :data="devices" height="640">
        <el-table-column prop="DeviceID" label="Device ID" />
        <el-table-column prop="Vendor" label="Vendor" />
        <el-table-column prop="SlaveID" label="Slave ID" width="120" />
        <el-table-column prop="PollInterval" label="Poll Interval" width="160" />
        <el-table-column label="Actions" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">Edit</el-button>
            <el-popconfirm title="Delete this device?" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" type="danger">Delete</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="drawer" title="Device" size="40%">
      <el-form :model="form" label-width="120px">
        <el-form-item label="Device ID"><el-input v-model="form.DeviceID" :disabled="!!form._edit"/></el-form-item>
        <el-form-item label="Vendor"><el-input v-model="form.Vendor"/></el-form-item>
        <el-form-item label="Slave ID"><el-input-number v-model="form.SlaveID" :min="0" :max="247"/></el-form-item>
        <el-form-item label="Poll Interval"><el-input v-model="form.PollInterval" placeholder="e.g. 5s"/></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="drawer=false">Cancel</el-button>
        <el-button type="primary" @click="save">Save</el-button>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { listDevicesByServer, createDevice, updateDevice, deleteDevice } from '../api/db'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const servers = computed(() => app.servers)
const sid = ref('')
const devices = ref<any[]>([])
const drawer = ref(false)
const form = ref<any>({})

async function loadDevices() {
  if (!sid.value) { devices.value = []; return }
  const d = await listDevicesByServer(sid.value)
  devices.value = Array.isArray(d.data) ? d.data : (d.data.devices ?? d.data.data ?? [])
}

onMounted(async () => { await app.loadServers(); if (!sid.value && app.servers.length) sid.value = app.servers[0].ServerID; await loadDevices() })
watch(sid, loadDevices)

function openCreate() { form.value = {}; drawer.value = true }
function edit(row:any) { form.value = { ...row, _edit: true }; drawer.value = true }

async function save() {
  if (form.value._edit) {
    await updateDevice(form.value.DeviceID, form.value)
  } else {
    await createDevice(sid.value, { ...form.value })
  }
  drawer.value = false
  await loadDevices()
}

async function remove(row:any) {
  await deleteDevice(row.DeviceID)
  await loadDevices()
}
</script>
