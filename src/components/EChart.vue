<template>
  <div ref="root" :style="styleObj"></div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch, computed, PropType } from 'vue'
import * as echarts from 'echarts'

export default defineComponent({
  name: 'EChart',
  props: {
    option: { type: Object as PropType<any>, required: true },
    height: { type: [String, Number] as PropType<string | number>, default: '360px' },
    onEvents: { type: Object as PropType<Record<string, (params: any) => void>>, default: () => ({}) },
  },
  setup(props) {
    const root = ref<HTMLDivElement | null>(null)
    let chart: any = null
    const styleObj = computed(() => ({ width: '100%', height: typeof props.height === 'number' ? props.height + 'px' : (props.height || '360px') }))

    function render() {
      if (!root.value) return
      if (!chart) {
        chart = echarts.init(root.value)
        window.addEventListener('resize', resize)
        // bind events
        if (props.onEvents) {
          Object.entries(props.onEvents).forEach(([evt, handler]) => chart.on(evt, handler as any))
        }
      }
      // clear to avoid residual configs (e.g., markArea/areaStyle) from previous options
      chart.clear()
      chart.setOption(props.option, { notMerge: true, replaceMerge: ['series','xAxis','yAxis'] })
    }

    function resize() { if (chart) chart.resize() }

    onMounted(render)
    watch(() => props.option, () => { render() }, { deep: true })
    watch(() => props.onEvents, () => {
      if (!chart) return
      chart.off()
      if (props.onEvents) {
        Object.entries(props.onEvents).forEach(([evt, handler]) => chart.on(evt, handler as any))
      }
    })
    onBeforeUnmount(() => { if (chart) { chart.dispose(); chart = null }; window.removeEventListener('resize', resize) })

    return { root, styleObj }
  }
})
</script>

<style scoped>
</style>
