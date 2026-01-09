<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>数据采集系统</h1>
        <p>Data Collector System</p>
      </div>

      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="loginRules"
        class="login-form"
        @submit.prevent="handleLogin"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            prefix-icon="User"
            size="large"
            clearable
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="密码"
            prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            :loading="authStore.isLoading"
            class="login-button"
            @click="handleLogin"
          >
            {{ authStore.isLoading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>

        <el-alert
          v-if="authStore.error"
          :title="authStore.error"
          type="error"
          :closable="false"
          show-icon
          class="error-alert"
        />
      </el-form>

      <div class="login-footer">
        <p>默认账户：superman / admin</p>
        <p>默认密码：Chenyun01$</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { ElMessage } from 'element-plus';
import type { FormInstance, FormRules } from 'element-plus';

const router = useRouter();
const authStore = useAuthStore();

const loginFormRef = ref<FormInstance>();
const loginForm = reactive({
  username: '',
  password: '',
});

const loginRules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;

  await loginFormRef.value.validate(async (valid) => {
    if (!valid) return;

    const success = await authStore.login({
      username: loginForm.username,
      password: loginForm.password,
    });

    if (success) {
      ElMessage.success('登录成功');
      router.push('/');
    }
  });
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  padding: 40px;
}

.login-header {
  text-align: center;
  margin-bottom: 40px;
}

.login-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.login-header p {
  font-size: 14px;
  color: #999;
  margin: 0;
}

.login-form {
  margin-top: 30px;
}

.login-button {
  width: 100%;
  margin-top: 10px;
}

.error-alert {
  margin-top: 20px;
}

.login-footer {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
  font-size: 12px;
  color: #999;
}

.login-footer p {
  margin: 4px 0;
}

:deep(.el-input__wrapper) {
  padding: 12px 15px;
}

:deep(.el-button--large) {
  padding: 14px 20px;
  font-size: 16px;
}
</style>
