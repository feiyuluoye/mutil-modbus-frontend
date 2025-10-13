import { createRouter, createWebHistory } from 'vue-router'

const Dashboard = () => import('../views/Dashboard.vue')
const Servers = () => import('../views/Servers.vue')
const Devices = () => import('../views/Devices.vue')
const Points = () => import('../views/Points.vue')
const Alarms = () => import('../views/AlarmRecords.vue')
const Doses = () => import('../views/DoseRecords.vue')
const Analysis = () => import('../views/AnalysisRecords.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/alarms', component: Alarms },
    { path: '/doses', component: Doses },
    { path: '/analysis', component: Analysis },
    { path: '/servers', component: Servers },
    { path: '/devices', component: Devices },
    { path: '/points', component: Points },
  ],
})

export default router
