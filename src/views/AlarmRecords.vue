<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" :shortcuts="shortcuts" />
        <div class="spacer"/>
        <el-button @click="refresh" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="exportCSV">导出CSV</el-button>
      </div>
      <el-table :data="rows" height="640" stripe>
        <el-table-column prop="time" label="时间" width="200"/>
        <el-table-column prop="slot" label="槽位/设备" width="200"/>
        <el-table-column prop="level" label="级别" width="120"/>
        <el-table-column prop="message" label="报警信息"/>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const range = ref<[Date, Date] | null>(null)
const rows = ref<any[]>([])
const loading = ref(false)

const shortcuts = [
  { text: '今天', value: () => { const s=new Date(); s.setHours(0,0,0,0); return [s,new Date()] } },
  { text: '最近24小时', value: () => { const e=new Date(); const s=new Date(e.getTime()-24*3600*1000); return [s,e] } },
]

async function refresh(){ loading.value=true; try{ /* TODO: 调用实际接口 */ rows.value = [] } finally{ loading.value=false } }
function exportCSV(){
  const header = ['时间','槽位/设备','级别','报警信息']
  const data = rows.value.map(r=>[r.time,r.slot,r.level,r.message])
  const csv = [header, ...data].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='alarms.csv'; a.click(); URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page{ display:grid; gap:16px; }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.toolbar .spacer{ flex:1 }
:deep(.el-table__row){ height:44px }
</style>
