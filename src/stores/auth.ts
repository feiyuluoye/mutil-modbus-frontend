import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authAPI, type UserInfo, type LoginRequest } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const token = ref<string | null>(localStorage.getItem('auth_token'));
  const user = ref<UserInfo | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Getters
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const isAdmin = computed(() => user.value?.role === 'admin');
  const isOperator = computed(() => user.value?.role === 'operator');
  const isViewer = computed(() => user.value?.role === 'viewer');

  // Actions
  const login = async (credentials: LoginRequest) => {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await authAPI.login(credentials);
      token.value = response.token;
      user.value = response.user;
      
      // Save token to localStorage
      localStorage.setItem('auth_token', response.token);
      
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Login failed';
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const logout = async () => {
    if (token.value) {
      try {
        await authAPI.logout(token.value);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    // Clear state
    token.value = null;
    user.value = null;
    localStorage.removeItem('auth_token');
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return false;

    isLoading.value = true;
    error.value = null;

    try {
      user.value = await authAPI.getCurrentUser(token.value);
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to fetch user';
      // If token is invalid, clear it
      if (err.response?.status === 401) {
        token.value = null;
        user.value = null;
        localStorage.removeItem('auth_token');
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!token.value) throw new Error('Not authenticated');

    isLoading.value = true;
    error.value = null;

    try {
      await authAPI.changePassword(token.value, {
        old_password: oldPassword,
        new_password: newPassword,
      });
      return true;
    } catch (err: any) {
      error.value = err.response?.data?.error || 'Failed to change password';
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user.value) return false;

    // Admin has all permissions
    if (user.value.role === 'admin') return true;

    // Operator permissions
    if (user.value.role === 'operator') {
      const operatorPermissions = [
        { resource: 'servers', action: 'read' },
        { resource: 'servers', action: 'write' },
        { resource: 'devices', action: 'read' },
        { resource: 'devices', action: 'write' },
        { resource: 'alarms', action: 'read' },
        { resource: 'alarms', action: 'write' },
        { resource: 'data', action: 'read' },
      ];

      return operatorPermissions.some(
        (p) => p.resource === resource && p.action === action
      );
    }

    // Viewer permissions
    if (user.value.role === 'viewer') {
      const viewerPermissions = [
        { resource: 'servers', action: 'read' },
        { resource: 'devices', action: 'read' },
        { resource: 'alarms', action: 'read' },
        { resource: 'data', action: 'read' },
      ];

      return viewerPermissions.some(
        (p) => p.resource === resource && p.action === action
      );
    }

    return false;
  };

  // Initialize: try to fetch user if token exists
  const initialize = async () => {
    if (token.value) {
      await fetchCurrentUser();
    }
  };

  return {
    // State
    token,
    user,
    isLoading,
    error,
    
    // Getters
    isAuthenticated,
    isAdmin,
    isOperator,
    isViewer,
    
    // Actions
    login,
    logout,
    fetchCurrentUser,
    changePassword,
    hasPermission,
    initialize,
  };
});
