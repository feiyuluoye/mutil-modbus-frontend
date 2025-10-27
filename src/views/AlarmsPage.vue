<template>
  <div class="alarms-page">
    <el-card>
      <template #header>
        <div class="card-header">
          <span class="title">Alarm Rules</span>
          <div class="tools">
            <el-input v-model="query" placeholder="Search by name or point" clearable @input="onSearchInput" style="width: 280px;" />
            <el-select v-model="severity" placeholder="Severity" clearable style="width: 160px;">
              <el-option label="Info" value="info" />
              <el-option label="Warning" value="warning" />
              <el-option label="Critical" value="critical" />
              <el-option label="Emergency" value="emergency" />
            </el-select>
            <el-select v-model="enabled" placeholder="Enabled" clearable style="width: 140px;">
              <el-option label="Enabled" :value="true" />
              <el-option label="Disabled" :value="false" />
            </el-select>
            <el-button type="primary" @click="openCreate">+ New Rule</el-button>
          </div>
        </div>
      </template>

      <el-table :data="store.rows" v-loading="store.loading" height="560">
        <el-table-column prop="name" label="Name" min-width="180" />
        <el-table-column label="Target" min-width="220">
          <template #default="{ row }">
            <span>{{ row.target?.server_id }}/{{ row.target?.device_id }} · {{ row.target?.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Condition" min-width="220">
          <template #default="{ row }">
            <span>{{ renderCondition(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="Severity" width="120">
          <template #default="{ row }">
            <el-tag :type="severityTag(row.severity)">{{ row.severity }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Enabled" width="110">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column prop="last_triggered_at" label="Last Triggered" width="180" />
        <el-table-column label="Actions" width="160">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">Edit</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">Delete</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :page-size="size"
          :total="store.total"
          :current-page="page"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="formVisible" :title="formMode === 'create' ? 'New Rule' : 'Edit Rule'" width="720px" destroy-on-close>
      <AlarmForm :mode="formMode" :initialValue="editing" @submit="onSubmit" @cancel="() => (formVisible = false)" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import AlarmForm from '../components/AlarmForm.vue'
import { type AlarmRule } from '../api/alarms'
import { useAlarmStore } from '../stores/alarm'

const store = useAlarmStore()
const list = store.$state.rows as unknown as AlarmRule[]
const loading = store.$state.loading
const page = ref(store.page)
const size = ref(store.size)
const total = ref(store.total)

const query = ref(store.filters.query || '')
const severity = ref(store.filters.severity)
const enabled = ref(store.filters.enabled)
let searchTimer: number | undefined

function bindAndFetch() {
  store.page = page.value
  store.size = size.value
  store.filters.query = query.value || ''
  store.filters.severity = severity.value as any
  store.filters.enabled = enabled.value
  store.fetchList()
}

function onSearchInput() {
  window.clearTimeout(searchTimer)
  searchTimer = window.setTimeout(() => {
    page.value = 1
    bindAndFetch()
  }, 300)
}

watch([severity, enabled], () => { page.value = 1; bindAndFetch() })

function severityTag(s?: string) {
  switch (s) {
    case 'warning': return 'warning'
    case 'critical': return 'danger'
    case 'emergency': return 'danger'
    default: return 'primary'
  }
}

function renderCondition(r: AlarmRule) {
  const t = r.trigger
  if (!t) return '-'
  if (t.type === 'threshold') {
    if (t.operator === 'between') return `Value between ${t.value1} & ${t.value2}`
    if (t.operator === 'outside') return `Value outside ${t.value1} & ${t.value2}`
    return `Value ${t.operator} ${t.value1}`
  }
  if (t.type === 'state') {
    return `Value ${t.operator} ${t.value1}`
  }
  if (t.type === 'offline') {
    const d = t.offline_duration
    return d ? `No updates within ${d.value} ${d.unit}` : 'Offline'
  }
  return '-'
}

const formVisible = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editing = ref<AlarmRule | null>(null)

function openCreate() { formMode.value = 'create'; editing.value = null; formVisible.value = true }
function openEdit(row: AlarmRule) { formMode.value = 'edit'; editing.value = row; formVisible.value = true }

async function onDelete(row: AlarmRule) {
  await ElMessageBox.confirm(`确定删除规则 “${row.name}” 吗？此操作不可撤销。`, '删除确认', { type: 'warning' })
  try {
    await store.remove(row.id!)
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || 'Delete failed')
  }
}

async function toggleEnabled(row: AlarmRule) {
  try {
    await store.setEnabled(row.id!, !row.enabled)
    row.enabled = !row.enabled
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || 'Operation failed')
  }
}

async function onSubmit(payload: AlarmRule) {
  try {
    if (formMode.value === 'create') {
      await store.create(payload)
    } else if (formMode.value === 'edit' && editing.value?.id) {
      await store.update(editing.value.id, payload)
    }
  } catch (e) {
    // errors are already messaged in store
  } finally {
    formVisible.value = false
    bindAndFetch()
  }
}

function onPageChange(p: number) {
  page.value = p
  bindAndFetch()
}

bindAndFetch()
</script>

<style scoped>
.alarms-page { padding: 20px; }
.card-header { display: flex; align-items: center; justify-content: space-between; }
.title { font-weight: 700; }
.tools { display: flex; gap: 12px; align-items: center; }
.pager { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
