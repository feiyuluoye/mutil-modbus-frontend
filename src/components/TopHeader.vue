<script setup lang="ts">
 import { computed, onMounted, onBeforeUnmount, ref } from 'vue'
 import { useRoute, useRouter } from 'vue-router'
 import { useAppStore } from '../stores/app'
 import { useAuthStore } from '../stores/auth'
 import { useThemeStore } from '../stores/theme'
 import { ElMessage, ElMessageBox } from 'element-plus'

 const router = useRouter()
 const route = useRoute()
 const app = useAppStore()
 const authStore = useAuthStore()
 const themeStore = useThemeStore()

 const now = ref<string>('')
 let timer: any = null
 const format = (d: Date) => {
   const pad = (n:number) => n.toString().padStart(2,'0')
   return `${d.getFullYear()}/${pad(d.getMonth()+1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
 }

 onMounted(() => { now.value = format(new Date()); timer = setInterval(()=> now.value = format(new Date()), 1000) })
 onBeforeUnmount(() => { if (timer) clearInterval(timer) })

 const active = computed(() => route.path)
 const roleLabel = computed(() => {
   const labels: Record<string, string> = {
     admin: '管理员',
     operator: '操作员',
     viewer: '查看者',
   }
   return authStore.user ? labels[authStore.user.role] || authStore.user.role : ''
 })

 const isDark = computed(() => themeStore.mode === 'dark')
 const themeIcon = computed(() => isDark.value ? 'Sunny' : 'Moon')
 const themeLabel = computed(() => isDark.value ? '浅色' : '深色')

 function go(path:string) { if (route.path !== path) router.push(path) }
 function hideOnError(e: Event) { const t = e.target as HTMLImageElement; if (t) t.style.display = 'none' }
 
 function toggleTheme() {
   themeStore.toggleTheme()
   ElMessage.success(`已切换到${themeStore.mode === 'dark' ? '深色' : '浅色'}模式`)
 }
 
 async function handleLogout() {
   try {
     await ElMessageBox.confirm('确定要退出登录吗？', '确认退出', {
       confirmButtonText: '退出',
       cancelButtonText: '取消',
       type: 'warning',
     })
     
     await authStore.logout()
     ElMessage.success('已退出登录')
     router.push('/login')
   } catch (error) {
     // User cancelled
   }
 }
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
              <el-dropdown-item v-if="authStore.isAdmin" command="/users" divided>用户管理</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <div class="right">
      <el-tag type="info" class="clock">{{ now }}</el-tag>
      <el-tag :type="app.online ? 'success' : 'danger'">{{ app.online ? '通讯正常' : '通讯失败' }}</el-tag>
      <el-tooltip :content="`切换到${themeLabel}模式`" placement="bottom">
        <el-button 
          class="theme-toggle" 
          :icon="themeIcon" 
          circle 
          @click="toggleTheme"
        />
      </el-tooltip>
      <el-tag v-if="authStore.user" type="warning" class="user-info">
        {{ authStore.user.username }} ({{ roleLabel }})
      </el-tag>
      <el-button class="ghost" text @click="handleLogout">退出</el-button>
    </div>
  </header>
</template>

<style scoped>
.topbar { 
  display: flex; 
  align-items: center; 
  justify-content: space-between; 
  height: 64px; 
  padding: 0 24px; 
  background: #ffffff; 
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.left { 
  display: flex; 
  align-items: center; 
  gap: 16px; 
}

.logo { 
  width: 32px; 
  height: 32px; 
}

.brand { 
  color: var(--color-text); 
  font-weight: 700; 
  font-size: 18px;
  margin-right: 16px; 
  white-space: nowrap;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tabs { 
  display: flex; 
  gap: 8px; 
}

.tab-pill { 
  color: var(--color-text-secondary); 
  border: 1px solid transparent;
  background: transparent;
  padding: 8px 16px; 
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
}

.tab-pill:hover {
  color: var(--color-primary);
  background: rgba(64, 158, 255, 0.08);
}

.tab-pill.active { 
  color: var(--color-primary); 
  background: rgba(64, 158, 255, 0.1);
  border-color: var(--color-primary);
  font-weight: 600;
}

.right { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.clock { 
  background: transparent; 
  border-color: var(--color-border); 
  color: var(--color-text-secondary);
  font-weight: 500;
}

.user-info { 
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: #ffffff;
  font-weight: 500;
}

.ghost { 
  color: var(--color-text-secondary);
  font-weight: 500;
  transition: all 0.3s ease;
}

.ghost:hover {
  color: var(--color-danger);
}

.el-dropdown-link {
  cursor: pointer;
}

.theme-toggle {
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: rotate(180deg);
}
</style>
