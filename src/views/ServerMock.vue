<template>
  <div class="page">
    <el-card>
      <div class="header">
        <div class="title">
          <span>Server Mock</span>
          <el-tag v-if="running" type="success" class="ml8">已启动</el-tag>
          <el-tag v-else type="info" class="ml8">未启动</el-tag>
        </div>
        <div class="actions">
          <el-button @click="goBack">返回</el-button>
          <el-button type="success" :disabled="running || loading" :loading="loading" @click="start">启动</el-button>
          <el-button type="warning" :disabled="!running || loading" :loading="loading" @click="stop">停止</el-button>
        </div>
      </div>

      <el-descriptions title="Server 信息" :column="2" border>
        <el-descriptions-item label="Server ID">{{ server?.ServerID }}</el-descriptions-item>
        <el-descriptions-item label="名称">{{ server?.ServerName }}</el-descriptions-item>
        <el-descriptions-item label="协议">{{ server?.Protocol }}</el-descriptions-item>
        <el-descriptions-item label="启用"><el-tag :type="server?.Enabled ? 'success' : 'info'">{{ server?.Enabled ? 'ON' : 'OFF' }}</el-tag></el-descriptions-item>
        <template v-if="isRTU(server?.Protocol)">
          <el-descriptions-item label="串口">{{ server?.Path || '-' }}</el-descriptions-item>
          <el-descriptions-item label="波特率">{{ server?.BaudRate || 9600 }}</el-descriptions-item>
          <el-descriptions-item label="数据位">{{ server?.DataBits || 8 }}</el-descriptions-item>
          <el-descriptions-item label="停止位">{{ server?.StopBits || 1 }}</el-descriptions-item>
          <el-descriptions-item label="校验位">{{ server?.Parity || 'N' }}</el-descriptions-item>
        </template>
        <template v-else>
          <el-descriptions-item label="Host">{{ server?.Host || '-' }}</el-descriptions-item>
          <el-descriptions-item label="Port">{{ server?.Port || 502 }}</el-descriptions-item>
        </template>
      </el-descriptions>

      <el-card class="mt16" shadow="never">
        <template #header>
          <div class="card-header">Mock 配置（CSV 绑定）</div>
        </template>
        <div class="mock-config">
          <div class="mock-row">
            <span class="label">当前 CSV：</span>
            <span v-if="mockConfig.mock_csv_path" class="value">{{ mockConfig.mock_csv_path }}</span>
            <span v-else class="muted">未绑定，请上传 CSV 文件</span>
          </div>
          <div class="mock-row">
            <span class="label">更新间隔：</span>
            <el-input
              v-model="mockUpdateInterval"
              placeholder="例如 3s 或 5s"
              size="small"
              style="width: 160px"
            />
          </div>
          <div class="mock-row">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              :on-change="onFileChange"
              accept=".csv"
            >
              <el-button type="primary" size="small">选择 CSV 文件</el-button>
            </el-upload>
            <span class="ml8 muted" v-if="selectedFileName">{{ selectedFileName }}</span>
            <el-button
              class="ml8"
              type="success"
              size="small"
              :disabled="!selectedFile || loadingUpload"
              :loading="loadingUpload"
              @click="uploadCSV"
            >
              上传并绑定
            </el-button>
          </div>
        </div>
      </el-card>

      <el-card class="mt16" shadow="never">
        <template #header>
          <div class="card-header">运行状态与进程信息</div>
        </template>
        <div v-if="execState">
          <pre class="proc">
{{ formatJSON(execState) }}
          </pre>
        </div>
        <div v-else class="muted">暂无运行信息</div>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getServer } from '../api/db'
import { enableServer, disableServer, getExecState, getMockConfig, uploadMockCSV } from '../api/runtime'
import { useAppStore } from '../stores/app'

const route = useRoute()
const router = useRouter()
const server = ref<any>(null)
const loading = ref(false)
const timer = ref<number | null>(null)
const execState = ref<any>(null)
const mockConfig = ref<any>({})
const mockUpdateInterval = ref<string>('')
const selectedFile = ref<File | null>(null)
const selectedFileName = ref('')
const loadingUpload = ref(false)

const sid = computed(() => String(route.params.id || ''))

const running = computed(() => !!execState.value?.running)

function isRTU(protocol?: string) {
  if (!protocol) return false
  const p = protocol.toLowerCase()
  return p.includes('rtu') || p === 'rtu'
}

function formatJSON(obj: any) {
  try { return JSON.stringify(obj, null, 2) } catch { return String(obj) }
}

async function fetchData() {
  const res = await getServer(sid.value)
  server.value = res.data?.data || res.data
}

async function fetchMockConfig() {
  const res = await getMockConfig(sid.value)
  mockConfig.value = res.data || {}
  if (mockConfig.value.mock_update_interval) {
    mockUpdateInterval.value = mockConfig.value.mock_update_interval
  }
}

async function refreshExecState() {
  const res = await getExecState(sid.value)
  execState.value = res.data || {}
}

function onFileChange(file: any) {
  selectedFile.value = file?.raw || null
  selectedFileName.value = file?.name || ''
}

async function uploadCSV() {
  if (!selectedFile.value) return
  loadingUpload.value = true
  try {
    const form = new FormData()
    form.append('file', selectedFile.value)
    if (mockUpdateInterval.value) form.append('update_interval', mockUpdateInterval.value)
    const res = await uploadMockCSV(sid.value, form)
    mockConfig.value = res.data || {}
    if (mockConfig.value.mock_update_interval) {
      mockUpdateInterval.value = mockConfig.value.mock_update_interval
    }
  } finally {
    loadingUpload.value = false
  }
}

async function start() {
  loading.value = true
  try {
    // 可选：简单校验一下是否已绑定 CSV
    if (!mockConfig.value.mock_csv_path) {
      // eslint-disable-next-line no-console
      console.warn('当前 server 未绑定 mock CSV，启动可能会失败')
    }
    await enableServer(sid.value)
    await refreshExecState()
  } finally { loading.value = false }
}

async function stop() {
  loading.value = true
  try {
    await disableServer(sid.value)
    await refreshExecState()
  } finally { loading.value = false }
}

function goBack() { router.back() }

onMounted(async () => {
  await fetchData()
  await fetchMockConfig()
  await refreshExecState()
  // poll exec_state every 2s
  timer.value = window.setInterval(refreshExecState, 2000)
})

onUnmounted(() => { if (timer.value) window.clearInterval(timer.value) })
</script>

<style scoped>
.header { display: flex; align-items: center; justify-content: space-between; }
.title { font-size: 16px; font-weight: 600; display:flex; align-items:center; }
.ml8 { margin-left: 8px; }
.mt16 { margin-top: 16px; }
.card-header { font-weight: 600; }
.proc { background: #0b1020; color: #cde1ff; padding: 12px; border-radius: 6px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; overflow: auto; }
.muted { color: #888; }
.mock-config { font-size: 13px; }
.mock-row { margin-bottom: 8px; display: flex; align-items: center; }
.label { width: 80px; color: #666; }
.value { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
</style>
