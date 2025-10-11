import { createRouter, createWebHistory } from 'vue-router'

const Dashboard = () => import('../views/Dashboard.vue')
const Servers = () => import('../views/Servers.vue')
const Devices = () => import('../views/Devices.vue')
const Points = () => import('../views/Points.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/servers', component: Servers },
    { path: '/devices', component: Devices },
    { path: '/points', component: Points },
  ],
})

export default router
