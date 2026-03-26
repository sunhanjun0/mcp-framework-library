#!/usr/bin/env node
/**
 * MCP Framework Library Server
 * 
 * Provides framework API documentation and examples for AI agents
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Database } from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// @ts-ignore - better-sqlite3 is CommonJS module
const DatabaseConstructor = Database;

const __dirname = dirname(fileURLToPath(import.meta.url));

// 初始化数据库
const db = new DatabaseConstructor(join(__dirname, '../data/framework_docs.db'));

// 创建 MCP 服务器
const server = new Server(
  {
    name: 'framework-library',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'search_api',
        description: '搜索框架 API 文档。支持按框架名称和关键词搜索 API 定义、参数、返回值等。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['fastapi', 'react', 'express', 'vue', 'django'],
              description: '框架名称',
            },
            keyword: {
              type: 'string',
              description: '搜索关键词，如 "authentication", "router", "component"',
            },
          },
          required: ['framework', 'keyword'],
        },
      },
      {
        name: 'get_example',
        description: '获取框架示例代码。返回特定场景的完整代码示例。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            pattern: {
              type: 'string',
              description: '代码模式，如 "CRUD", "JWT auth", "websocket", "form validation"',
            },
          },
          required: ['framework', 'pattern'],
        },
      },
      {
        name: 'get_best_practice',
        description: '获取框架最佳实践。返回社区推荐的使用模式和常见陷阱。',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            topic: {
              type: 'string',
              description: '主题，如 "performance", "security", "testing", "deployment"',
            },
          },
          required: ['framework', 'topic'],
        },
      },
      {
        name: 'list_frameworks',
        description: '列出所有支持的框架及其版本信息。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'compare_frameworks',
        description: '跨框架对比同一功能的不同实现方式。',
        inputSchema: {
          type: 'object',
          properties: {
            frameworks: {
              type: 'array',
              items: { type: 'string' },
              description: '要对比的框架列表',
            },
            feature: {
              type: 'string',
              description: '要对比的功能，如 "authentication", "routing", "state management"',
            },
          },
          required: ['frameworks', 'feature'],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === 'search_api') {
      const docs = searchDocs(args!.framework as string, args!.keyword as string);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(docs, ensureASCII, 2),
          },
        ],
      };
    }

    if (name === 'get_example') {
      const example = getExampleCode(args!.framework as string, args!.pattern as string);
      return {
        content: [
          {
            type: 'text',
            text: example || '未找到相关示例',
          },
        ],
      };
    }

    if (name === 'get_best_practice') {
      const practices = getBestPractices(args!.framework as string, args!.topic as string);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(practices, ensureASCII, 2),
          },
        ],
      };
    }

    if (name === 'list_frameworks') {
      const frameworks = listFrameworks();
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(frameworks, ensureASCII, 2),
          },
        ],
      };
    }

    if (name === 'compare_frameworks') {
      const comparison = compareFrameworks(
        args!.frameworks as string[],
        args!.feature as string
      );
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(comparison, ensureASCII, 2),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// 辅助函数
function ensureASCII(_: string, value: any): any {
  // 保持中文等非 ASCII 字符
  return value;
}

function searchDocs(framework: string, keyword: string): any[] {
  // TODO: 实现数据库查询
  // 临时返回示例数据
  return [
    {
      framework,
      keyword,
      results: [
        {
          name: `${framework.toUpperCase()} ${keyword}`,
          type: 'API',
          description: `这是 ${framework} 的 ${keyword} 相关 API`,
          signature: `${framework}.method(param: string): Promise<void>`,
          example: `const result = await ${framework}.method("test")`,
        },
      ],
    },
  ];
}

function getExampleCode(framework: string, pattern: string): string {
  // TODO: 从数据库或文件系统加载示例代码
  // 临时返回示例
  const examples: Record<string, Record<string, string>> = {
    fastapi: {
      'jwt auth': `from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

app = FastAPI()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # 验证用户
    access_token = create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return {"username": payload.get("sub")}
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")`,
      crud: `from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI()

class Item(BaseModel):
    id: Optional[int] = None
    name: str
    description: Optional[str] = None
    price: float

items_db = []

@app.post("/items/", response_model=Item)
async def create_item(item: Item):
    items_db.append(item)
    return item

@app.get("/items/", response_model=List[Item])
async def read_items():
    return items_db

@app.get("/items/{item_id}", response_model=Item)
async def read_item(item_id: int):
    for item in items_db:
        if item.id == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")`,
    },
    react: {
      'form validation': `import { useState } from 'react';

function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      // 提交表单
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      {errors.email && <span>{errors.email}</span>}
      <button type="submit">Login</button>
    </form>
  );
}`,
      'state management': `import { useState, useReducer } from 'react';

// 使用 useReducer 管理复杂状态
const initialState = { count: 0 };

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { count: state.count + 1 };
    case 'decrement':
      return { count: state.count - 1 };
    default:
      throw new Error('Unknown action');
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div>
      Count: {state.count}
      <button onClick={() => dispatch({ type: 'increment' })}>+</button>
      <button onClick={() => dispatch({ type: 'decrement' })}>-</button>
    </div>
  );
}`,
    },
  };

  return examples[framework]?.[pattern.toLowerCase()] || '// 示例代码暂未收录';
}

function getBestPractices(framework: string, topic: string): any[] {
  // TODO: 从数据库加载最佳实践
  return [
    {
      framework,
      topic,
      practices: [
        {
          title: `${framework} ${topic} 最佳实践`,
          description: '这是社区推荐的最佳实践',
          code: '// 示例代码',
          impact: '高',
        },
      ],
    },
  ];
}

function listFrameworks(): any {
  return {
    frameworks: [
      {
        name: 'FastAPI',
        version: '0.109.0',
        type: 'backend',
        language: 'Python',
        apis_count: 50,
        examples_count: 20,
      },
      {
        name: 'React',
        version: '18.2.0',
        type: 'frontend',
        language: 'JavaScript/TypeScript',
        apis_count: 45,
        examples_count: 25,
      },
      {
        name: 'Express',
        version: '4.18.2',
        type: 'backend',
        language: 'JavaScript/TypeScript',
        apis_count: 30,
        examples_count: 15,
      },
    ],
  };
}

function compareFrameworks(frameworks: string[], feature: string): any {
  return {
    feature,
    frameworks,
    comparison: frameworks.map((fw) => ({
      framework: fw,
      implementation: `${fw} 的 ${feature} 实现方式`,
      pros: ['优点 1', '优点 2'],
      cons: ['缺点 1'],
      code_example: `// ${fw} 示例`,
    })),
  };
}

// 启动服务器
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Framework Library server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
