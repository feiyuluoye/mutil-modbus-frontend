<script setup lang="ts">
 import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
 import { useRoute, useRouter } from 'vue-router'
 import { useAppStore } from '../stores/app'

 const router = useRouter()
 const route = useRoute()
 const app = useAppStore()

 const now = ref<string>('')
 let timer: any = null
 const format = (d: Date) => {
   const pad = (n:number) => n.toString().padStart(2,'0')
   return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
 }

 onMounted(() => { now.value = format(new Date()); timer = setInterval(()=> now.value = format(new Date()), 1000) })
 onBeforeUnmount(() => { if (timer) clearInterval(timer) })

 const active = computed(() => route.path)

 function go(path:string) { if (route.path !== path) router.push(path) }
 function hideOnError(e: Event) { const t = e.target as HTMLImageElement; if (t) t.style.display = 'none' }
 </script>

<template>
  <header class="topbar">
    <div class="left">
      <img class="logo" alt="logo" src="/logo.svg" @error="hideOnError"/>
      <div class="brand">Modbus数据自动监控系统</div>
      <div class="tabs">
        <el-button :class="['tab-pill', { active: active==='/' }]" text @click="go('/')">首页</el-button>
        <el-button :class="['tab-pill', { active: active==='/alarms' }]" text @click="go('/alarms')">报警记录</el-button>
        <!-- <el-button :class="['tab-pill', { active: active==='/doses' }]" text @click="go('/doses')">加药记录</el-button> -->
        <el-button :class="['tab-pill', { active: active==='/analysis' }]" text @click="go('/analysis')">分析记录</el-button>
        <el-dropdown @command="go">
          <span class="el-dropdown-link">
            <el-button class="tab-pill" text>管理与运维</el-button>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="/servers">Servers</el-dropdown-item>
              <el-dropdown-item command="/devices">Devices</el-dropdown-item>
              <el-dropdown-item command="/points">Points</el-dropdown-item>
              <el-dropdown-item command="/point-properties">PointProperties</el-dropdown-item>
              <el-dropdown-item command="/alarm-rules">Alarm Rules</el-dropdown-item>
              <el-dropdown-item command="/import" divided>CSV Import</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="right">
      <el-tag type="info" class="clock">{{ now }}</el-tag>
      <el-tag :type="app.online ? 'success' : 'danger'">{{ app.online ? '通讯正常' : '通讯失败' }}</el-tag>
      <el-button class="ghost" text>退出</el-button>
    </div>
  </header>
</template>

<style scoped>
.topbar{ display:flex; align-items:center; justify-content:space-between; height:64px; padding:0 16px; background:#0f172a; border-bottom:1px solid #1f2937; }
.left{ display:flex; align-items:center; gap:12px; }
.logo{ width:28px; height:28px; }
.brand{ color:#e2e8f0; font-weight:700; margin-right:8px; white-space:nowrap; }
.tabs{ display:flex; gap:8px; }
.tab-pill{ color:#cbd5e1; border:1px solid #1f2937; background:linear-gradient(180deg,#0d1426,#0a0f1c); padding:6px 12px; border-radius:8px; }
.tab-pill.active{ color:#60a5fa; border-color:#2563eb; box-shadow:0 0 0 1px #2563eb inset, 0 0 12px rgba(37,99,235,.3); }
.right{ display:flex; align-items:center; gap:10px; }
.clock{ background:transparent; border-color:#1f2937; color:#93c5fd; }
.ghost{ color:#e5e7eb; }
</style>
