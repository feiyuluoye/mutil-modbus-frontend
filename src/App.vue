<script setup lang="ts">
 import { useRoute } from 'vue-router'
 const route = useRoute()
</script>

<template>
  <el-config-provider namespace="el">
    <div class="layout">
      <aside class="sidebar">
        <div class="brand">Collector</div>
        <el-menu router :default-active="route.path" class="menu" background-color="#0f172a" text-color="#cbd5e1" active-text-color="#60a5fa">
          <el-menu-item index="/">Dashboard</el-menu-item>
          <el-menu-item index="/servers">Servers</el-menu-item>
          <el-menu-item index="/devices">Devices</el-menu-item>
          <el-menu-item index="/points">Points</el-menu-item>
        </el-menu>
      </aside>
      <main class="content">
        <router-view />
      </main>
    </div>
  </el-config-provider>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: 220px 1fr; height: 100vh; background:#0b1220; color:#e2e8f0; }
.sidebar { background:#0f172a; border-right:1px solid #1f2937; }
.brand { padding:16px; color:#60a5fa; font-weight:700; }
.menu { border-right:none; }
.content { padding:16px; overflow:auto; }
</style>
