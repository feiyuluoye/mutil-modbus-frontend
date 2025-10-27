<template>
  <el-dialog v-model="visibleLocal" title="选择点位" width="820px" @close="onClose">
    <div class="toolbar">
      <el-input v-model="filters.name" placeholder="按名称搜索" clearable @input="debouncedFetch" style="width: 220px;" />
      <el-input v-model="filters.server_id" placeholder="Server ID" clearable @input="debouncedFetch" style="width: 160px;" />
      <el-input v-model="filters.device_id" placeholder="Device ID" clearable @input="debouncedFetch" style="width: 160px;" />
    </div>

    <el-table :data="rows" v-loading="loading" height="420" @row-dblclick="onPick">
      <el-table-column prop="server_id" label="Server" width="160" />
      <el-table-column prop="device_id" label="Device" width="160" />
      <el-table-column prop="name" label="Point Name" min-width="200" />
      <el-table-column prop="address" label="Address" width="120" />
      <el-table-column label="Action" width="120">
        <template #default="{ row }">
          <el-button size="small" type="primary" @click="onPick(row)">选择</el-button>
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

    <template #footer>
      <el-button @click="onClose">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { queryPointPropertiesPaged } from '../api/db'

interface PointRow { server_id: string; device_id: string; name: string; address?: number; hash_id: string }

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'select', v: PointRow): void }>()

const visibleLocal = ref(false)
watch(() => props.visible, v => { visibleLocal.value = v })

const filters = ref({ name: '', server_id: '', device_id: '' })
const rows = ref<PointRow[]>([])
const loading = ref(false)
const page = ref(1)
const size = ref(10)
const total = ref(0)
let timer: number | undefined

function debouncedFetch() {
  window.clearTimeout(timer)
  timer = window.setTimeout(() => { page.value = 1; fetchRows() }, 300)
}

async function fetchRows() {
  loading.value = true
  try {
    const { data } = await queryPointPropertiesPaged({
      name: filters.value.name || undefined,
      server_id: filters.value.server_id || undefined,
      device_id: filters.value.device_id || undefined,
      page: page.value,
      size: size.value,
    })
    rows.value = (data?.rows || []).map((r: any) => ({
      server_id: r.ServerID,
      device_id: r.DeviceID,
      name: r.Name,
      address: r.Address,
      hash_id: r.HashID,
    }))
    total.value = data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.error || '加载失败')
  } finally {
    loading.value = false
  }
}

function onPick(row: PointRow) {
  emit('select', row)
  onClose()
}

function onClose() {
  emit('close')
}

function onPageChange(p: number) {
  page.value = p
  fetchRows()
}

// initial
fetchRows()
</script>

<style scoped>
.toolbar { display: flex; gap: 12px; margin-bottom: 12px; }
.pager { display: flex; justify-content: flex-end; margin-top: 8px; }
</style>
