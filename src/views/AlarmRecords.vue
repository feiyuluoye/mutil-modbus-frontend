<template>
  <div class="page">
    <el-card>
      <div class="toolbar">
        <el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" :shortcuts="shortcuts" />
        <el-select v-model="severity" placeholder="级别" clearable style="width:140px;">
          <el-option label="info" value="info" />
          <el-option label="warning" value="warning" />
          <el-option label="critical" value="critical" />
          <el-option label="emergency" value="emergency" />
        </el-select>
        <el-input v-model="ruleId" placeholder="Rule ID" clearable style="width:180px;" />
        <el-input v-model="hashId" placeholder="Point HashID" clearable style="width:220px;" />
        <div class="spacer"/>
        <el-button @click="refresh" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="exportCSV">导出CSV</el-button>
      </div>
      <el-table :data="rows" height="640" stripe :default-sort="{ prop: 'triggered_at', order: 'descending' }">
        <el-table-column prop="triggered_at" label="时间" width="200"/>
        <el-table-column label="目标" min-width="240">
          <template #default="{ row }">{{ row.server_id }}/{{ row.device_id }} · {{ row.name }}</template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="120"/>
        <el-table-column prop="value" label="值" width="120"/>
        <el-table-column prop="threshold" label="阈值" width="160"/>
        <el-table-column prop="message" label="报警信息"/>
      </el-table>
      <div class="pager">
        <el-pagination background layout="prev, pager, next, total" :page-size="size" :total="total" :current-page="page" @current-change="onPageChange" />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { listAlarmHistory, type AlarmHistoryRow, type AlarmSeverity } from '../api/alarms'
import dayjs from 'dayjs'

const range = ref<[Date, Date] | null>(null)
const severity = ref<AlarmSeverity | undefined>(undefined)
const ruleId = ref('')
const hashId = ref('')
const rows = ref<AlarmHistoryRow[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)

const shortcuts = [
  { text: '今天', value: () => { const s=new Date(); s.setHours(0,0,0,0); return [s,new Date()] } },
  { text: '最近24小时', value: () => { const e=new Date(); const s=new Date(e.getTime()-24*3600*1000); return [s,e] } },
]

async function refresh(){
  loading.value = true
  try{
    const params: any = { page: page.value, size: size.value }
    if (range.value) {
      params.start = dayjs(range.value[0]).toISOString()
      params.end = dayjs(range.value[1]).toISOString()
    }
    if (severity.value) params.severity = severity.value
    if (ruleId.value) params.rule_id = ruleId.value
    if (hashId.value) params.hash_id = hashId.value
    const data = await listAlarmHistory(params)
    rows.value = data.rows
    total.value = data.total
  } finally{
    loading.value=false
  }
}
function onPageChange(p:number){ page.value = p; refresh() }
function exportCSV(){
  const header = ['时间','服务器/设备/点位','级别','值','阈值','消息']
  const data = rows.value.map(r=>[
    r.triggered_at,
    `${r.server_id}/${r.device_id}·${r.name}`,
    r.severity,
    r.value,
    r.threshold,
    r.message,
  ])
  const csv = [header, ...data].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='alarms.csv'; a.click(); URL.revokeObjectURL(url)
}

// Auto init: default last 24h and read route query
const route = useRoute()
onMounted(() => {
  const e = new Date()
  const s = new Date(e.getTime() - 24*3600*1000)
  range.value = [s, e]
  if (typeof route.query.rule_id === 'string') ruleId.value = route.query.rule_id
  if (typeof route.query.hash_id === 'string') hashId.value = route.query.hash_id
  refresh()
})
</script>

<style scoped>
.page{ display:grid; gap:16px; }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.toolbar .spacer{ flex:1 }
:deep(.el-table__row){ height:44px }
.pager{ display:flex; justify-content:flex-end; margin-top:12px; }
</style>
