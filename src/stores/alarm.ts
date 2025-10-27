import { defineStore } from 'pinia'
import { ElMessage } from 'element-plus'
import { listAlarms, createAlarm, updateAlarm, deleteAlarm, enableAlarm, disableAlarm, type AlarmRule, type AlarmSeverity } from '../api/alarms'

export const useAlarmStore = defineStore('alarm', {
  state: () => ({
    rows: [] as AlarmRule[],
    total: 0,
    page: 1,
    size: 10,
    loading: false,
    filters: {
      query: '' as string,
      severity: undefined as AlarmSeverity | undefined,
      enabled: undefined as boolean | undefined,
    },
  }),
  actions: {
    async fetchList() {
      this.loading = true
      try {
        const data = await listAlarms({
          query: this.filters.query || undefined,
          severity: this.filters.severity as any,
          enabled: this.filters.enabled,
          page: this.page,
          size: this.size,
        })
        this.rows = data.rows
        this.total = data.total
      } catch (e: any) {
        ElMessage.error(e?.response?.data?.error || 'Failed to load rules')
      } finally {
        this.loading = false
      }
    },
    async create(rule: AlarmRule) {
      const { id } = await createAlarm(rule)
      ElMessage.success('Created')
      await this.fetchList()
      return id
    },
    async update(id: string, patch: Partial<AlarmRule>) {
      await updateAlarm(id, patch)
      ElMessage.success('Updated')
      await this.fetchList()
    },
    async remove(id: string) {
      await deleteAlarm(id)
      ElMessage.success('Deleted')
      await this.fetchList()
    },
    async setEnabled(id: string, enabledVal: boolean) {
      if (enabledVal) {
        await enableAlarm(id)
      } else {
        await disableAlarm(id)
      }
      await this.fetchList()
    },
  },
})
