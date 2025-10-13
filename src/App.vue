<script setup lang="ts">
 import TopHeader from './components/TopHeader.vue'
</script>

<template>
  <el-config-provider namespace="el">
    <div class="layout">
      <TopHeader />
      <main class="content">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<style scoped>
.layout { display: grid; grid-template-rows: 64px 1fr; height: 100vh; background:#0b1220; color:#e2e8f0; }
.content { padding:16px; overflow:auto; }
</style>
