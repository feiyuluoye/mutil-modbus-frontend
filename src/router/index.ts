import { createRouter, createWebHistory } from 'vue-router'

const Dashboard = () => import('../views/Dashboard.vue')
const Servers = () => import('../views/Servers.vue')
const ServerMock = () => import('../views/ServerMock.vue')
const Devices = () => import('../views/Devices.vue')
const Points = () => import('../views/Points.vue')
const PointProperties = () => import('../views/PointProperties.vue')
const Alarms = () => import('../views/AlarmRecords.vue')
const Doses = () => import('../views/DoseRecords.vue')
const Analysis = () => import('../views/AnalysisRecords.vue')
const Import = () => import('../views/Import.vue')
const AlarmRules = () => import('../views/AlarmsPage.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Dashboard },
    { path: '/alarms', component: Alarms },
    { path: '/doses', component: Doses },
    { path: '/analysis', component: Analysis },
    { path: '/servers', component: Servers },
    { path: '/servers/:id/mock', component: ServerMock },
    { path: '/devices', component: Devices },
    { path: '/points', component: Points },
    { path: '/point-properties', component: PointProperties },
    { path: '/import', component: Import },
    { path: '/alarm-rules', component: AlarmRules },
  ],
})

export default router
