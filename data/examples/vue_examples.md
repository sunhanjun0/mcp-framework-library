# Vue 3 示例代码集合

## 1. 组合式 API 基础

### 响应式数据

```vue
<script setup>
import { ref, reactive, computed, watch } from 'vue'

// ref - 基本类型响应式
const count = ref(0)
const message = ref('Hello Vue 3!')

// reactive - 对象类型响应式
const user = reactive({
  name: 'John',
  age: 30,
  email: 'john@example.com'
})

// computed - 计算属性
const doubleCount = computed(() => count.value * 2)
const userInfo = computed(() => `${user.name} (${user.age})`)

// watch - 监听变化
watch(count, (newVal, oldVal) => {
  console.log(`Count changed from ${oldVal} to ${newVal}`)
})

// watch 多个值
watch([count, message], ([newCount, newMessage], [oldCount, oldMessage]) => {
  console.log('Multiple values changed')
})

// 方法
function increment() {
  count.value++
}

function updateUser(newData) {
  Object.assign(user, newData)
}
</script>

<template>
  <div>
    <h1>{{ message }}</h1>
    <p>Count: {{ count }} (Double: {{ doubleCount }})</p>
    <p>User: {{ userInfo }}</p>
    <button @click="increment">Increment</button>
    <button @click="updateUser({ age: user.age + 1 })">Add Year</button>
  </div>
</template>
```

---

## 2. 生命周期钩子

```vue
<script setup>
import { 
  onMounted, 
  onUpdated, 
  onUnmounted,
  onBeforeMount,
  onBeforeUpdate,
  onBeforeUnmount,
  onErrorCaptured
} from 'vue'

// 组件挂载前
onBeforeMount(() => {
  console.log('Component before mount')
})

// 组件挂载后（常用）
onMounted(() => {
  console.log('Component mounted')
  // 发起 API 请求、DOM 操作等
  fetchData()
})

// 组件更新前
onBeforeUpdate(() => {
  console.log('Component before update')
})

// 组件更新后
onUpdated(() => {
  console.log('Component updated')
})

// 组件卸载前
onBeforeUnmount(() => {
  console.log('Component before unmount')
})

// 组件卸载后（清理定时器、事件监听器等）
onUnmounted(() => {
  console.log('Component unmounted')
  cleanup()
})

// 错误捕获
onErrorCaptured((err, instance, info) => {
  console.error('Error captured:', err)
  return false // 阻止错误继续向上传播
})

async function fetchData() {
  // 模拟 API 请求
  await new Promise(resolve => setTimeout(resolve, 1000))
  console.log('Data fetched')
}

function cleanup() {
  // 清理资源
  console.log('Resources cleaned up')
}
</script>

<template>
  <div>
    <h1>生命周期示例</h1>
    <p>查看控制台输出</p>
  </div>
</template>
```

---

## 3. 组件通信

### 父传子 (Props)

```vue
<!-- ParentComponent.vue -->
<script setup>
import { ref } from 'vue'
import ChildComponent from './ChildComponent.vue'

const message = ref('Hello from parent')
const count = ref(0)
</script>

<template>
  <ChildComponent 
    :message="message" 
    :count="count"
    @update="count++"
  />
</template>
```

```vue
<!-- ChildComponent.vue -->
<script setup>
import { defineProps, defineEmits } from 'vue'

// 定义 props
const props = defineProps({
  message: {
    type: String,
    required: true,
    default: ''
  },
  count: {
    type: Number,
    default: 0
  },
  tags: {
    type: Array,
    default: () => []
  }
})

// 定义 emits
const emit = defineEmits(['update', 'delete'])

function handleClick() {
  emit('update')
}

function handleDelete() {
  emit('delete', props.count)
}
</script>

<template>
  <div>
    <h2>{{ message }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="handleClick">Update Parent</button>
    <button @click="handleDelete">Delete</button>
  </div>
</template>
```

### 子传父 (Emits)

```vue
<!-- 见上面 ChildComponent.vue -->
```

### 兄弟组件通信 (Event Bus / Pinia)

```vue
<!-- 使用 Pinia (推荐) -->
<!-- stores/counter.js -->
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0,
    name: 'Vue Counter'
  }),
  getters: {
    doubleCount: (state) => state.count * 2,
  },
  actions: {
    increment() {
      this.count++
    },
    setCount(value) {
      this.count = value
    }
  }
})
```

```vue
<!-- ComponentA.vue -->
<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()

function increment() {
  counterStore.increment()
}
</script>

<template>
  <button @click="increment">
    Count: {{ counterStore.count }}
  </button>
</template>
```

```vue
<!-- ComponentB.vue -->
<script setup>
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
</script>

<template>
  <div>
    <p>Count from Component B: {{ counterStore.count }}</p>
    <p>Double: {{ counterStore.doubleCount }}</p>
  </div>
</template>
```

---

## 4. 表单处理

### 基础表单

```vue
<script setup>
import { ref, reactive } from 'vue'

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  skills: []
})

const errors = reactive({})

const skillOptions = ['JavaScript', 'Vue', 'React', 'Node.js', 'Python']

function validate() {
  // 清空错误
  Object.keys(errors).forEach(key => delete errors[key])
  
  // 验证用户名
  if (!form.username) {
    errors.username = '用户名是必填项'
  } else if (form.username.length < 3) {
    errors.username = '用户名至少 3 个字符'
  }
  
  // 验证邮箱
  if (!form.email) {
    errors.email = '邮箱是必填项'
  } else if (!/\S+@\S+\.\S+/.test(form.email)) {
    errors.email = '邮箱格式不正确'
  }
  
  // 验证密码
  if (!form.password) {
    errors.password = '密码是必填项'
  } else if (form.password.length < 6) {
    errors.password = '密码至少 6 个字符'
  }
  
  // 验证确认密码
  if (form.password && form.confirmPassword !== form.password) {
    errors.confirmPassword = '两次密码输入不一致'
  }
  
  // 验证条款
  if (!form.acceptTerms) {
    errors.acceptTerms = '必须接受条款'
  }
  
  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validate()) {
    return
  }
  
  try {
    // 提交到后端
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    
    if (response.ok) {
      alert('注册成功！')
      // 重置表单
      form.username = ''
      form.email = ''
      form.password = ''
      form.confirmPassword = ''
      form.acceptTerms = false
      form.skills = []
    }
  } catch (error) {
    console.error('注册失败:', error)
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <!-- 用户名 -->
    <div>
      <label>用户名</label>
      <input 
        v-model="form.username" 
        type="text"
        :class="{ error: errors.username }"
      />
      <span v-if="errors.username" class="error-text">
        {{ errors.username }}
      </span>
    </div>

    <!-- 邮箱 -->
    <div>
      <label>邮箱</label>
      <input 
        v-model="form.email" 
        type="email"
        :class="{ error: errors.email }"
      />
      <span v-if="errors.email" class="error-text">
        {{ errors.email }}
      </span>
    </div>

    <!-- 密码 -->
    <div>
      <label>密码</label>
      <input 
        v-model="form.password" 
        type="password"
        :class="{ error: errors.password }"
      />
      <span v-if="errors.password" class="error-text">
        {{ errors.password }}
      </span>
    </div>

    <!-- 确认密码 -->
    <div>
      <label>确认密码</label>
      <input 
        v-model="form.confirmPassword" 
        type="password"
        :class="{ error: errors.confirmPassword }"
      />
      <span v-if="errors.confirmPassword" class="error-text">
        {{ errors.confirmPassword }}
      </span>
    </div>

    <!-- 技能多选 -->
    <div>
      <label>技能</label>
      <div v-for="skill in skillOptions" :key="skill">
        <label>
          <input 
            type="checkbox" 
            v-model="form.skills" 
            :value="skill"
          />
          {{ skill }}
        </label>
      </div>
    </div>

    <!-- 条款 -->
    <div>
      <label>
        <input 
          type="checkbox" 
          v-model="form.acceptTerms"
        />
        接受服务条款
      </label>
      <span v-if="errors.acceptTerms" class="error-text">
        {{ errors.acceptTerms }}
      </span>
    </div>

    <!-- 提交按钮 -->
    <button type="submit">注册</button>
  </form>
</template>

<style scoped>
.error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
}
</style>
```

### 使用 VeeValidate (推荐)

```vue
<script setup>
import { useForm, Field, ErrorMessage } from 'vee-validate'
import * as yup from 'yup'

// 定义验证规则
const schema = yup.object({
  username: yup
    .string()
    .required('用户名是必填项')
    .min(3, '用户名至少 3 个字符'),
  email: yup
    .string()
    .required('邮箱是必填项')
    .email('邮箱格式不正确'),
  password: yup
    .string()
    .required('密码是必填项')
    .min(6, '密码至少 6 个字符'),
  confirmPassword: yup
    .string()
    .required('请确认密码')
    .oneOf([yup.ref('password')], '两次密码输入不一致'),
  acceptTerms: yup
    .boolean()
    .oneOf([true], '必须接受条款')
})

const { handleSubmit, resetForm } = useForm({
  validationSchema: schema
})

const onSubmit = handleSubmit(async (values) => {
  try {
    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values)
    })
    
    if (response.ok) {
      alert('注册成功！')
      resetForm()
    }
  } catch (error) {
    console.error('注册失败:', error)
  }
})
</script>

<template>
  <form @submit="onSubmit">
    <Field name="username" type="text" placeholder="用户名" />
    <ErrorMessage name="username" />

    <Field name="email" type="email" placeholder="邮箱" />
    <ErrorMessage name="email" />

    <Field name="password" type="password" placeholder="密码" />
    <ErrorMessage name="password" />

    <Field name="confirmPassword" type="password" placeholder="确认密码" />
    <ErrorMessage name="confirmPassword" />

    <label>
      <Field name="acceptTerms" type="checkbox" />
      接受服务条款
    </label>
    <ErrorMessage name="acceptTerms" />

    <button type="submit">注册</button>
  </form>
</template>
```

---

## 5. HTTP 请求

### 使用 Axios

```vue
<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  config => {
    // 添加 token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // 未授权，跳转登录
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 状态
const users = ref([])
const loading = ref(false)
const error = ref(null)

// 获取用户列表
async function fetchUsers() {
  loading.value = true
  error.value = null
  
  try {
    const response = await api.get('/users')
    users.value = response.data
  } catch (err) {
    error.value = err.message
    console.error('获取用户失败:', err)
  } finally {
    loading.value = false
  }
}

// 创建用户
async function createUser(userData) {
  try {
    const response = await api.post('/users', userData)
    users.value.push(response.data)
    return response.data
  } catch (err) {
    console.error('创建用户失败:', err)
    throw err
  }
}

// 更新用户
async function updateUser(id, userData) {
  try {
    const response = await api.put(`/users/${id}`, userData)
    const index = users.value.findIndex(u => u.id === id)
    if (index !== -1) {
      users.value[index] = response.data
    }
    return response.data
  } catch (err) {
    console.error('更新用户失败:', err)
    throw err
  }
}

// 删除用户
async function deleteUser(id) {
  try {
    await api.delete(`/users/${id}`)
    users.value = users.value.filter(u => u.id !== id)
  } catch (err) {
    console.error('删除用户失败:', err)
    throw err
  }
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUsers()
})
</script>

<template>
  <div>
    <h1>用户列表</h1>
    
    <div v-if="loading">加载中...</div>
    <div v-else-if="error">错误：{{ error }}</div>
    <div v-else>
      <ul>
        <li v-for="user in users" :key="user.id">
          {{ user.name }} - {{ user.email }}
          <button @click="deleteUser(user.id)">删除</button>
        </li>
      </ul>
    </div>
  </div>
</template>
```

### 使用 Vue Query (推荐)

```vue
<script setup>
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'

// 获取用户列表
function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('获取用户失败')
      }
      return response.json()
    }
  })
}

// 创建用户
function useCreateUser() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (userData) => {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })
      return response.json()
    },
    onSuccess: () => {
      // 使查询失效，重新获取
      queryClient.invalidateQueries(['users'])
    }
  })
}

// 使用
const { data: users, isLoading, error } = useUsers()
const createUser = useCreateUser()

function handleCreate() {
  createUser.mutate({
    name: 'New User',
    email: 'new@example.com'
  })
}
</script>

<template>
  <div>
    <h1>用户列表</h1>
    
    <div v-if="isLoading">加载中...</div>
    <div v-else-if="error">错误：{{ error.message }}</div>
    <ul v-else>
      <li v-for="user in users" :key="user.id">
        {{ user.name }} - {{ user.email }}
      </li>
    </ul>
    
    <button @click="handleCreate" :disabled="createUser.isPending">
      {{ createUser.isPending ? '创建中...' : '创建用户' }}
    </button>
  </div>
</template>
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **使用组合式 API** - 更好的代码组织和类型推断
2. **使用 `<script setup>`** - 更简洁的语法
3. **使用 Pinia 状态管理** - 替代 Vuex
4. **使用 Vue Query** - 服务端状态管理
5. **使用 VeeValidate** - 表单验证
6. **使用 TypeScript** - 类型安全

### ❌ 避免做法

1. 避免在模板中写复杂逻辑
2. 避免滥用全局状态
3. 避免忘记清理副作用
4. 避免直接使用 props（应该用计算属性或 watch）

### 📦 推荐依赖

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.6.0",
    "@tanstack/vue-query": "^5.0.0",
    "vee-validate": "^4.12.0",
    "yup": "^1.3.0"
  }
}
```
