import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8081';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  expires_at: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  enabled?: boolean;
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  role: 'admin' | 'operator' | 'viewer';
}

export interface UpdateUserRequest {
  email?: string;
  role?: string;
  enabled?: boolean;
  password?: string;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  action: string;
  resource: string;
  details: string;
  ip_address: string;
  success: boolean;
  timestamp: string;
}

// Auth API
export const authAPI = {
  // Login
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await axios.post(`${API_BASE}/api/v1/auth/login`, data);
    return response.data;
  },

  // Logout
  logout: async (token: string): Promise<void> => {
    await axios.post(
      `${API_BASE}/api/v1/auth/logout`,
      {},
      {
        headers: { 'X-Session-Token': token },
      }
    );
  },

  // Get current user
  getCurrentUser: async (token: string): Promise<UserInfo> => {
    const response = await axios.get(`${API_BASE}/api/v1/auth/me`, {
      headers: { 'X-Session-Token': token },
    });
    return response.data;
  },

  // Change password
  changePassword: async (token: string, data: ChangePasswordRequest): Promise<void> => {
    await axios.post(`${API_BASE}/api/v1/auth/change-password`, data, {
      headers: { 'X-Session-Token': token },
    });
  },

  // User management (admin only)
  createUser: async (token: string, data: CreateUserRequest): Promise<UserInfo> => {
    const response = await axios.post(`${API_BASE}/api/v1/auth/users`, data, {
      headers: { 'X-Session-Token': token },
    });
    return response.data;
  },

  listUsers: async (token: string): Promise<{ users: UserInfo[]; count: number }> => {
    const response = await axios.get(`${API_BASE}/api/v1/auth/users`, {
      headers: { 'X-Session-Token': token },
    });
    return response.data;
  },

  updateUser: async (token: string, userId: number, data: UpdateUserRequest): Promise<void> => {
    await axios.put(`${API_BASE}/api/v1/auth/users/${userId}`, data, {
      headers: { 'X-Session-Token': token },
    });
  },

  deleteUser: async (token: string, userId: number): Promise<void> => {
    await axios.delete(`${API_BASE}/api/v1/auth/users/${userId}`, {
      headers: { 'X-Session-Token': token },
    });
  },

  // Audit logs
  getAuditLogs: async (
    token: string,
    username?: string,
    limit?: number
  ): Promise<{ logs: AuditLog[]; count: number }> => {
    const params = new URLSearchParams();
    if (username) params.append('username', username);
    if (limit) params.append('limit', limit.toString());

    const response = await axios.get(`${API_BASE}/api/v1/auth/audit-logs?${params}`, {
      headers: { 'X-Session-Token': token },
    });
    return response.data;
  },
};
