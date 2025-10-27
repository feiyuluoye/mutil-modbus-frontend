<template>
  <div>
    <el-form :model="form" label-width="120px" :rules="rules" ref="formRef">
      <el-form-item label="Name" prop="name">
        <el-input v-model="form.name" placeholder="Rule name" />
      </el-form-item>
      <el-form-item label="Description">
        <el-input v-model="form.description" type="textarea" placeholder="Optional" />
      </el-form-item>
      <el-form-item label="Enabled">
        <el-switch v-model="form.enabled" />
      </el-form-item>

      <el-form-item label="Target Point" required>
        <div class="target">
          <div class="selected" v-if="form.target">
            {{ form.target.server_id }}/{{ form.target.device_id }} · {{ form.target.name }}
          </div>
          <el-button @click="openPointSelector">Select...</el-button>
        </div>
      </el-form-item>

      <el-form-item label="Trigger Type" prop="trigger.type">
        <el-select v-model="form.trigger.type" placeholder="Select type">
          <el-option label="Threshold" value="threshold" />
          <el-option label="State" value="state" />
          <el-option label="Offline" value="offline" />
        </el-select>
      </el-form-item>

      <template v-if="form.trigger.type === 'threshold'">
        <el-form-item label="Operator" prop="trigger.operator">
          <el-select v-model="form.trigger.operator">
            <el-option v-for="op in thresholdOps" :key="op" :label="op" :value="op" />
          </el-select>
        </el-form-item>
        <el-form-item label="Value 1" prop="trigger.value1">
          <el-input-number v-model="form.trigger.value1" :step="0.1" />
        </el-form-item>
        <el-form-item v-if="form.trigger.operator === 'between' || form.trigger.operator === 'outside'" label="Value 2" prop="trigger.value2">
          <el-input-number v-model="form.trigger.value2" :step="0.1" />
        </el-form-item>
      </template>

      <template v-else-if="form.trigger.type === 'state'">
        <el-form-item label="Operator" prop="trigger.operator">
          <el-select v-model="form.trigger.operator">
            <el-option label="==" value="==" />
            <el-option label="!=" value="!=" />
          </el-select>
        </el-form-item>
        <el-form-item label="State" prop="trigger.value1">
          <el-input-number v-model="form.trigger.value1" :min="0" :max="1" />
        </el-form-item>
      </template>

      <template v-else-if="form.trigger.type === 'offline'">
        <el-form-item label="No updates within">
          <el-input-number v-model="offlineValue" :min="1" />
          <el-select v-model="offlineUnit" style="margin-left:8px; width: 120px;">
            <el-option label="sec" value="sec" />
            <el-option label="min" value="min" />
            <el-option label="hour" value="hour" />
          </el-select>
        </el-form-item>
      </template>

      <el-form-item label="Delay">
        <el-switch v-model="form.trigger.delay.enabled" />
        <div v-if="form.trigger.delay.enabled" class="delay-wrap">
          <el-input-number v-model="form.trigger.delay.value" :min="1" />
          <el-select v-model="form.trigger.delay.unit" style="margin-left:8px; width: 120px;">
            <el-option label="sec" value="sec" />
            <el-option label="min" value="min" />
          </el-select>
        </div>
      </el-form-item>

      <el-form-item label="Severity" prop="severity">
        <el-select v-model="form.severity">
          <el-option label="Info" value="info" />
          <el-option label="Warning" value="warning" />
          <el-option label="Critical" value="critical" />
          <el-option label="Emergency" value="emergency" />
        </el-select>
      </el-form-item>

      <el-form-item label="Message" prop="message_template">
        <div class="msg-tools">
          <el-button size="small" @click="insertVar('${point_name}')">插入点位名</el-button>
          <el-button size="small" @click="insertVar('${current_value}')">插入当前值</el-button>
          <el-button size="small" @click="insertVar('${threshold}')">插入阈值</el-button>
        </div>
        <el-input v-model="form.message_template" type="textarea" :rows="3" placeholder="消息模板" />
      </el-form-item>

      <div class="actions">
        <el-button @click="$emit('cancel')">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </div>
    </el-form>

    <PointSelector :visible="pointSelectorVisible" @close="pointSelectorVisible = false" @select="onPointSelected" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { AlarmRule, AlarmTrigger, OfflineDuration } from '../api/alarms'
import PointSelector from './PointSelector.vue'

const props = defineProps<{ mode: 'create' | 'edit'; initialValue: AlarmRule | null }>()
const emit = defineEmits<{ (e: 'submit', v: AlarmRule): void; (e: 'cancel'): void }>()

const thresholdOps = ['>', '<', '>=', '<=', '==', '!=', 'between', 'outside']

const formRef = ref<FormInstance>()
const form = reactive<AlarmRule>(
  props.initialValue ?? {
    name: '',
    description: '',
    enabled: true,
    target: { server_id: '', device_id: '', name: '', hash_id: '' },
    trigger: { type: 'threshold', operator: '>', value1: 0, delay: { enabled: false, value: 5, unit: 'sec' }, offline_duration: { value: 5, unit: 'min' } },
    severity: 'warning',
    message_template: ''
  }
)

watch(() => props.initialValue, (v) => {
  if (v) {
    Object.assign(form, v)
    // ensure nested defaults exist with proper literal types
    const base: AlarmTrigger = {
      type: 'threshold',
      operator: '>',
      value1: 0,
      delay: { enabled: false, value: 5, unit: 'sec' },
      offline_duration: { value: 5, unit: 'min' }
    }
    form.trigger = Object.assign({}, base, form.trigger || {}) as AlarmTrigger
  }
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入规则名称', trigger: 'blur' }],
  severity: [{ required: true, message: '请选择告警级别', trigger: 'change' }],
  message_template: [{ required: true, message: '请输入消息', trigger: 'blur' }]
}

function insertVar(token: string) {
  form.message_template = (form.message_template || '') + token
}

function openPointSelector() {
  pointSelectorVisible.value = true
}

function onSubmit() {
  formRef.value?.validate((ok) => {
    if (!ok) return
    emit('submit', JSON.parse(JSON.stringify(form)))
  })
}

// Point selector wiring
const pointSelectorVisible = ref(false)
function onPointSelected(row: { server_id: string; device_id: string; name: string; hash_id: string }) {
  form.target = {
    server_id: row.server_id,
    device_id: row.device_id,
    name: row.name,
    hash_id: row.hash_id,
  }
  pointSelectorVisible.value = false
}

const offlineValue = computed<number>({
  get() {
    return form.trigger.offline_duration?.value ?? 5
  },
  set(v: number) {
    if (!form.trigger.offline_duration) {
      form.trigger.offline_duration = { value: v, unit: 'min' }
    } else {
      form.trigger.offline_duration.value = v
    }
  }
})

const offlineUnit = computed<OfflineDuration['unit']>({
  get() {
    return form.trigger.offline_duration?.unit ?? 'min'
  },
  set(u: OfflineDuration['unit']) {
    if (!form.trigger.offline_duration) {
      form.trigger.offline_duration = { value: 5, unit: u }
    } else {
      form.trigger.offline_duration.unit = u
    }
  }
})
</script>

<style scoped>
.target { display: flex; gap: 12px; align-items: center; }
.selected { color: #94a3b8; }
.actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 12px; }
.delay-wrap { display: inline-flex; align-items: center; margin-left: 8px; }
.msg-tools { display: flex; gap: 8px; margin-bottom: 8px; }
</style>
