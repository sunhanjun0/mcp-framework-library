/**
 * search_api 工具实现
 * 搜索框架 API 文档
 */

import { Database } from 'better-sqlite3';

export interface SearchArgs {
  framework: string;
  keyword: string;
}

export interface SearchResult {
  id: string;
  name: string;
  type: string;
  description: string;
  signature?: string;
  parameters?: any[];
  returns?: string;
  example?: string;
  best_practices?: string[];
  related_apis?: string[];
}

export function searchDocs(db: Database, args: SearchArgs): SearchResult[] {
  const { framework, keyword } = args;

  try {
    // 尝试从数据库查询
    const stmt = db.prepare(`
      SELECT * FROM apis 
      WHERE framework = ? AND (
        name LIKE ? OR 
        description LIKE ? OR 
        signature LIKE ?
      )
      LIMIT 20
    `);

    const searchPattern = `%${keyword}%`;
    const results = stmt.all(framework, searchPattern, searchPattern, searchPattern) as SearchResult[];

    if (results.length > 0) {
      return results;
    }

    // 如果数据库没有数据，返回示例数据
    return getExampleSearchResults(framework, keyword);
  } catch (error) {
    // 数据库不存在或出错时返回示例数据
    return getExampleSearchResults(framework, keyword);
  }
}

function getExampleSearchResults(framework: string, keyword: string): SearchResult[] {
  const examples: Record<string, Record<string, SearchResult[]>> = {
    fastapi: {
      auth: [
        {
          id: 'fastapi_oauth2',
          name: 'OAuth2PasswordBearer',
          type: 'class',
          description: 'OAuth2 密码流认证，用于实现用户名/密码登录',
          signature: 'OAuth2PasswordBearer(tokenUrl: str, scopes: dict = None)',
          parameters: [
            { name: 'tokenUrl', type: 'str', description: '获取 token 的 URL' },
            { name: 'scopes', type: 'dict', description: 'OAuth 作用域', optional: true }
          ],
          returns: '可调用对象，用于依赖注入获取 token',
          example: `from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    return {"token": token}`,
          best_practices: [
            '始终使用 HTTPS 传输 token',
            '设置合理的 token 过期时间',
            '使用 scopes 实现细粒度权限控制'
          ],
          related_apis: ['Depends', 'HTTPBearer', 'create_access_token']
        },
        {
          id: 'fastapi_jwt',
          name: 'JWT Token 创建',
          type: 'function',
          description: '创建 JWT 访问令牌',
          signature: 'create_access_token(data: dict, expires_delta: timedelta = None) -> str',
          parameters: [
            { name: 'data', type: 'dict', description: '要编码的数据，通常包含用户信息' },
            { name: 'expires_delta', type: 'timedelta', description: '令牌过期时间', optional: true }
          ],
          returns: 'JWT token 字符串',
          example: `from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)`,
          best_practices: [
            'SECRET_KEY 使用环境变量存储',
            'access token 有效期建议 15-30 分钟',
            '配合 refresh token 使用'
          ],
          related_apis: ['jwt.decode', 'OAuth2PasswordBearer']
        }
      ],
      router: [
        {
          id: 'fastapi_api_router',
          name: 'APIRouter',
          type: 'class',
          description: 'API 路由器，用于组织和管理 API 路由',
          signature: 'APIRouter(prefix: str = "", tags: list = None, dependencies: list = None)',
          parameters: [
            { name: 'prefix', type: 'str', description: '路由前缀', optional: true },
            { name: 'tags', type: 'list', description: 'OpenAPI 标签', optional: true },
            { name: 'dependencies', type: 'list', description: '路由器级别的依赖', optional: true }
          ],
          returns: 'APIRouter 实例',
          example: `from fastapi import APIRouter

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/")
async def read_users():
    return [{"username": "Rick"}, {"username": "Morty"}]

app.include_router(router)`,
          best_practices: [
            '按功能模块拆分路由器',
            '使用 tags 组织 OpenAPI 文档',
            '在路由器级别设置公共依赖'
          ],
          related_apis: ['FastAPI', 'include_router', 'Depends']
        }
      ],
      crud: [
        {
          id: 'fastapi_crud_create',
          name: '创建资源',
          type: 'pattern',
          description: '使用 POST 创建新资源的标准模式',
          signature: '@app.post("/items/", response_model=Item)',
          example: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from typing import Optional

app = FastAPI()

class ItemCreate(BaseModel):
    name: str
    email: EmailStr
    description: Optional[str] = None
    price: float

class Item(ItemCreate):
    id: int
    owner_id: int

    class Config:
        from_attributes = True

@app.post("/items/", response_model=Item)
async def create_item(item: ItemCreate):
    # 验证业务逻辑
    if item.price < 0:
        raise HTTPException(status_code=400, detail="Price must be positive")
    
    # 创建资源 (实际应从数据库)
    new_item = {
        "id": 1,
        "owner_id": 1,
        **item.model_dump()
    }
    return new_item`,
          best_practices: [
            '使用 Pydantic 模型验证输入',
            '区分 Create 和 Response 模型',
            '返回 201 Created 状态码',
            '添加适当的错误处理'
          ],
          related_apis: ['HTTPException', 'BaseModel', 'status.HTTP_201_CREATED']
        }
      ]
    },
    react: {
      state: [
        {
          id: 'react_useState',
          name: 'useState',
          type: 'hook',
          description: 'React Hook 用于在函数组件中添加状态',
          signature: 'const [state, setState] = useState(initialState)',
          parameters: [
            { name: 'initialState', type: 'any', description: '初始状态值' }
          ],
          returns: '[当前状态值，状态更新函数]',
          example: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}`,
          best_practices: [
            '状态更新是异步的',
            '如果新状态依赖旧状态，使用函数式更新',
            '避免将派生值存入状态'
          ],
          related_apis: ['useEffect', 'useReducer', 'useMemo']
        }
      ],
      effect: [
        {
          id: 'react_useEffect',
          name: 'useEffect',
          type: 'hook',
          description: '处理副作用的 Hook，如数据获取、订阅等',
          signature: 'useEffect(() => { ... }, [dependencies])',
          example: `import { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const response = await fetch(\`/api/users/\${userId}\`);
        const data = await response.json();
        if (!cancelled) {
          setUser(data);
          setLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchUser();

    // 清理函数
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}`,
          best_practices: [
            '始终指定依赖数组',
            '清理副作用避免内存泄漏',
            '使用 AbortController 取消请求'
          ],
          related_apis: ['useState', 'useCallback', 'useRef']
        }
      ]
    }
  };

  // 查找匹配的示例
  const frameworkExamples = examples[framework.toLowerCase()];
  if (!frameworkExamples) {
    return [{
      id: `${framework}_${keyword}`,
      name: `${framework} ${keyword}`,
      type: 'API',
      description: `这是 ${framework} 的 ${keyword} 相关 API（示例数据）`,
      signature: `${framework}.method(param: string): Promise<void>`,
      example: `// 示例代码待完善\nconst result = await ${framework}.method("test")`,
      best_practices: ['待完善'],
      related_apis: []
    }];
  }

  // 搜索匹配的关键词
  const keywordLower = keyword.toLowerCase();
  for (const [key, results] of Object.entries(frameworkExamples)) {
    if (key.includes(keywordLower) || keywordLower.includes(key)) {
      return results;
    }
  }

  // 返回第一个匹配的示例或默认示例
  const firstKey = Object.keys(frameworkExamples)[0];
  return frameworkExamples[firstKey] || [];
}
