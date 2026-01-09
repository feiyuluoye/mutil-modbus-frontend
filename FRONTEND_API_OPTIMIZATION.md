# Frontend API 架构优化文档

## 优化概述

优化了前端 API 架构，添加了环境变量配置支持，集中管理 API 端点，并增强了 HTTP 拦截器功能。

---

## 📁 新增文件结构

```
frontend/src/
├── config/
│   ├── index.ts           # 配置模块导出
│   ├── env.ts             # 环境变量配置
│   └── api.ts             # API 端点定义
├── api/
│   └── http.ts            # HTTP 客户端（已优化）
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
└── .env.docker            # Docker 环境变量
```

---

## 🔧 主要优化内容

### 1. 环境变量配置 (`src/config/env.ts`)

**功能**:
- 统一管理环境变量
- 支持开发/生产/Docker 多环境
- 自动检测运行模式
- 提供配置日志（开发模式）

**使用示例**:
```typescript
import { env, getApiUrl } from '@/config/env'

console.log(env.apiBaseUrl)    // '/api/v1'
console.log(env.apiTimeout)    // 15000
console.log(env.isDevelopment) // true/false

const url = getApiUrl('/servers') // '/api/v1/servers'
```

**配置项**:
- `VITE_API_BASE_URL`: API 基础路径
- `VITE_API_TIMEOUT`: 请求超时时间（毫秒）

---

### 2. API 端点集中管理 (`src/config/api.ts`)

**功能**:
- 集中定义所有 API 端点
- 类型安全的端点访问
- 动态参数支持
- 查询字符串构建工具

**端点分类**:
```typescript
API_ENDPOINTS = {
  auth: { login, logout, register, profile, users },
  servers: { list, detail, state, start, stop, restart },
  devices: { list, detail, byServer },
  points: { list, detail, byDevice, values, latest },
  alarms: { list, detail, active, history, acknowledge },
  analysis: { dashboard, trends, statistics },
  import: { upload, status, history },
  runtime: { info, health, metrics },
  database: { tables, query, export },
  stream: { points, alarms },
}
```

**使用示例**:
```typescript
import { API_ENDPOINTS, buildUrl } from '@/config/api'

// 静态端点
const url1 = API_ENDPOINTS.servers.list // '/servers'

// 动态端点
const url2 = API_ENDPOINTS.servers.detail('server-1') // '/servers/server-1'

// 带查询参数
const url3 = buildUrl(API_ENDPOINTS.servers.list, { 
  page: 1, 
  limit: 10 
}) // '/servers?page=1&limit=10'
```

---

### 3. HTTP 客户端增强 (`src/api/http.ts`)

**新增功能**:

#### 请求拦截器
- 自动添加 Authorization token
- 统一请求头配置

```typescript
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

#### 响应拦截器
- 统一错误处理
- 自动处理 401 未授权（跳转登录）
- 错误日志记录

```typescript
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
```

---

### 4. 环境变量文件

#### `.env.development` (开发环境)
```env
VITE_API_BASE_URL=/api/v1
VITE_API_TIMEOUT=15000
```

#### `.env.production` (生产环境)
```env
VITE_API_BASE_URL=/api/v1
VITE_API_TIMEOUT=30000
```

#### `.env.docker` (Docker 环境)
```env
VITE_API_BASE_URL=/api/v1
VITE_API_TIMEOUT=30000
```

---

### 5. Docker Compose 配置优化

**文件**: `deploy/docker-compose.yml`

**添加环境变量**:
```yaml
frontend:
  environment:
    - TZ=Asia/Shanghai
    - BACKEND_HOST=web        # 后端服务主机名
    - BACKEND_PORT=8081       # 后端服务端口
    - API_BASE_URL=/api/v1    # API 基础路径
```

---

### 6. Nginx 配置优化

**文件**: `frontend/nginx.conf`

**新增功能**:

#### API 代理增强
```nginx
location /api/ {
    proxy_pass http://web:8081;
    proxy_http_version 1.1;
    
    # Timeout settings
    proxy_connect_timeout 30s;
    proxy_send_timeout 30s;
    proxy_read_timeout 30s;
    
    # Headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

#### SSE 流代理
```nginx
location /stream/ {
    proxy_pass http://web:8081;
    
    # SSE specific settings
    proxy_buffering off;
    proxy_cache off;
    proxy_read_timeout 24h;
    chunked_transfer_encoding on;
}
```

---

## 🚀 使用指南

### 在 API 模块中使用

**推荐方式** (使用集中配置):

```typescript
import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/config/api'

// GET 请求
export const getServers = () => {
  return http.get(API_ENDPOINTS.servers.list)
}

// GET 请求 with 参数
export const getServerDetail = (id: string) => {
  return http.get(API_ENDPOINTS.servers.detail(id))
}

// POST 请求
export const startServer = (id: string) => {
  return http.post(API_ENDPOINTS.servers.start(id))
}

// 带查询参数
import { buildUrl } from '@/config/api'

export const getServerList = (params: { page: number; limit: number }) => {
  return http.get(buildUrl(API_ENDPOINTS.servers.list, params))
}
```

**旧方式** (仍然支持):
```typescript
import { http } from '@/api/http'

export const getServers = () => {
  return http.get('/servers')
}
```

---

## 📊 架构优势

### 1. 类型安全
- TypeScript 类型检查
- 端点路径自动补全
- 编译时错误检测

### 2. 易于维护
- API 端点集中管理
- 修改端点只需一处
- 清晰的代码组织

### 3. 环境灵活
- 支持多环境配置
- 环境变量自动切换
- Docker 部署友好

### 4. 错误处理
- 统一错误拦截
- 自动 token 管理
- 友好的错误提示

### 5. 性能优化
- 请求/响应拦截器
- 超时控制
- 缓存策略（Nginx）

---

## 🔄 迁移指南

### 步骤 1: 更新导入

**旧代码**:
```typescript
import { http } from '@/api/http'

http.get('/servers')
```

**新代码**:
```typescript
import { http } from '@/api/http'
import { API_ENDPOINTS } from '@/config/api'

http.get(API_ENDPOINTS.servers.list)
```

### 步骤 2: 使用端点常量

将所有硬编码的 API 路径替换为 `API_ENDPOINTS` 中的常量。

### 步骤 3: 利用工具函数

使用 `buildUrl` 构建带查询参数的 URL：

```typescript
import { buildUrl, API_ENDPOINTS } from '@/config/api'

const url = buildUrl(API_ENDPOINTS.servers.list, { 
  enabled: true,
  protocol: 'tcp'
})
```

---

## 🧪 测试验证

### 开发环境测试

```bash
cd frontend
npm run dev
```

访问: http://localhost:5173

**验证点**:
- API 请求通过 Vite 代理到 `http://localhost:8081`
- 控制台显示环境配置日志
- API 请求正常工作

### Docker 环境测试

```bash
cd deploy
make build
make up
```

访问: http://localhost

**验证点**:
- API 请求通过 Nginx 代理到 `http://web:8081`
- 前后端通信正常
- SSE 流连接正常

---

## 📝 配置示例

### 修改 API 基础路径

**场景**: 后端 API 路径改为 `/api/v2`

**修改文件**: `.env.development`, `.env.production`, `.env.docker`

```env
VITE_API_BASE_URL=/api/v2
```

### 修改超时时间

**场景**: 增加请求超时到 60 秒

**修改文件**: `.env.production`

```env
VITE_API_TIMEOUT=60000
```

### 添加新的 API 端点

**文件**: `src/config/api.ts`

```typescript
export const API_ENDPOINTS = {
  // ... 现有端点
  
  // 新增端点
  reports: {
    list: '/reports',
    detail: (id: string) => `/reports/${id}`,
    generate: '/reports/generate',
  },
}
```

---

## 🔒 安全建议

1. **Token 管理**
   - Token 存储在 localStorage
   - 自动在请求头中添加
   - 401 错误时自动清除并跳转登录

2. **CORS 配置**
   - 开发环境: Vite 代理处理
   - 生产环境: Nginx 代理处理
   - 无需前端配置 CORS

3. **敏感信息**
   - 不要在 `.env` 文件中存储敏感信息
   - API 密钥应由后端管理
   - 使用 HTTPS 传输（生产环境）

---

## 📚 相关文档

- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)
- [Axios 拦截器](https://axios-http.com/docs/interceptors)
- [Nginx 代理配置](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

---

## 🎯 下一步优化

- [ ] 添加请求重试机制
- [ ] 实现请求取消功能
- [ ] 添加请求缓存策略
- [ ] 实现 API Mock 功能
- [ ] 添加请求日志记录
- [ ] 实现请求队列管理

---

**优化完成时间**: 2026-01-08  
**状态**: ✅ 已完成并可用  
**兼容性**: 向后兼容，旧代码仍可正常工作

**现在可以使用新的 API 架构进行开发！** 🎉
