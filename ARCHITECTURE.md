# 前端项目架构说明

## 项目结构

```
frontend/
├── src/
│   ├── api/              # API接口模块
│   │   ├── auth.ts       # 认证API
│   │   ├── alarms.ts     # 告警API
│   │   ├── db.ts         # 数据库API
│   │   └── ...
│   ├── components/       # 公共组件
│   │   └── TopHeader.vue # 顶部导航栏
│   ├── stores/           # Pinia状态管理
│   │   ├── auth.ts       # 认证状态
│   │   ├── app.ts        # 应用状态
│   │   └── alarm.ts      # 告警状态
│   ├── views/            # 页面组件
│   │   ├── Login.vue     # 登录页面
│   │   ├── UserManagement.vue # 用户管理
│   │   ├── Dashboard.vue # 仪表盘
│   │   └── ...
│   ├── router/           # 路由配置
│   │   └── index.ts      # 路由定义和守卫
│   ├── types/            # TypeScript类型声明
│   │   ├── shims-vue.d.ts # Vue组件类型
│   │   └── global.d.ts   # 全局类型
│   ├── App.vue           # 根组件
│   ├── main.ts           # 入口文件
│   └── env.d.ts          # 环境变量类型
├── tsconfig.json         # TypeScript配置
├── tsconfig.node.json    # Vite配置的TS配置
├── vite.config.ts        # Vite配置
└── package.json          # 项目依赖
```

## 技术栈

- **框架**: Vue 3 (Composition API + `<script setup>`)
- **语言**: TypeScript
- **构建工具**: Vite
- **状态管理**: Pinia
- **路由**: Vue Router 4
- **UI组件库**: Element Plus
- **HTTP客户端**: Axios
- **图表库**: ECharts

## 架构优化内容

### 1. TypeScript配置优化

#### tsconfig.json
- ✅ 添加路径别名配置 (`@/*` → `src/*`)
- ✅ 启用 `esModuleInterop` 和 `allowSyntheticDefaultImports`
- ✅ 添加 `skipLibCheck` 跳过库类型检查
- ✅ 配置 `baseUrl` 和 `paths`
- ✅ 明确 `include` 和 `exclude` 规则

#### tsconfig.node.json (新增)
- ✅ 为Vite配置文件提供独立的TypeScript配置
- ✅ 支持 `vite.config.ts` 的类型检查

### 2. Vite配置优化

#### vite.config.ts
- ✅ 添加路径别名解析 (`@` → `./src`)
- ✅ 使用 `fileURLToPath` 和 `URL` 进行路径解析
- ✅ 保留API代理配置

### 3. 类型声明优化

#### src/types/shims-vue.d.ts (新增)
- ✅ Vue组件的TypeScript类型声明
- ✅ 支持 `.vue` 文件的导入

#### src/types/global.d.ts (新增)
- ✅ 全局类型定义
- ✅ 环境变量类型声明 (`ImportMetaEnv`)

### 4. 模块导入规范

所有模块导入统一使用路径别名：

```typescript
// ✅ 推荐 - 使用路径别名
import { useAuthStore } from '@/stores/auth'
import { authAPI } from '@/api/auth'
import TopHeader from '@/components/TopHeader.vue'

// ❌ 避免 - 相对路径（除非同级目录）
import { useAuthStore } from '../stores/auth'
import { authAPI } from '../../api/auth'
```

## 认证系统架构

### 状态管理 (Pinia Store)

```typescript
// stores/auth.ts
export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(null)
  const user = ref<UserInfo | null>(null)
  
  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  
  // Actions
  const login = async (credentials) => { /* ... */ }
  const logout = async () => { /* ... */ }
  
  return { token, user, isAuthenticated, login, logout }
})
```

### 路由守卫

```typescript
// router/index.ts
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // 初始化认证状态
  if (!authStore.user && authStore.token) {
    await authStore.initialize()
  }
  
  // 检查认证要求
  const requiresAuth = to.meta.requiresAuth !== false
  const requiresAdmin = to.meta.requiresAdmin === true
  
  if (requiresAuth && !authStore.isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
  } else if (requiresAdmin && !authStore.isAdmin) {
    next({ name: 'Dashboard' })
  } else {
    next()
  }
})
```

### API封装

```typescript
// api/auth.ts
export const authAPI = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, data)
    return response.data
  },
  
  logout: async (token: string): Promise<void> => {
    await axios.post(`${API_BASE}/api/v1/auth/logout`, {}, {
      headers: { 'X-Session-Token': token }
    })
  },
  
  // ... 其他API方法
}
```

## 组件规范

### Vue 3 Composition API

所有组件使用 `<script setup>` 语法：

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const count = ref(0)

const doubleCount = computed(() => count.value * 2)

onMounted(() => {
  console.log('Component mounted')
})
</script>

<template>
  <div>{{ doubleCount }}</div>
</template>

<style scoped>
/* 组件样式 */
</style>
```

### 类型安全

使用TypeScript类型定义：

```typescript
// 定义接口
interface UserInfo {
  id: number
  username: string
  email: string
  role: string
}

// 使用类型
const user = ref<UserInfo | null>(null)
```

## 开发指南

### 安装依赖

```bash
cd frontend
npm install
```

### 开发模式

```bash
npm run dev
```

访问: http://localhost:5173

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 常见问题解决

### 1. 模块找不到错误

**问题**: `找不到模块"@/api/auth"或其相应的类型声明`

**解决方案**:
- 确保 `tsconfig.json` 中配置了路径别名
- 确保 `vite.config.ts` 中配置了路径别名
- 重启IDE或TypeScript服务器

### 2. Vue组件导入错误

**问题**: `Module has no default export`

**解决方案**:
- 确保 `src/types/shims-vue.d.ts` 存在
- 确保 `tsconfig.json` 包含了类型声明文件
- Vue 3组件使用 `<script setup>` 不需要显式导出

### 3. 环境变量类型错误

**问题**: `Property 'VITE_API_BASE' does not exist on type 'ImportMetaEnv'`

**解决方案**:
- 在 `src/types/global.d.ts` 中定义环境变量类型
- 使用 `import.meta.env.VITE_API_BASE` 访问

## 性能优化

### 1. 路由懒加载

```typescript
const Dashboard = () => import('@/views/Dashboard.vue')
const UserManagement = () => import('@/views/UserManagement.vue')
```

### 2. 组件懒加载

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() => 
  import('@/components/HeavyComponent.vue')
)
</script>
```

### 3. API请求优化

- 使用Axios拦截器统一处理请求/响应
- 实现请求取消机制
- 添加请求缓存

## 安全最佳实践

### 1. Token管理

- Token存储在localStorage
- 每次请求自动携带Token
- Token过期自动跳转登录

### 2. 路由权限

- 使用路由守卫检查认证状态
- 基于角色的访问控制
- 未授权自动重定向

### 3. API安全

- 所有请求使用HTTPS（生产环境）
- 敏感操作需要二次确认
- 错误信息不暴露敏感数据

## 代码规范

### 命名规范

- **组件**: PascalCase (如: `UserManagement.vue`)
- **文件**: kebab-case (如: `user-management.ts`)
- **变量/函数**: camelCase (如: `userName`, `fetchUser()`)
- **常量**: UPPER_SNAKE_CASE (如: `API_BASE_URL`)
- **类型/接口**: PascalCase (如: `UserInfo`, `LoginRequest`)

### 目录规范

- `api/` - API接口，按功能模块划分
- `components/` - 公共组件
- `views/` - 页面组件
- `stores/` - 状态管理
- `router/` - 路由配置
- `types/` - 类型声明
- `utils/` - 工具函数
- `assets/` - 静态资源

## 测试

### 单元测试 (待实现)

```bash
npm run test:unit
```

### E2E测试 (待实现)

```bash
npm run test:e2e
```

## 部署

### 环境变量

创建 `.env.production` 文件：

```env
VITE_API_BASE=https://api.example.com
```

### 构建命令

```bash
npm run build
```

构建产物在 `dist/` 目录。

### Nginx配置示例

```nginx
server {
    listen 80;
    server_name example.com;
    
    root /var/www/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 更新日志

### v1.0.0 (2026-01-06)
- ✅ 优化TypeScript配置
- ✅ 添加路径别名支持
- ✅ 完善类型声明文件
- ✅ 实现认证系统
- ✅ 实现用户管理功能
- ✅ 添加路由守卫
- ✅ 优化项目架构

## 贡献指南

1. Fork项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证。

---

**维护者**: 开发团队  
**最后更新**: 2026-01-06
