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

### 部分界面展示


**![**Dashboard**](**./images/dashboard.png**)**

![**Analysis**](**./images/analysis.png**)

![**Alarm Rules**](**./images/rules.png**)

![**Point Properties**](**./images/pointProperties.png**)

![**CSV Import**](**./images/CSVImport.png**)

![**Points Show**](**./images/pointsShow.png**)
