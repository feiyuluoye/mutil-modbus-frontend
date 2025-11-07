<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-button type="primary" @click="openCreate">New Server</el-button>
      </div>
      <el-table :data="servers" height="640">
        <el-table-column prop="ServerID" label="Server ID" width="140" />
        <el-table-column prop="ServerName" label="Name" width="120" />
        <el-table-column prop="Protocol" label="Protocol" width="110" />
        <el-table-column label="Address" width="160">
          <template #default="{ row }">
            <span v-if="isRTU(row.Protocol)">{{ row.Path || '-' }}</span>
            <span v-else>{{ row.Host || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Port" width="80">
          <template #default="{ row }">
            <span v-if="!isRTU(row.Protocol)">{{ row.Port || '-' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Baud Rate" width="100">
          <template #default="{ row }">
            <span v-if="isRTU(row.Protocol)">{{ row.BaudRate || 9600 }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Data Bits" width="90">
          <template #default="{ row }">
            <span v-if="isRTU(row.Protocol)">{{ row.DataBits || 8 }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Stop Bits" width="90">
          <template #default="{ row }">
            <span v-if="isRTU(row.Protocol)">{{ row.StopBits || 1 }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="Parity" width="80">
          <template #default="{ row }">
            <span v-if="isRTU(row.Protocol)">{{ row.Parity || 'N' }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="Enabled" label="Enabled" width="90">
          <template #default="{ row }"><el-tag :type="row.Enabled ? 'success' : 'info'">{{ row.Enabled ? 'ON' : 'OFF' }}</el-tag></template>
        </el-table-column>
        <el-table-column label="Actions" width="300">
          <template #default="{ row }">
            <el-button size="small" @click="edit(row)">Edit</el-button>
            <el-popconfirm title="Delete this server?" @confirm="remove(row)">
              <template #reference>
                <el-button size="small" type="danger">Delete</el-button>
              </template>
            </el-popconfirm>
            <el-button size="small" type="warning" @click="goMock(row)">Mock</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer v-model="drawer" title="Server" size="40%">
      <el-form :model="form" label-width="140px">
        <el-form-item label="Server ID"><el-input v-model="form.ServerID" :disabled="!!form._edit"/></el-form-item>
        <el-form-item label="Name"><el-input v-model="form.ServerName"/></el-form-item>
        <el-form-item label="Protocol">
          <el-select v-model="form.Protocol" @change="onProtocolChange">
            <el-option label="Modbus TCP" value="modbus-tcp"/>
            <el-option label="Modbus RTU" value="modbus-rtu"/>
          </el-select>
        </el-form-item>
        
        <!-- TCP Parameters -->
        <template v-if="!isRTU(form.Protocol)">
          <el-form-item label="Host"><el-input v-model="form.Host" placeholder="192.168.1.100"/></el-form-item>
          <el-form-item label="Port"><el-input-number v-model="form.Port" :min="1" :max="65535" placeholder="502"/></el-form-item>
        </template>
        
        <!-- RTU Parameters -->
        <template v-else>
          <el-form-item label="Serial Port"><el-input v-model="form.Path" placeholder="/dev/ttyUSB0 or COM1"/></el-form-item>
          <el-form-item label="Baud Rate">
            <el-select v-model="form.BaudRate">
              <el-option :label="1200" :value="1200"/>
              <el-option :label="2400" :value="2400"/>
              <el-option :label="4800" :value="4800"/>
              <el-option :label="9600" :value="9600"/>
              <el-option :label="19200" :value="19200"/>
              <el-option :label="38400" :value="38400"/>
              <el-option :label="57600" :value="57600"/>
              <el-option :label="115200" :value="115200"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Data Bits">
            <el-select v-model="form.DataBits">
              <el-option :label="7" :value="7"/>
              <el-option :label="8" :value="8"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Stop Bits">
            <el-select v-model="form.StopBits">
              <el-option :label="1" :value="1"/>
              <el-option :label="2" :value="2"/>
            </el-select>
          </el-form-item>
          <el-form-item label="Parity">
            <el-select v-model="form.Parity">
              <el-option label="None" value="N"/>
              <el-option label="Even" value="E"/>
              <el-option label="Odd" value="O"/>
            </el-select>
          </el-form-item>
        </template>
        
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
import { useRouter } from 'vue-router'
import { createServer, updateServer, deleteServer } from '../api/db'
import { useAppStore } from '../stores/app'

const app = useAppStore()
const servers = computed(() => app.servers)
const drawer = ref(false)
const form = ref<any>({})
const router = useRouter()

onMounted(async () => { await app.loadServers() })

function isRTU(protocol: string) {
  return protocol && (protocol.toLowerCase().includes('rtu') || protocol.toLowerCase() === 'rtu')
}

function openCreate() { 
  form.value = { 
    Protocol: 'modbus-tcp',
    Host: '',
    Port: 502,
    Path: '',
    BaudRate: 9600,
    DataBits: 8,
    StopBits: 1,
    Parity: 'N',
    Enabled: true 
  }
  drawer.value = true 
}

function edit(row:any) { form.value = { ...row, _edit: true }; drawer.value = true }

function onProtocolChange() {
  // Set default values when protocol changes
  if (isRTU(form.value.Protocol)) {
    if (!form.value.BaudRate) form.value.BaudRate = 9600
    if (!form.value.DataBits) form.value.DataBits = 8
    if (!form.value.StopBits) form.value.StopBits = 1
    if (!form.value.Parity) form.value.Parity = 'N'
  } else {
    if (!form.value.Port) form.value.Port = 502
  }
}

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

function goMock(row: any) {
  router.push(`/servers/${row.ServerID}/mock`)
}
</script>

<style scoped>
.toolbar { margin-bottom: 12px; display:flex; justify-content: flex-end; }
</style>
