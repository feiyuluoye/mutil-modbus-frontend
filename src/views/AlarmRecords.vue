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
        <div class="spacer"/>
        <el-button @click="refresh" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="exportCSV">导出CSV</el-button>
      </div>
      <el-table :data="rows" height="640" stripe :default-sort="{ prop: 'triggered_at', order: 'descending' }">
        <el-table-column prop="triggered_at" label="时间" width="200"/>
        <el-table-column label="规则" min-width="200">
          <template #default="{ row }">{{ ruleName(row.rule_id) }}</template>
        </el-table-column>
        <el-table-column label="目标" min-width="240">
          <template #default="{ row }">{{ row.server_id }}/{{ row.device_id }} · {{ row.name }}</template>
        </el-table-column>
        <el-table-column prop="severity" label="级别" width="120"/>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status==='resolved' ? 'success' : 'danger'">{{ row.status || 'active' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="值" width="120"/>
        <el-table-column prop="threshold" label="阈值" width="160"/>
        <el-table-column prop="message" label="报警信息"/>
        <el-table-column label="操作" width="240">
          <template #default="{ row }">
            <el-button size="small" @click="onResolve(row)" :disabled="row.status==='resolved'">已处理</el-button>
            <el-button size="small" type="warning" @click="onToggleMute(row)">{{ isMuted(row.rule_id) ? '取消忽视' : '忽视' }}</el-button>
          </template>
        </el-table-column>
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
import { listAlarmHistory, resolveHistory, muteAlarm, unmuteAlarm, listAlarms, type AlarmHistoryRow, type AlarmSeverity, type AlarmRule } from '../api/alarms'
import dayjs from 'dayjs'
import { ElMessage, ElMessageBox } from 'element-plus'

const range = ref<[Date, Date] | null>(null)
const severity = ref<AlarmSeverity | undefined>(undefined)
const ruleId = ref('')
const hashId = ref('')
const rows = ref<AlarmHistoryRow[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const ruleMuted = ref<Record<string, boolean>>({})
const ruleNames = ref<Record<string, string>>({})

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

function ruleName(ruleId: string){
  return ruleNames.value[ruleId] || '-'
}

async function loadAllRules(){
  // load enabled and disabled rules for name mapping
  try{
    const pageSize = 200
    for (const enabled of [true, false]){
      let cur = 1
      // simple loop up to 10 pages to cap requests
      for (let i=0;i<10;i++){
        const { rows, total, size } = await listAlarms({ enabled, page: cur, size: pageSize })
        rows.forEach((r: AlarmRule) => { ruleNames.value[r.id] = r.name })
        const totalPages = Math.ceil(total / (size || pageSize))
        if (cur >= totalPages) break
        cur++
      }
    }
  }catch(e){ /* ignore for now */ }
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
  // loadAllRules()
  refresh()
})

async function onResolve(row: AlarmHistoryRow){
  await ElMessageBox.confirm('确认将该条告警标记为已处理吗？', '提示', { type: 'warning' })
  await resolveHistory(row.id)
  ElMessage.success('已处理')
  refresh()
}

function isMuted(ruleId: string){ return !!ruleMuted.value[ruleId] }

async function onToggleMute(row: AlarmHistoryRow){
  const rid = row.rule_id
  const muted = !!ruleMuted.value[rid]
  if (!muted) {
    await muteAlarm(rid)
    ruleMuted.value[rid] = true
    ElMessage.success('已忽视该规则')
  } else {
    await unmuteAlarm(rid)
    ruleMuted.value[rid] = false
    ElMessage.success('已取消忽视')
  }
}
</script>

<style scoped>
.page{ display:grid; gap:16px; }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.toolbar .spacer{ flex:1 }
:deep(.el-table__row){ height:44px }
.pager{ display:flex; justify-content:flex-end; margin-top:12px; }
</style>
