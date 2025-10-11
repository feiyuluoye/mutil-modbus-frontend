<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">New Server</el-button>
      </div>
      <el-table :data="servers" height="640">
        <el-table-column prop="ServerID" label="Server ID" />
        <el-table-column prop="ServerName" label="Name" />
        <el-table-column prop="Protocol" label="Protocol" width="140" />
        <el-table-column prop="Host" label="Host" width="160" />
        <el-table-column prop="Port" label="Port" width="100" />
        <el-table-column prop="Enabled" label="Enabled" width="120">
          <template #default="{ row }"><el-tag :type="row.Enabled ? 'success' : 'info'">{{ row.Enabled ? 'ON' : 'OFF' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Actions" width="220">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">Edit</el-button>
            <el-popconfirm title="Delete this server?" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" type="danger">Delete</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="drawer" title="Server" size="40%">
      <el-form :model="form" label-width="120px">
        <el-form-item label="Server ID"><el-input v-model="form.ServerID" :disabled="!!form._edit"/></el-form-item>
        <el-form-item label="Name"><el-input v-model="form.ServerName"/></el-form-item>
        <el-form-item label="Protocol"><el-select v-model="form.Protocol"><el-option label="modbus-tcp" value="modbus-tcp"/></el-select></el-form-item>
        <el-form-item label="Host"><el-input v-model="form.Host"/></el-form-item>
        <el-form-item label="Port"><el-input-number v-model="form.Port" :min="1" :max="65535"/></el-form-item>
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
import { onMounted, ref, computed } from 'vue'
import { createServer, updateServer, deleteServer } from '../api/db'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const servers = computed(() => app.servers)
const drawer = ref(false)
const form = ref<any>({})

onMounted(async () => { await app.loadServers() })

function openCreate() { form.value = { Enabled: true }; drawer.value = true }
function edit(row:any) { form.value = { ...row, _edit: true }; drawer.value = true }

async function save() {
  if (form.value._edit) {
    await updateServer(form.value.ServerID, form.value)
  } else {
    await createServer(form.value)
  }
  drawer.value = false
  await app.loadServers()
}

async function remove(row:any) {
  await deleteServer(row.ServerID)
  await app.loadServers()
}
</script>

<style scoped>
.toolbar { margin-bottom: 12px; display:flex; justify-content: flex-end; }
</style>
