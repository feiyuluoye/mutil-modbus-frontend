<template>
  <div class="import-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">CSV Import</span>
          <span class="subtitle">Batch import servers, devices, and point properties</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card">
        <!-- Servers Import -->
        <el-tab-pane label="Servers" name="servers">
          <div class="upload-section">
            <div class="instructions">
              <h4>CSV Format</h4>
              <p>Required columns: Server_ID, Server_Name, Protocol, Host, Port</p>
              <p>Optional columns: Path, Baud_Rate, Data_Bits, Stop_Bits, Parity, Timeout, Retry_Count, Enabled</p>
              <p class="note">Protocol: modbus-tcp or modbus-rtu</p>
            </div>
            
            <el-upload
              ref="serversUpload"
              :auto-upload="false"
              :limit="1"
              :on-change="handleServersChange"
              :on-exceed="handleExceed"
              accept=".csv"
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Drop CSV file here or <em>click to upload</em>
              </div>
            </el-upload>

            <div class="actions">
              <el-button type="primary" @click="uploadServers" :loading="uploading.servers" :disabled="!serversFile">
                Import Servers
              </el-button>
              <el-button @click="clearServers">Clear</el-button>
              <el-button @click="downloadServersTemplate" plain>Download Template</el-button>
            </div>

            <div v-if="serversPreview.rows.length" class="preview">
              <h4>Preview (first 100 rows)</h4>
              <el-table :data="serversPreview.rows.slice(0, 100)" height="360">
                <el-table-column v-for="h in serversPreview.headers" :key="h" :prop="h" :label="h" show-overflow-tooltip />
              </el-table>
            </div>

            <div v-if="results.servers" class="result">
              <el-alert
                :title="results.servers.message"
                :type="results.servers.success ? 'success' : 'warning'"
                :closable="false"
              >
                <template #default>
                  <div class="result-details">
                    <p>Created: {{ results.servers.servers_created }}</p>
                    <p>Updated: {{ results.servers.servers_updated }}</p>
                    <div v-if="results.servers.errors && results.servers.errors.length > 0" class="errors">
                      <p><strong>Errors:</strong></p>
                      <ul>
                        <li v-for="(err, idx) in results.servers.errors" :key="idx">{{ err }}</li>
                      </ul>
                    </div>
                  </div>
                </template>
              </el-alert>
            </div>
          </div>
        </el-tab-pane>

        <!-- Devices Import -->
        <el-tab-pane label="Devices" name="devices">
          <div class="upload-section">
            <div class="instructions">
              <h4>CSV Format</h4>
              <p>Required columns: Server_ID, Device_ID</p>
              <p>Optional columns: Vendor, Slave_ID, Poll_Interval</p>
            </div>
            
            <el-upload
              ref="devicesUpload"
              :auto-upload="false"
              :limit="1"
              :on-change="handleDevicesChange"
              :on-exceed="handleExceed"
              accept=".csv"
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Drop CSV file here or <em>click to upload</em>
              </div>
            </el-upload>

            <div class="actions">
              <el-button type="primary" @click="uploadDevices" :loading="uploading.devices" :disabled="!devicesFile">
                Import Devices
              </el-button>
              <el-button @click="clearDevices">Clear</el-button>
              <el-button @click="downloadDevicesTemplate" plain>Download Template</el-button>
            </div>

            <div v-if="devicesPreview.rows.length" class="preview">
              <h4>Preview (first 100 rows)</h4>
              <el-table :data="devicesPreview.rows.slice(0, 100)" height="360">
                <el-table-column v-for="h in devicesPreview.headers" :key="h" :prop="h" :label="h" show-overflow-tooltip />
              </el-table>
            </div>

            <div v-if="results.devices" class="result">
              <el-alert
                :title="results.devices.message"
                :type="results.devices.success ? 'success' : 'warning'"
                :closable="false"
              >
                <template #default>
                  <div class="result-details">
                    <p>Created: {{ results.devices.devices_created }}</p>
                    <p>Updated: {{ results.devices.devices_updated }}</p>
                    <div v-if="results.devices.errors && results.devices.errors.length > 0" class="errors">
                      <p><strong>Errors:</strong></p>
                      <ul>
                        <li v-for="(err, idx) in results.devices.errors" :key="idx">{{ err }}</li>
                      </ul>
                    </div>
                  </div>
                </template>
              </el-alert>
            </div>
          </div>
        </el-tab-pane>

        <!-- Points Import -->
        <el-tab-pane label="Points" name="points">
          <div class="upload-section">
            <div class="instructions">
              <h4>CSV Format</h4>
              <p>Required columns: Server_ID, Device_ID, Point_Name, Address</p>
              <p>Optional columns: Register_Type, Data_Type, Byte_Order, Scale, Offset, Unit</p>
            </div>
            
            <el-upload
              ref="pointsUpload"
              :auto-upload="false"
              :limit="1"
              :on-change="handlePointsChange"
              :on-exceed="handleExceed"
              accept=".csv"
              drag
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                Drop CSV file here or <em>click to upload</em>
              </div>
            </el-upload>

            <div class="actions">
              <el-button type="primary" @click="uploadPoints" :loading="uploading.points" :disabled="!pointsFile">
                Import Points
              </el-button>
              <el-button @click="clearPoints">Clear</el-button>
              <el-button @click="downloadPointsTemplate" plain>Download Template</el-button>
            </div>

            <div v-if="pointsPreview.rows.length" class="preview">
              <h4>Preview (first 100 rows)</h4>
              <el-table :data="pointsPreview.rows.slice(0, 100)" height="360">
                <el-table-column v-for="h in pointsPreview.headers" :key="h" :prop="h" :label="h" show-overflow-tooltip />
              </el-table>
            </div>

            <div v-if="results.points" class="result">
              <el-alert
                :title="results.points.message"
                :type="results.points.success ? 'success' : 'warning'"
                :closable="false"
              >
                <template #default>
                  <div class="result-details">
                    <p>Created: {{ results.points.points_created }}</p>
                    <p>Updated: {{ results.points.points_updated }}</p>
                    <div v-if="results.points.errors && results.points.errors.length > 0" class="errors">
                      <p><strong>Errors:</strong></p>
                      <ul>
                        <li v-for="(err, idx) in results.points.errors" :key="idx">{{ err }}</li>
                      </ul>
                    </div>
                  </div>
                </template>
              </el-alert>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { uploadServersCSV, uploadDevicesCSV, uploadPointsCSV, type CSVImportResult } from '../api/import'
import type { UploadFile, UploadInstance } from 'element-plus'

const activeTab = ref('servers')

const serversFile = ref<File | null>(null)
const devicesFile = ref<File | null>(null)
const pointsFile = ref<File | null>(null)

const serversUpload = ref<UploadInstance>()
const devicesUpload = ref<UploadInstance>()
const pointsUpload = ref<UploadInstance>()

const uploading = ref({
  servers: false,
  devices: false,
  points: false
})

const serversPreview = ref<{ headers: string[]; rows: any[] }>({ headers: [], rows: [] })
const devicesPreview = ref<{ headers: string[]; rows: any[] }>({ headers: [], rows: [] })
const pointsPreview = ref<{ headers: string[]; rows: any[] }>({ headers: [], rows: [] })

const results = ref<{
  servers: CSVImportResult | null
  devices: CSVImportResult | null
  points: CSVImportResult | null
}>({
  servers: null,
  devices: null,
  points: null
})

function parseCSVFile(file: File): Promise<{ headers: string[]; rows: any[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.onload = () => {
      try {
        const text = String(reader.result || '')
        const { headers, rows } = simpleCSVParse(text)
        resolve({ headers, rows })
      } catch (e) {
        reject(e)
      }
    }
    reader.readAsText(file)
  })
}

function simpleCSVParse(text: string): { headers: string[]; rows: any[] } {
  // minimal CSV parser supporting quoted fields and commas
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(l => l.length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }
  const parseLine = (line: string): string[] => {
    const out: string[] = []
    let cur = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { cur += '"'; i++ } else { inQuotes = false }
        } else { cur += ch }
      } else {
        if (ch === ',') { out.push(cur); cur = '' }
        else if (ch === '"') { inQuotes = true }
        else { cur += ch }
      }
    }
    out.push(cur)
    return out.map(s => s.trim())
  }
  const headers = parseLine(lines[0])
  const rows = [] as any[]
  for (let i = 1; i < lines.length; i++) {
    const cols = parseLine(lines[i])
    if (cols.length === 1 && cols[0] === '') continue
    const obj: any = {}
    headers.forEach((h, idx) => { obj[h] = cols[idx] ?? '' })
    rows.push(obj)
  }
  return { headers, rows }
}

function handleServersChange(file: UploadFile) {
  serversFile.value = file.raw || null
  results.value.servers = null
  serversPreview.value = { headers: [], rows: [] }
  if (serversFile.value) {
    parseCSVFile(serversFile.value).then(res => { serversPreview.value = res }).catch(() => {
      ElMessage.warning('Failed to parse CSV preview')
    })
  }
}

function handleDevicesChange(file: UploadFile) {
  devicesFile.value = file.raw || null
  results.value.devices = null
  devicesPreview.value = { headers: [], rows: [] }
  if (devicesFile.value) {
    parseCSVFile(devicesFile.value).then(res => { devicesPreview.value = res }).catch(() => {
      ElMessage.warning('Failed to parse CSV preview')
    })
  }
}

function handlePointsChange(file: UploadFile) {
  pointsFile.value = file.raw || null
  results.value.points = null
  pointsPreview.value = { headers: [], rows: [] }
  if (pointsFile.value) {
    parseCSVFile(pointsFile.value).then(res => { pointsPreview.value = res }).catch(() => {
      ElMessage.warning('Failed to parse CSV preview')
    })
  }
}

function handleExceed() {
  ElMessage.warning('Only one file can be uploaded at a time')
}

async function uploadServers() {
  if (!serversFile.value) return
  
  uploading.value.servers = true
  try {
    const result = await uploadServersCSV(serversFile.value)
    results.value.servers = result
    if (result.success) {
      ElMessage.success('Servers imported successfully')
    } else {
      ElMessage.warning('Import completed with errors')
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error || 'Upload failed')
  } finally {
    uploading.value.servers = false
  }
}

async function uploadDevices() {
  if (!devicesFile.value) return
  
  uploading.value.devices = true
  try {
    const result = await uploadDevicesCSV(devicesFile.value)
    results.value.devices = result
    if (result.success) {
      ElMessage.success('Devices imported successfully')
    } else {
      ElMessage.warning('Import completed with errors')
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error || 'Upload failed')
  } finally {
    uploading.value.devices = false
  }
}

async function uploadPoints() {
  if (!pointsFile.value) return
  
  uploading.value.points = true
  try {
    const result = await uploadPointsCSV(pointsFile.value)
    results.value.points = result
    if (result.success) {
      ElMessage.success('Points imported successfully')
    } else {
      ElMessage.warning('Import completed with errors')
    }
  } catch (err: any) {
    ElMessage.error(err.response?.data?.error || 'Upload failed')
  } finally {
    uploading.value.points = false
  }
}

function clearServers() {
  serversUpload.value?.clearFiles()
  serversFile.value = null
  results.value.servers = null
  serversPreview.value = { headers: [], rows: [] }
}

function clearDevices() {
  devicesUpload.value?.clearFiles()
  devicesFile.value = null
  results.value.devices = null
  devicesPreview.value = { headers: [], rows: [] }
}

function clearPoints() {
  pointsUpload.value?.clearFiles()
  pointsFile.value = null
  results.value.points = null
  pointsPreview.value = { headers: [], rows: [] }
}

function downloadCSVTemplate(filename: string, headers: string[]) {
  const csv = headers.join(',') + '\n'
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function downloadServersTemplate() {
  downloadCSVTemplate('servers_template.csv', [
    'Server_ID','Server_Name','Protocol','Host','Port',
    'Path','Baud_Rate','Data_Bits','Stop_Bits','Parity',
    'Timeout','Retry_Count','Enabled','Type'
  ])
}

function downloadDevicesTemplate() {
  downloadCSVTemplate('devices_template.csv', [
    'Server_ID','Device_ID','Vendor','Slave_ID','Poll_Interval'
  ])
}

function downloadPointsTemplate() {
  downloadCSVTemplate('points_template.csv', [
    'Server_ID','Device_ID','Point_Name','Address','Register_Type','Data_Type','Byte_Order','Scale','Offset','Unit'
  ])
}
</script>

<style scoped>
.import-page {
  padding: 20px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 18px;
  font-weight: 700;
  color: #e2e8f0;
}

.subtitle {
  font-size: 14px;
  color: #94a3b8;
}

.upload-section {
  padding: 20px;
}

.instructions {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.instructions h4 {
  margin: 0 0 12px 0;
  color: #60a5fa;
  font-size: 16px;
}

.instructions p {
  margin: 8px 0;
  color: #cbd5e1;
  font-size: 14px;
}

.instructions .note {
  color: #94a3b8;
  font-style: italic;
  font-size: 13px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.result {
  margin-top: 20px;
}

.result-details p {
  margin: 4px 0;
  color: #cbd5e1;
}

.errors {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.errors ul {
  margin: 8px 0;
  padding-left: 20px;
  max-height: 200px;
  overflow-y: auto;
}

.errors li {
  margin: 4px 0;
  color: #fca5a5;
  font-size: 13px;
}

:deep(.el-upload-dragger) {
  background: #1e293b;
  border: 2px dashed #475569;
  border-radius: 8px;
}

:deep(.el-upload-dragger:hover) {
  border-color: #60a5fa;
}

:deep(.el-icon--upload) {
  font-size: 48px;
  color: #60a5fa;
  margin-bottom: 16px;
}

:deep(.el-upload__text) {
  color: #cbd5e1;
}

:deep(.el-upload__text em) {
  color: #60a5fa;
  font-style: normal;
}
</style>
