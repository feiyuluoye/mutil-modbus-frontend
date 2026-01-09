<template>
  <div class="user-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button
            v-if="authStore.isAdmin"
            type="primary"
            @click="showCreateDialog = true"
          >
            创建用户
          </el-button>
        </div>
      </template>

      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" width="200" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="enabled" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'danger'">
              {{ row.enabled ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="250">
          <template #default="{ row }">
            <el-button
              v-if="authStore.isAdmin"
              size="small"
              @click="handleEdit(row)"
            >
              编辑
            </el-button>
            <el-button
              v-if="authStore.isAdmin"
              size="small"
              type="warning"
              @click="handleToggleStatus(row)"
            >
              {{ row.enabled ? '禁用' : '启用' }}
            </el-button>
            <el-button
              v-if="authStore.isAdmin && row.id !== authStore.user?.id"
              size="small"
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- Create User Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      title="创建用户"
      width="500px"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="createForm.username" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="createForm.password" type="password" show-password />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="createForm.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="createForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="handleCreate" :loading="submitting">
          创建
        </el-button>
      </template>
    </el-dialog>

    <!-- Edit User Dialog -->
    <el-dialog
      v-model="showEditDialog"
      title="编辑用户"
      width="500px"
    >
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="editRules"
        label-width="100px"
      >
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="editForm.role" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="操作员" value="operator" />
            <el-option label="查看者" value="viewer" />
          </el-select>
        </el-form-item>
        <el-form-item label="重置密码" prop="password">
          <el-input
            v-model="editForm.password"
            type="password"
            show-password
            placeholder="留空则不修改密码"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="handleUpdate" :loading="submitting">
          更新
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { authAPI, type UserInfo, type CreateUserRequest } from '@/api/auth';
import { ElMessage, ElMessageBox } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const authStore = useAuthStore();

const users = ref<UserInfo[]>([]);
const loading = ref(false);
const submitting = ref(false);

const showCreateDialog = ref(false);
const showEditDialog = ref(false);

const createFormRef = ref<FormInstance>();
const editFormRef = ref<FormInstance>();

const createForm = reactive<CreateUserRequest>({
  username: '',
  password: '',
  email: '',
  role: 'viewer',
});

const editForm = reactive({
  id: 0,
  email: '',
  role: '',
  password: '',
});

const createRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
};

const editRules: FormRules = {
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' },
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  password: [
    { min: 8, message: '密码长度至少8位', trigger: 'blur' },
  ],
};

const fetchUsers = async () => {
  if (!authStore.token) return;

  loading.value = true;
  try {
    const response = await authAPI.listUsers(authStore.token);
    users.value = response.users;
  } catch (error: any) {
    ElMessage.error(error.response?.data?.error || '获取用户列表失败');
  } finally {
    loading.value = false;
  }
};

const handleCreate = async () => {
  if (!createFormRef.value || !authStore.token) return;

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      await authAPI.createUser(authStore.token!, createForm);
      ElMessage.success('用户创建成功');
      showCreateDialog.value = false;
      
      // Reset form
      createFormRef.value?.resetFields();
      
      // Refresh list
      await fetchUsers();
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '创建用户失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleEdit = (row: UserInfo) => {
  editForm.id = row.id;
  editForm.email = row.email;
  editForm.role = row.role;
  editForm.password = '';
  showEditDialog.value = true;
};

const handleUpdate = async () => {
  if (!editFormRef.value || !authStore.token) return;

  await editFormRef.value.validate(async (valid) => {
    if (!valid) return;

    submitting.value = true;
    try {
      const updates: any = {
        email: editForm.email,
        role: editForm.role,
      };

      if (editForm.password) {
        updates.password = editForm.password;
      }

      await authAPI.updateUser(authStore.token!, editForm.id, updates);
      ElMessage.success('用户更新成功');
      showEditDialog.value = false;
      
      // Refresh list
      await fetchUsers();
    } catch (error: any) {
      ElMessage.error(error.response?.data?.error || '更新用户失败');
    } finally {
      submitting.value = false;
    }
  });
};

const handleToggleStatus = async (row: UserInfo) => {
  if (!authStore.token) return;

  try {
    await ElMessageBox.confirm(
      `确定要${row.enabled ? '禁用' : '启用'}用户 ${row.username} 吗？`,
      '确认操作',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    );

    await authAPI.updateUser(authStore.token, row.id, {
      enabled: !row.enabled,
    });

    ElMessage.success(`用户已${row.enabled ? '禁用' : '启用'}`);
    await fetchUsers();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '操作失败');
    }
  }
};

const handleDelete = async (row: UserInfo) => {
  if (!authStore.token) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除用户 ${row.username} 吗？此操作不可恢复！`,
      '确认删除',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error',
      }
    );

    await authAPI.deleteUser(authStore.token, row.id);
    ElMessage.success('用户已删除');
    await fetchUsers();
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.error || '删除失败');
    }
  }
};

const getRoleType = (role: string) => {
  const types: Record<string, any> = {
    admin: 'danger',
    operator: 'warning',
    viewer: 'info',
  };
  return types[role] || 'info';
};

const getRoleLabel = (role: string) => {
  const labels: Record<string, string> = {
    admin: '管理员',
    operator: '操作员',
    viewer: '查看者',
  };
  return labels[role] || role;
};

onMounted(() => {
  fetchUsers();
});
</script>

<style scoped>
.user-management {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
