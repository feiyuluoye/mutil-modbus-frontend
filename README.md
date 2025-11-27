## Frontend Web UI



### Tech Stack

- Vue 3 + Vite
- TypeScript
- Element Plus
- Pinia

### Project Location

- Frontend source code: `./frontend`

### Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Default dev server: `http://localhost:5173`

### Backend API & Proxy

- Default backend API base (dev): `http://localhost:8080`
- Vite dev proxy:
  - `/api`  -> `http://localhost:8080`
  - `/stream` -> `http://localhost:8080`

### API Base Configuration

- Global HTTP client base URL (for most APIs): `http://localhost:8080/api/v1`
- CSV import APIs use `API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'`

You can override backend address via environment variable in `frontend`:

```bash
# ./frontend/.env.local
VITE_API_BASE=http://your-backend-host:8080
```

### Data Import Endpoints

CSV 导入接口（由前端通过 `frontend/src/api/import.ts` 调用）：

- 服务器配置导入: `POST {API_BASE}/api/v1/import/servers`
- 设备配置导入: `POST {API_BASE}/api/v1/import/devices`
- 测点配置导入: `POST {API_BASE}/api/v1/import/points`

上传文件字段名统一为 `file`，Content-Type 为 `multipart/form-data`。

### Page Show

![截屏2025-11-27 15.37.50](/Users/apple/Desktop/截图/截屏2025-11-27 15.37.50.png)

![截屏2025-11-27 15.38.21](/Users/apple/Desktop/截图/截屏2025-11-27 15.38.21.png)

![截屏2025-11-27 15.38.42](/Users/apple/Desktop/截图/截屏2025-11-27 15.38.42.png)

![截屏2025-11-27 15.38.47](/Users/apple/Desktop/截图/截屏2025-11-27 15.38.47.png)

![截屏2025-11-27 15.38.58](/Users/apple/Desktop/截图/截屏2025-11-27 15.38.58.png)

![截屏2025-11-27 15.40.18](/Users/apple/Desktop/截图/截屏2025-11-27 15.40.18.png)

![截屏2025-11-27 15.40.33](/Users/apple/Desktop/截图/截屏2025-11-27 15.40.33.png)
