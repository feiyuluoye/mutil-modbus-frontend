<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" :shortcuts="shortcuts" />
        <el-select v-model="slot" placeholder="槽位/设备" clearable style="width:220px"/>
        <div class="spacer"/>
        <el-button @click="refresh" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="exportCSV">导出CSV</el-button>
      </div>
      <el-table :data="rows" height="640" stripe>
        <el-table-column prop="time" label="时间" width="200"/>
        <el-table-column prop="slot" label="槽位/设备" width="200"/>
        <el-table-column prop="item" label="分析项" width="200"/>
        <el-table-column prop="value" label="数值" width="140"/>
        <el-table-column prop="unit" label="单位" width="100"/>
        <el-table-column prop="remark" label="备注"/>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const range = ref<[Date, Date] | null>(null)
const slot = ref('')
const rows = ref<any[]>([])
const loading = ref(false)

const shortcuts = [
  { text: '今天', value: () => { const s=new Date(); s.setHours(0,0,0,0); return [s,new Date()] } },
  { text: '最近30天', value: () => { const e=new Date(); const s=new Date(e.getTime()-30*24*3600*1000); return [s,e] } },
]

async function refresh(){ loading.value=true; try{ /* TODO: 调用实际接口 */ rows.value = [] } finally{ loading.value=false } }
function exportCSV(){
  const header = ['时间','槽位/设备','分析项','数值','单位','备注']
  const data = rows.value.map(r=>[r.time,r.slot,r.item,r.value,r.unit,r.remark])
  const csv = [header, ...data].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='analysis_records.csv'; a.click(); URL.revokeObjectURL(url)
}
</script>

<style scoped>
.page{ display:grid; gap:16px; }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.toolbar .spacer{ flex:1 }
:deep(.el-table__row){ height:44px }
</style>
