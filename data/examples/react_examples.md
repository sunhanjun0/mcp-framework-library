# React 示例代码集合

## 1. 表单验证完整示例

### 基础版本

```jsx
import { useState } from 'react';

function LoginForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    
    // 邮箱验证
    if (!formData.email) {
      newErrors.email = '邮箱是必填项';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '邮箱格式不正确';
    }
    
    // 密码验证
    if (!formData.password) {
      newErrors.password = '密码是必填项';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少 6 个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    if (validate()) {
      try {
        // 提交到后端
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        
        if (response.ok) {
          alert('登录成功！');
        }
      } catch (error) {
        setErrors({ submit: '登录失败，请重试' });
      }
    }
    
    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
        />
        {errors.email && <span className="error-text">{errors.email}</span>}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={errors.password ? 'error' : ''}
        />
        {errors.password && <span className="error-text">{errors.password}</span>}
      </div>

      {errors.submit && <div className="error-text">{errors.submit}</div>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

export default LoginForm;
```

### 使用 React Hook Form (推荐)

```jsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

// 定义验证规则
const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 个字符'),
});

function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        alert('登录成功！');
      }
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email">邮箱</label>
        <input
          id="email"
          type="email"
          {...register('email')}
        />
        {errors.email && (
          <span className="error-text">{errors.email.message}</span>
        )}
      </div>

      <div>
        <label htmlFor="password">密码</label>
        <input
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <span className="error-text">{errors.password.message}</span>
        )}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '登录中...' : '登录'}
      </button>
    </form>
  );
}

export default LoginForm;
```

---

## 2. 数据获取最佳实践

### 使用 useEffect (基础)

```jsx
import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const abortController = new AbortController();

    async function fetchUser() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/users/${userId}`,
          { signal: abortController.signal }
        );
        
        if (!response.ok) {
          throw new Error('用户不存在');
        }
        
        const data = await response.json();
        
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled && err.name !== 'AbortError') {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchUser();

    // 清理函数
    return () => {
      cancelled = true;
      abortController.abort();
    };
  }, [userId]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误：{error}</div>;
  if (!user) return <div>用户不存在</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

export default UserProfile;
```

### 使用 React Query (推荐)

```jsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 获取用户
function useUser(userId) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) {
        throw new Error('用户不存在');
      }
      return response.json();
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 分钟
  });
}

// 更新用户
function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, data }) => {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data, { userId }) => {
      // 更新缓存
      queryClient.setQueryData(['user', userId], data);
      // 使相关查询失效
      queryClient.invalidateQueries(['users']);
    },
  });
}

// 使用示例
function UserProfile({ userId }) {
  const { data: user, isLoading, error } = useUser(userId);
  const updateUser = useUpdateUser();

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误：{error.message}</div>;

  const handleUpdate = () => {
    updateUser.mutate({
      userId,
      data: { name: '新名字' },
    });
  };

  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={handleUpdate}>
        {updateUser.isPending ? '更新中...' : '更新名字'}
      </button>
    </div>
  );
}
```

---

## 3. 状态管理对比

### useState (简单场景)

```jsx
function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

### useReducer (复杂状态)

```jsx
const initialState = {
  count: 0,
  history: [],
};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        count: state.count + 1,
        history: [...state.history, state.count + 1],
      };
    case 'decrement':
      return {
        ...state,
        count: state.count - 1,
        history: [...state.history, state.count - 1],
      };
    case 'reset':
      return initialState;
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

function CounterWithHistory() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      <p>Count: {state.count}</p>
      <p>History: {state.history.join(' → ')}</p>
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
      <button onClick={() => dispatch({ type: 'reset' })}>重置</button>
    </div>
  );
}
```

### Zustand (全局状态 - 推荐)

```jsx
import { create } from 'zustand';

// 创建 store
const useStore = create((set) => ({
  count: 0,
  history: [],
  
  increment: () => set((state) => ({
    count: state.count + 1,
    history: [...state.history, state.count + 1],
  })),
  
  decrement: () => set((state) => ({
    count: state.count - 1,
    history: [...state.history, state.count - 1],
  })),
  
  reset: () => set({ count: 0, history: [] }),
}));

// 使用
function Counter() {
  const { count, history, increment, decrement, reset } = useStore();

  return (
    <div>
      <p>Count: {count}</p>
      <p>History: {history.join(' → ')}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>重置</button>
    </div>
  );
}
```

---

## 4. 性能优化

### React.memo 避免不必要的渲染

```jsx
import React, { memo, useState } from 'react';

// 子组件使用 memo
const ExpensiveComponent = memo(({ data, onAction }) => {
  console.log('ExpensiveComponent rendered');
  
  return (
    <div>
      <p>{data}</p>
      <button onClick={onAction}>Action</button>
    </div>
  );
});

// 父组件
function Parent() {
  const [count, setCount] = useState(0);
  const [data, setData] = useState('test');

  // 使用 useCallback 缓存函数
  const handleAction = useCallback(() => {
    console.log('Action triggered');
  }, []);

  return (
    <div>
      <button onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
      <input 
        value={data} 
        onChange={(e) => setData(e.target.value)} 
      />
      {/* 只有 data 变化时才会重新渲染 */}
      <ExpensiveComponent data={data} onAction={handleAction} />
    </div>
  );
}
```

### useMemo 缓存计算结果

```jsx
function ExpensiveCalculation({ items, filter }) {
  // 缓存过滤和排序结果
  const filteredItems = useMemo(() => {
    console.log('Filtering items...');
    return items
      .filter(item => item.category === filter)
      .sort((a, b) => a.price - b.price);
  }, [items, filter]);

  return (
    <ul>
      {filteredItems.map(item => (
        <li key={item.id}>{item.name} - ${item.price}</li>
      ))}
    </ul>
  );
}
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **表单验证**: 使用 React Hook Form + Zod
2. **数据获取**: 使用 React Query / SWR
3. **状态管理**: 
   - 简单用 useState
   - 复杂用 useReducer
   - 全局用 Zustand/Redux
4. **性能优化**: React.memo + useMemo + useCallback

### ❌ 避免做法

1. 不要在 useEffect 中忘记清理
2. 不要滥用 useContext 导致不必要的渲染
3. 不要在渲染函数中创建新对象/数组作为 prop
4. 不要忽略 key prop 或错误使用 index 作为 key

### 📦 推荐依赖

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.0",
    "@hookform/resolvers": "^3.3.0",
    "zod": "^3.22.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.5.0"
  }
}
```
