<template>
  <el-card>
    <div class="toolbar">
      <el-input v-model="name" placeholder="Point name" style="width:220px; margin-right:8px"/>
      <el-select v-model="sid" placeholder="Server" clearable style="width:200px; margin-right:8px">
        <el-option v-for="s in servers" :key="s.ServerID" :value="s.ServerID" :label="s.ServerName"/>
      </el-select>
      <el-input v-model="did" placeholder="Device" clearable style="width:200px; margin-right:8px"/>
      <el-button type="primary" @click="loadLatest">Latest</el-button>
    </div>
    <el-table :data="rows" height="640">
      <el-table-column prop="timestamp" label="Time" width="180" />
      <el-table-column prop="server_id" label="Server" width="160" />
      <el-table-column prop="device_id" label="Device" width="200" />
      <el-table-column prop="name" label="Point" />
      <el-table-column prop="value" label="Value" width="140" />
    </el-table>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { listServers, latestPoints } from '../api/db'

const servers = ref<any[]>([])
const sid = ref('')
const did = ref('')
const name = ref('')
const rows = ref<any[]>([])

onMounted(async () => {
  const s = await listServers();
  servers.value = Array.isArray(s.data) ? s.data : (s.data.servers ?? s.data.data ?? [])
})

async function loadLatest() {
  const params:any = {}
  if (sid.value) params.server_id = sid.value
  if (did.value) params.device_id = did.value
  if (name.value) params.name = name.value
  const r = await latestPoints(params)
  rows.value = r.data ?? []
}
</script>
