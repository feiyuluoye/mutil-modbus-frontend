import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const Login = () => import('../views/Login.vue')
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
const UserManagement = () => import('../views/UserManagement.vue')

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/login', 
      name: 'Login',
      component: Login,
      meta: { requiresAuth: false }
    },
    { 
      path: '/', 
      name: 'Dashboard',
      component: Dashboard,
      meta: { requiresAuth: true }
    },
    { 
      path: '/alarms', 
      name: 'Alarms',
      component: Alarms,
      meta: { requiresAuth: true }
    },
    { 
      path: '/doses', 
      name: 'Doses',
      component: Doses,
      meta: { requiresAuth: true }
    },
    { 
      path: '/analysis', 
      name: 'Analysis',
      component: Analysis,
      meta: { requiresAuth: true }
    },
    { 
      path: '/servers', 
      name: 'Servers',
      component: Servers,
      meta: { requiresAuth: true }
    },
    { 
      path: '/servers/:id/mock', 
      name: 'ServerMock',
      component: ServerMock,
      meta: { requiresAuth: true }
    },
    { 
      path: '/devices', 
      name: 'Devices',
      component: Devices,
      meta: { requiresAuth: true }
    },
    { 
      path: '/points', 
      name: 'Points',
      component: Points,
      meta: { requiresAuth: true }
    },
    { 
      path: '/point-properties', 
      name: 'PointProperties',
      component: PointProperties,
      meta: { requiresAuth: true }
    },
    { 
      path: '/import', 
      name: 'Import',
      component: Import,
      meta: { requiresAuth: true }
    },
    { 
      path: '/alarm-rules', 
      name: 'AlarmRules',
      component: AlarmRules,
      meta: { requiresAuth: true }
    },
    { 
      path: '/users', 
      name: 'UserManagement',
      component: UserManagement,
      meta: { requiresAuth: true, requiresAdmin: true }
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Initialize auth store if not already done
  if (!authStore.user && authStore.token) {
    await authStore.initialize()
  }

  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true

  if (requiresAuth && !authStore.isAuthenticated) {
    // Redirect to login if not authenticated
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !authStore.isAdmin) {
    // Redirect to dashboard if not admin
    next({ name: 'Dashboard' })
  } else if (to.name === 'Login' && authStore.isAuthenticated) {
    // Redirect to dashboard if already logged in
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})

export default router
