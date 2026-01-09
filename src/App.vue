<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import TopHeader from './components/TopHeader.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const authStore = useAuthStore()

onMounted(async () => {
  // Initialize auth store on app mount
  await authStore.initialize()
})
</script>

<template>
  <el-config-provider namespace="el">
    <div v-if="route.name === 'Login'" class="login-layout">
      <router-view />
    </div>
    <div v-else class="layout">
      <TopHeader />
      <main class="content">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<style scoped>
.login-layout {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.layout { 
  display: grid; 
  grid-template-rows: 64px 1fr; 
  height: 100vh; 
  background: var(--color-bg);
  color: var(--color-text);
}

.content { 
  padding: 24px; 
  overflow: auto;
  background: var(--color-bg);
}
</style>
