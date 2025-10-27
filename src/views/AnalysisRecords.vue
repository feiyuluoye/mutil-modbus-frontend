<template>
  <div class="page">
    <el-card>
      <div class="kpis">
        <el-card class="kpi" shadow="hover">
          <div class="kpi-title">总点位</div>
          <div class="kpi-value">{{ kpis.total_points }}</div>
        </el-card>
        <el-card class="kpi" shadow="hover">
          <div class="kpi-title">5分钟内波动</div>
          <div class="kpi-value">{{ kpis.fluctuating_points_5m }}</div>
        </el-card>
        <el-card class="kpi" shadow="hover">
          <div class="kpi-title">离线/告警</div>
          <div class="kpi-value">{{ kpis.alert_offline_points }}</div>
        </el-card>
        <el-card class="kpi" shadow="hover">
          <div class="kpi-title">连接状态</div>
          <div class="kpi-value">{{ kpis.connection_status }}</div>
        </el-card>
      </div>

      <div class="toolbar">
        <el-input v-model="query" placeholder="按名称搜索" clearable style="width:240px" />
        <el-date-picker v-model="range" type="datetimerange" start-placeholder="开始时间" end-placeholder="结束时间" :shortcuts="shortcuts" />
        <div class="divider"/>
        <span class="lbl">离线阈值</span>
        <el-input-number v-model="offlineValue" :min="1" :max="3600" :step="1" />
        <el-select v-model="offlineUnit" style="width:110px">
          <el-option label="sec" value="s" />
          <el-option label="min" value="m" />
          <el-option label="hour" value="h" />
        </el-select>
        <div class="spacer"/>
        <el-button @click="refresh" :loading="loading">刷新</el-button>
        <el-button type="primary" @click="exportCSV">导出CSV</el-button>
      </div>
      <el-table :data="rows" height="400" stripe v-loading="loading">
        <el-table-column prop="timestamp" label="时间" width="200">
          <template #default="{ row }">{{ formatTime(row.timestamp) }}</template>
        </el-table-column>
        <el-table-column prop="server_id" label="服务" width="120"/>
        <el-table-column prop="device_id" label="设备" width="140"/>
        <el-table-column prop="name" label="名称" min-width="200"/>
        <el-table-column prop="value" label="数值" width="140"/>
        <el-table-column prop="unit" label="单位" width="100"/>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" @click="addSeries(row.name)">加入趋势</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :page-size="size"
          :total="total"
          :current-page="page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-card>
      <template #header>
        <div class="card-header">历史趋势</div>
      </template>
      <div class="trend-tools">
        <el-input v-model="trendInput" placeholder="输入名称并回车添加" style="width:260px" @keyup.enter.native="onAddTrendByInput" />
        <div class="spacer"/>
        <el-button size="small" @click="clearSeries">清空</el-button>
      </div>
      <EChart :option="trendOption" :height="360" />
    </el-card>

    <div class="grid">
      <el-card>
        <template #header>
          <div class="card-header">状态分布</div>
        </template>
        <EChart :option="pieOption" :height="320" :onEvents="{ click: onPieClick }" />
      </el-card>
      <el-card>
        <template #header>
          <div class="card-header">关键数据对比</div>
        </template>
        <div class="bar-tools">
          <el-input v-model="barPrefix" placeholder="名称前缀过滤" clearable style="width:220px" />
          <el-button size="small" @click="loadBar">加载</el-button>
        </div>
        <EChart :option="barOption" :height="320" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getKpis, getStatusDistribution, getKeyComparison } from '../api/analysis'
import { queryPointsPaged, listPointValues, latestPoints } from '../api/db'
import EChart from '../components/EChart.vue'

// Default to last 30 minutes in UTC+8 timezone
const now = new Date()
const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
const range = ref<[Date, Date] | null>([thirtyMinutesAgo, now])
const query = ref('')
const rows = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(20)
const total = ref(0)
const kpis = ref<any>({ total_points: 0, fluctuating_points_5m: 0, alert_offline_points: 0, connection_status: '-' })
const offlineValue = ref(180)
const offlineUnit = ref<'s'|'m'|'h'>('m')
const tableMode = ref<'paged'|'latest'>('paged')
const statusFilter = ref<'all'|'offline'|'normal'>('all')

const shortcuts = [
  { text: '今天', value: () => { const s=new Date(); s.setHours(0,0,0,0); return [s,new Date()] } },
  { text: '最近30天', value: () => { const e=new Date(); const s=new Date(e.getTime()-30*24*3600*1000); return [s,e] } },
]

function fmtRFC3339(d: Date){ return d.toISOString() }
function formatTime(s: string){ try{ return new Date(s).toLocaleString() }catch{ return s } }

function buildOfflineThreshold(){ return `${offlineValue.value}${offlineUnit.value}` }
async function loadKpis(){ const { data } = await getKpis({ offline_threshold: buildOfflineThreshold() }); kpis.value = data }
async function loadTable(){
  loading.value = true
  try{
    if (tableMode.value === 'paged' && statusFilter.value === 'all') {
      const params: any = { page: page.value, size: size.value }
      if (query.value) params.name = query.value
      if (range.value){ params.start = fmtRFC3339(range.value[0]); params.end = fmtRFC3339(range.value[1]) }
      const { data } = await queryPointsPaged(params)
      rows.value = data.rows
      total.value = data.total
    } else {
      // latest mode with optional offline/normal filter
      const { data } = await latestPoints()
      const now = Date.now()
      const th = parseDurationMs(buildOfflineThreshold())
      const list = (data as any[]).map(r=>({
        server_id: r.server_id, device_id: r.device_id, name: r.name, unit: r.unit, value: r.value, timestamp: r.timestamp
      }))
      const filtered = list.filter(r => {
        const ts = new Date(r.timestamp).getTime()
        const isOffline = now - ts > th
        if (statusFilter.value === 'offline') return isOffline
        if (statusFilter.value === 'normal') return !isOffline
        return true
      })
      rows.value = filtered
      total.value = filtered.length
    }
  } finally { loading.value = false }
}

async function refresh(){ await Promise.all([loadKpis(), loadTable(), loadPie(), loadBar(), loadTrend()]) }
function onPageChange(p: number){ page.value = p; loadTable() }
function exportCSV(){
  const header = ['时间','服务','设备','名称','数值','单位']
  const data = rows.value.map((r:any)=>[formatTime(r.timestamp), r.server_id, r.device_id, r.name, r.value, r.unit])
  const csv = [header, ...data].map(r=>r.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(',')).join('\n')
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download='analysis_records.csv'; a.click(); URL.revokeObjectURL(url)
}

function setQuickRange(mins: number){
  const end = new Date()
  const start = new Date(end.getTime() - mins * 60000)
  range.value = [start, end]
}

onMounted(() => { setQuickRange(30); refresh() })

// --------- Charts ---------
// Trend (multi-series)
const trendInput = ref('')
const seriesNames = ref<string[]>([])
const trendData = ref<Record<string, { t: string[]; v: number[] }>>({})

function onAddTrendByInput(){ if (!trendInput.value) return; addSeries(trendInput.value); trendInput.value = '' }
function addSeries(name: string){ if (!seriesNames.value.includes(name)) { seriesNames.value.push(name); loadTrend() } }
function clearSeries(){ seriesNames.value = []; trendData.value = {} }

async function loadTrend(){
  if (seriesNames.value.length === 0) return
  const start = range.value ? fmtRFC3339(range.value[0]) : undefined
  const end = range.value ? fmtRFC3339(range.value[1]) : undefined
  const result: Record<string, { t: string[]; v: number[] }> = {}
  for (const name of seriesNames.value) {
    const { data } = await listPointValues({ name, start, end, asc: true })
    const t: string[] = []; const v: number[] = []
    ;(data as any[]).forEach((row:any) => { t.push(row.timestamp); v.push(row.value) })
    result[name] = { t, v }
  }
  trendData.value = result
}

const trendOption = computed(() => {
  const names = Object.keys(trendData.value)
  const x = names.length ? trendData.value[names[0]].t.map(s=>new Date(s).toLocaleTimeString()) : []
  const palette = ['#1f77b4','#ff7f0e','#2ca02c','#d62728','#9467bd','#8c564b','#e377c2','#7f7f7f','#bcbd22','#17becf']
  // compute dynamic y-range from all visible series
  let minV = Number.POSITIVE_INFINITY
  let maxV = Number.NEGATIVE_INFINITY
  names.forEach(n => {
    const arr = trendData.value[n].v || []
    for (const v of arr) {
      const num = typeof v === 'number' ? v : Number(v)
      if (!Number.isNaN(num)) { if (num < minV) minV = num; if (num > maxV) maxV = num }
    }
  })
  // guard when no data
  if (!isFinite(minV) || !isFinite(maxV)) { minV = 0; maxV = 1 }
  // adaptive padding
  const span = maxV - minV
  let yMin: number
  let yMax: number
  if (span <= 1 && maxV <= 1 && minV >= 0) {
    // small-range optimization for 0-1 data
    const pad = Math.max(0.05, span * 0.2)
    yMin = Math.max(0, minV - pad)
    yMax = maxV + pad
  } else {
    // general case: proportional padding with +/-50 fallback
    const pad = Math.max(10, span * 0.1)
    yMin = minV - pad
    yMax = maxV + pad
  }
  if (yMax <= yMin) { yMax = yMin + 1 }

  return {
    backgroundColor: 'transparent',
    color: palette,
    tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
    legend: { 
      data: names,
      show: true,
      top: 8,
      left: 'center',
      textStyle: { color: '#e2e8f0' }
    },
    grid: { left: 40, right: 16, top: 48, bottom: 32 },
    xAxis: {
      type: 'category', data: x,
      axisLine: { lineStyle: { color: '#334155' } },
      axisLabel: { color: '#475569' },
      splitLine: { show: false },
      splitArea: { show: false }
    },
    yAxis: {
      type: 'value',
      min: yMin,
      max: yMax,
      axisLine: { lineStyle: { color: '#334155' } },
      splitLine: { show: false },
      axisLabel: { color: '#475569' },
      splitArea: { show: false }
    },
    series: names.map((n, idx) => ({
      name: n,
      type: 'line',
      data: trendData.value[n].v,
      smooth: true,
      showSymbol: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2.5,
        color: palette[idx % palette.length],
        opacity: 1
      },
      // explicitly disable area fill
      areaStyle: null,
      markArea: null,
      markPoint: {
        symbol: 'circle',
        symbolSize: 18,
        itemStyle: { color: palette[idx % palette.length], borderWidth: 0 },
        label: {
          show: true,
          color: '#fff',
          fontWeight: 600,
          fontSize: 11,
          padding: [2, 5],
          backgroundColor: palette[idx % palette.length],
          borderRadius: 8,
          formatter: (p: any) => (p && p.value != null ? String(p.value) : '')
        },
        data: [{ type: 'max', name: 'max' }, { type: 'min', name: 'min' }]
      },
      itemStyle: { color: palette[idx % palette.length] },
      emphasis: { focus: 'series', itemStyle: { borderWidth: 2 } }
    }))
  }
})

// Status Pie
const pieData = ref<{ name: string; value: number }[]>([])
async function loadPie(){
  const { data } = await getStatusDistribution({ offline_threshold: buildOfflineThreshold() })
  pieData.value = [
    { name: '正常', value: (data as any).normal || 0 },
    { name: '离线', value: (data as any).offline || 0 },
    // { name: '告警', value: (data as any).alert || 0 },
  ]
}
function onPieClick(params: any){
  if (params?.name === '离线') { statusFilter.value = 'offline'; tableMode.value = 'latest' }
  else if (params?.name === '正常') { statusFilter.value = 'normal'; tableMode.value = 'latest' }
  else { statusFilter.value = 'all'; tableMode.value = 'paged' }
  page.value = 1; loadTable()
}
const pieOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: { top: 'bottom' },
  series: [{
    name: '状态分布', type: 'pie', radius: ['35%','70%'],
    data: pieData.value,
    label: { formatter: '{b}: {c} ({d}%)' }
  }]
}))

// Key Comparison Bar
const barPrefix = ref('')
const barRows = ref<{ name: string; value: number; unit: string }[]>([])
async function loadBar(){ const { data } = await getKeyComparison({ prefix: barPrefix.value || undefined, limit: 20 }); barRows.value = data as any[] }
const barOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  xAxis: { type: 'category', data: barRows.value.map(r=>r.name) },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: barRows.value.map(r=>r.value) }]
}))

// helpers
function parseDurationMs(s: string){
  const m = s.match(/^(\d+)([smh])$/)
  if (!m) return 180000
  const n = parseInt(m[1],10); const u = m[2]
  if (u==='s') return n*1000
  if (u==='m') return n*60000
  if (u==='h') return n*3600000
  return 180000
}
</script>

<style scoped>
.page{ display:grid; gap:16px; }
.kpis{ display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; margin-bottom: 12px; }
.kpi{ display:flex; flex-direction:column; align-items:flex-start; justify-content:center; height:88px }
.kpi-title{ color:#64748b; font-size:12px }
.kpi-value{ font-size:28px; font-weight:700 }
.toolbar{ display:flex; align-items:center; gap:12px; margin-bottom:12px; }
.toolbar .spacer{ flex:1 }
:deep(.el-divider){ margin: 0 8px }
.divider{ width:1px; height:24px; background:#e5e7eb }
.lbl{ color:#64748b; font-size:12px }
:deep(.el-table__row){ height:44px }
.pager{ display:flex; justify-content:flex-end; margin-top:12px }
.card-header{ font-weight:700 }
.trend-tools, .bar-tools{ display:flex; gap:8px; align-items:center; margin-bottom:8px }
.grid{ display:grid; grid-template-columns: 1fr 1fr; gap:16px }
</style>
