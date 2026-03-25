# MCP Framework Library - AI 框架文档图书馆

> 为 AI Agent 提供实时的前端/后端框架 API 文档查询服务  
> 让 AI 写代码更智能、更准确、更符合最佳实践

---

## 📋 目录

1. [项目概述](#1-项目概述)
2. [核心价值](#2-核心价值)
3. [架构设计](#3-架构设计)
4. [技术实现](#4-技术实现)
5. [数据结构](#5-数据结构)
6. [文档来源](#6-文档来源)
7. [支持框架](#7-支持框架)
8. [快速开始](#8-快速开始)
9. [开发计划](#9-开发计划)
10. [进阶功能](#10-进阶功能)

---

## 1. 项目概述

### 1.1 背景痛点

当前 AI 编程助手存在以下问题：

| 问题 | 描述 | 影响 |
|------|------|------|
| **API 记忆有限** | AI 无法记住所有框架的 API 细节 | 生成的代码经常出错 |
| **文档过时** | 训练数据截止后新版本的 API 不知道 | 代码不兼容新版本 |
| **缺少最佳实践** | AI 不知道框架推荐的使用模式 | 代码能跑但不规范 |
| **上下文限制** | 无法在 prompt 中放入完整文档 | Token 消耗大且效率低 |

### 1.2 解决方案

**MCP Framework Library** 是一个基于 Model Context Protocol (MCP) 的服务，为 AI Agent 提供：

- ✅ 实时框架 API 文档查询
- ✅ 示例代码检索
- ✅ 最佳实践推荐
- ✅ 版本信息同步
- ✅ 按需加载，节省 Token

### 1.3 使用场景

```
┌─────────────────────────────────────────────────────────┐
│  用户：用 FastAPI 写一个带 JWT 认证的用户登录接口            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  AI Agent                                                │
│  1. 调用 MCP: search_api("fastapi", "authentication")   │
│  2. 调用 MCP: get_example("fastapi", "jwt auth")        │
│  3. 基于返回文档生成代码                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  返回完整、准确、符合最佳实践的代码                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. 核心价值

### 2.1 对 AI Agent 的价值

| 价值 | 说明 |
|------|------|
| **准确性提升** | 基于官方文档，减少错误代码 |
| **时效性保证** | 实时同步最新版本 API |
| **规范性增强** | 遵循框架最佳实践 |
| **Token 节省** | 按需查询，不占用上下文窗口 |

### 2.2 对开发者的价值

| 价值 | 说明 |
|------|------|
| **减少调试时间** | AI 生成的代码更可靠 |
| **学习成本降低** | 自动获取示例和最佳实践 |
| **代码质量提升** | 符合社区规范 |

### 2.3 与其他方案对比

| 方案 | 准确性 | 时效性 | 易用性 | Token 消耗 |
|------|--------|--------|--------|------------|
| **MCP Framework Library** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| AI 内置知识 | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| RAG 文档检索 | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 手动粘贴文档 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## 3. 架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    AI Agent (Codex/Claude)                   │
│                    (通过 OpenClaw 调用)                        │
└────────────────────┬─────────────────────────────────────────┘
                     │ MCP Protocol (stdio/SSE)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              MCP Server (framework-library)                  │
├─────────────────────────────────────────────────────────────┤
│  Tools API:                                                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ search_api(keyword, framework) → API 文档 + 示例      │    │
│  │ get_example(framework, pattern) → 示例代码           │    │
│  │ get_best_practice(framework, topic) → 最佳实践       │    │
│  │ check_version(framework) → 版本信息                   │    │
│  │ list_frameworks() → 支持的框架列表                   │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│  数据存储层：                                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  PostgreSQL  │  │   ChromaDB   │  │   Redis      │      │
│  │  (文档存储)  │  │  (向量搜索)  │  │   (缓存)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│  数据同步层：                                                │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Docs Crawler  →  官方文档定时爬取                   │    │
│  │  GitHub Sync   →  示例仓库收集                       │    │
│  │  Community     →  StackOverflow/Reddit 高票答案     │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
用户请求
   │
   ▼
AI Agent 分析需求
   │
   ▼
调用 MCP Tool (search_api / get_example)
   │
   ▼
MCP Server 查询数据库
   │
   ▼
返回结构化文档数据
   │
   ▼
AI Agent 生成代码
   │
   ▼
返回给用户
```

---

## 4. 技术实现

### 4.1 技术栈选型

| 层级 | 技术 | 说明 |
|------|------|------|
| **MCP 协议** | @modelcontextprotocol/sdk | 官方 SDK |
| **服务端** | Node.js / Python | 两种实现可选 |
| **文档存储** | PostgreSQL / SQLite | 结构化文档数据 |
| **向量搜索** | ChromaDB / Pinecone | 语义搜索 (可选) |
| **缓存** | Redis | 热点数据缓存 |
| **爬虫** | Playwright + BeautifulSoup | 文档爬取 |

### 4.2 Node.js 实现

```typescript
// server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const server = new Server(
  {
    name: 'framework-library',
    version: '1.0.0',
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
        description: '搜索框架 API 文档',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              enum: ['react', 'vue', 'express', 'fastapi', 'django', 'nextjs'],
              description: '框架名称',
            },
            keyword: {
              type: 'string',
              description: '搜索关键词',
            },
          },
          required: ['framework', 'keyword'],
        },
      },
      {
        name: 'get_example',
        description: '获取框架示例代码',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            pattern: {
              type: 'string',
              description: '代码模式，如 CRUD, auth, websocket',
            },
          },
          required: ['framework', 'pattern'],
        },
      },
      {
        name: 'get_best_practice',
        description: '获取框架最佳实践',
        inputSchema: {
          type: 'object',
          properties: {
            framework: {
              type: 'string',
              description: '框架名称',
            },
            topic: {
              type: 'string',
              description: '主题，如 performance, security, testing',
            },
          },
          required: ['framework', 'topic'],
        },
      },
    ],
  };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search_api') {
    const docs = await searchDocs(args!.framework, args!.keyword);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(docs, null, 2),
        },
      ],
    };
  }

  if (name === 'get_example') {
    const example = await getExampleCode(args!.framework, args!.pattern);
    return {
      content: [
        {
          type: 'text',
          text: example,
        },
      ],
    };
  }

  if (name === 'get_best_practice') {
    const practices = await getBestPractices(args!.framework, args!.topic);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(practices, null, 2),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// 启动服务
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Framework Library server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
```

### 4.3 Python 实现

```python
# server.py
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent
import json

server = Server("framework-library")

@server.list_tools()
async def list_tools():
    return [
        Tool(
            name="search_api",
            description="搜索框架 API 文档",
            inputSchema={
                "type": "object",
                "properties": {
                    "framework": {
                        "type": "string",
                        "enum": ["react", "vue", "express", "fastapi", "django"],
                        "description": "框架名称"
                    },
                    "keyword": {
                        "type": "string",
                        "description": "搜索关键词"
                    }
                },
                "required": ["framework", "keyword"]
            }
        ),
        Tool(
            name="get_example",
            description="获取框架示例代码",
            inputSchema={
                "type": "object",
                "properties": {
                    "framework": {"type": "string"},
                    "pattern": {
                        "type": "string",
                        "description": "代码模式，如 CRUD, auth, websocket"
                    }
                },
                "required": ["framework", "pattern"]
            }
        ),
        Tool(
            name="get_best_practice",
            description="获取框架最佳实践",
            inputSchema={
                "type": "object",
                "properties": {
                    "framework": {"type": "string"},
                    "topic": {
                        "type": "string",
                        "description": "主题，如 performance, security"
                    }
                },
                "required": ["framework", "topic"]
            }
        )
    ]

@server.call_tool()
async def call_tool(name: str, arguments: dict):
    if name == "search_api":
        docs = search_docs(arguments["framework"], arguments["keyword"])
        return [TextContent(
            type="text",
            text=json.dumps(docs, ensure_ascii=False, indent=2)
        )]
    
    elif name == "get_example":
        example = get_example_code(arguments["framework"], arguments["pattern"])
        return [TextContent(type="text", text=example)]
    
    elif name == "get_best_practice":
        practices = get_best_practices(arguments["framework"], arguments["topic"])
        return [TextContent(
            type="text",
            text=json.dumps(practices, ensure_ascii=False, indent=2)
        )]
    
    else:
        raise ValueError(f"Unknown tool: {name}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(server.run(stdio_server()))
```

---

## 5. 数据结构

### 5.1 API 文档结构

```json
{
  "framework": "fastapi",
  "version": "0.109.0",
  "last_updated": "2026-03-25",
  "apis": [
    {
      "id": "fastapi_app_init",
      "name": "FastAPI",
      "type": "class",
      "module": "fastapi",
      "signature": "FastAPI(debug=False, title='My API', version='1.0.0', docs_url='/docs')",
      "description": "创建 FastAPI 应用实例",
      "parameters": [
        {
          "name": "debug",
          "type": "bool",
          "default": "False",
          "required": false,
          "description": "启用调试模式，生产环境应设为 False"
        },
        {
          "name": "title",
          "type": "str",
          "default": "'My API'",
          "required": false,
          "description": "API 标题，显示在文档中"
        },
        {
          "name": "version",
          "type": "str",
          "default": "'1.0.0'",
          "required": false,
          "description": "API 版本号"
        },
        {
          "name": "docs_url",
          "type": "str",
          "default": "'/docs'",
          "required": false,
          "description": "Swagger UI 文档路径"
        }
      ],
      "returns": "FastAPI 应用实例",
      "example": "app = FastAPI(title='My App', version='1.0.0')",
      "examples": [
        {
          "title": "基础用法",
          "code": "from fastapi import FastAPI\n\napp = FastAPI()"
        },
        {
          "title": "完整配置",
          "code": "app = FastAPI(\n    title='My API',\n    version='1.0.0',\n    description='API 描述',\n    debug=False\n)"
        }
      ],
      "best_practices": [
        "使用环境变量配置 title 和 version",
        "生产环境设置 debug=False",
        "使用 lifespan 管理应用生命周期"
      ],
      "related_apis": ["app.run", "app.add_api_route"],
      "changelog": [
        {
          "version": "0.109.0",
          "change": "添加 lifespan 支持"
        }
      ]
    }
  ]
}
```

### 5.2 示例代码结构

```json
{
  "id": "fastapi_jwt_auth",
  "framework": "fastapi",
  "pattern": "authentication",
  "title": "JWT 认证完整示例",
  "description": "使用 PyJWT 实现用户登录认证",
  "dependencies": [
    "fastapi>=0.109.0",
    "python-jose[cryptography]",
    "passlib[bcrypt]",
    "python-multipart"
  ],
  "code": "from fastapi import FastAPI, Depends, HTTPException, status\nfrom fastapi.security import OAuth2PasswordBearer\nfrom jose import JWTError, jwt\nfrom passlib.context import CryptContext\nfrom datetime import datetime, timedelta\n\napp = FastAPI()\n\n# 配置\nSECRET_KEY = \"your-secret-key\"\nALGORITHM = \"HS256\"\nACCESS_TOKEN_EXPIRE_MINUTES = 30\n\npwd_context = CryptContext(schemes=[\"bcrypt\"], deprecated=\"auto\")\noauth2_scheme = OAuth2PasswordBearer(tokenUrl=\"token\")\n\ndef verify_password(plain_password, hashed_password):\n    return pwd_context.verify(plain_password, hashed_password)\n\ndef create_access_token(data: dict, expires_delta: timedelta = None):\n    to_encode = data.copy()\n    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))\n    to_encode.update({\"exp\": expire})\n    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)\n\n@app.post(\"/token\")\nasync def login(form_data: OAuth2PasswordRequestForm = Depends()):\n    # 验证用户 (实际应从数据库查询)\n    if not verify_password(form_data.password, \"hashed_password_from_db\"):\n        raise HTTPException(status_code=400, detail=\"Incorrect username or password\")\n    \n    access_token = create_access_token(\n        data={\"sub\": form_data.username},\n        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)\n    )\n    return {\"access_token\": access_token, \"token_type\": \"bearer\"}\n\n@app.get(\"/users/me\")\nasync def read_users_me(token: str = Depends(oauth2_scheme)):\n    try:\n        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])\n        username: str = payload.get(\"sub\")\n        if username is None:\n            raise HTTPException(status_code=401, detail=\"Invalid token\")\n    except JWTError:\n        raise HTTPException(status_code=401, detail=\"Invalid token\")\n    return {\"username\": username}",
  "tags": ["auth", "jwt", "security"],
  "difficulty": "intermediate",
  "references": [
    "https://fastapi.tiangolo.com/tutorial/security/",
    "https://fastapi.tiangolo.com/tutorial/security/oauth2-jwt/"
  ]
}
```

### 5.3 最佳实践结构

```json
{
  "framework": "fastapi",
  "topic": "performance",
  "practices": [
    {
      "title": "使用异步数据库驱动",
      "description": "使用 databases 或 SQLAlchemy 2.0 异步模式",
      "code": "from databases import Database\n\ndatabase = Database(\"postgresql+async://localhost/mydb\")\n\n@app.on_event(\"startup\")\nasync def startup():\n    await database.connect()\n\n@app.on_event(\"shutdown\")\nasync def shutdown():\n    await database.disconnect()",
      "impact": "高",
      "effort": "中"
    },
    {
      "title": "启用响应压缩",
      "description": "使用 GzipMiddleware 压缩响应",
      "code": "from fastapi.middleware.gzip import GZipMiddleware\n\napp.add_middleware(GZipMiddleware, minimum_size=1000)",
      "impact": "中",
      "effort": "低"
    },
    {
      "title": "使用缓存",
      "description": "使用 Redis 缓存热点数据",
      "code": "from redis import asyncio as aioredis\n\nredis = aioredis.from_url(\"redis://localhost\")\n\n@app.get(\"/items/{item_id}\")\nasync def get_item(item_id: str):\n    cached = await redis.get(f\"item:{item_id}\")\n    if cached:\n        return json.loads(cached)\n    # 从数据库查询...\n    await redis.setex(f\"item:{item_id}\", 300, json.dumps(item))",
      "impact": "高",
      "effort": "中"
    }
  ]
}
```

---

## 6. 文档来源

### 6.1 官方文档爬虫

```python
# crawlers/fastapi_crawler.py
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin

class FastAPICrawler:
    BASE_URL = 'https://fastapi.tiangolo.com'
    
    def crawl_tutorial(self):
        """爬取教程文档"""
        urls = [
            '/tutorial/',
            '/tutorial/body/',
            '/tutorial/path-params/',
            '/tutorial/query-params/',
        ]
        
        for url in urls:
            full_url = urljoin(self.BASE_URL, url)
            response = requests.get(full_url)
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取内容
            content = self.extract_content(soup)
            self.save_to_db(content)
    
    def crawl_reference(self):
        """爬取 API 参考文档"""
        # 类似实现...
        pass
    
    def extract_content(self, soup):
        """提取文档内容"""
        return {
            'title': soup.find('h1').text if soup.find('h1') else '',
            'content': soup.find('article').text if soup.find('article') else '',
            'code_examples': self.extract_code_examples(soup),
        }
    
    def extract_code_examples(self, soup):
        """提取代码示例"""
        examples = []
        for code_block in soup.find_all('pre'):
            examples.append(code_block.text)
        return examples
```

### 6.2 GitHub 示例收集

```python
# collectors/github_collector.py
from github import Github

class GitHubCollector:
    def __init__(self, token):
        self.g = Github(token)
    
    def collect_examples(self, framework):
        """收集框架示例仓库"""
        repos = {
            'fastapi': [
                'tiangolo/fastapi',
                'fastapi/full-stack-fastapi-template',
            ],
            'react': [
                'facebook/react',
                'vercel/next.js',
            ],
        }
        
        examples = []
        for repo_path in repos.get(framework, []):
            repo = self.g.get_repo(repo_path)
            # 收集 examples 目录
            examples.extend(self.collect_from_repo(repo))
        
        return examples
```

### 6.3 社区资源

| 来源 | 内容 | 更新频率 |
|------|------|----------|
| StackOverflow | 高票答案 | 每周 |
| Reddit r/webdev | 热门讨论 | 每周 |
| Dev.to | 教程文章 | 每周 |
| Medium | 最佳实践 | 每周 |
| GitHub Issues | 常见问题 | 每日 |

---

## 7. 支持框架

### 7.1 MVP 阶段 (P0)

| 框架 | 类型 | 文档量 | 优先级 |
|------|------|--------|--------|
| **FastAPI** | 后端 API | ~200 APIs | P0 |
| **React** | 前端 UI | ~150 APIs | P0 |
| **Express** | 后端 Web | ~100 APIs | P0 |

### 7.2 v1.0 阶段 (P1)

| 框架 | 类型 | 文档量 | 优先级 |
|------|------|--------|--------|
| **Vue 3** | 前端 UI | ~180 APIs | P1 |
| **Django** | 后端全栈 | ~300 APIs | P1 |
| **Next.js** | 全栈 | ~120 APIs | P1 |
| **Prisma** | ORM | ~80 APIs | P1 |

### 7.3 v2.0 阶段 (P2)

| 框架 | 类型 | 文档量 | 优先级 |
|------|------|--------|--------|
| **Svelte** | 前端 UI | ~100 APIs | P2 |
| **Flask** | 后端 Web | ~80 APIs | P2 |
| **SQLAlchemy** | ORM | ~150 APIs | P2 |
| **React Native** | 移动端 | ~200 APIs | P2 |

---

## 8. 快速开始

### 8.1 环境准备

```bash
# 创建项目目录
mkdir mcp-framework-library
cd mcp-framework-library

# 初始化项目
npm init -y

# 安装依赖
npm install @modelcontextprotocol/sdk
npm install typescript @types/node
npm install pg chromadb redis
```

### 8.2 项目结构

```
mcp-framework-library/
├── server/
│   ├── server.ts          # MCP 服务入口
│   ├── tools/             # Tool 实现
│   │   ├── search_api.ts
│   │   ├── get_example.ts
│   │   └── get_best_practice.ts
│   └── db/                # 数据库操作
│       ├── postgres.ts
│       └── chroma.ts
├── crawlers/
│   ├── fastapi_crawler.py
│   ├── react_crawler.py
│   └── base_crawler.py
├── data/
│   ├── frameworks/        # 框架文档数据
│   ├── examples/          # 示例代码
│   └── practices/         # 最佳实践
├── openclaw.json          # OpenClaw 配置
├── package.json
└── README.md
```

### 8.3 OpenClaw 配置

```json
// openclaw.json
{
  "mcp": {
    "servers": {
      "framework-library": {
        "command": "node",
        "args": ["/path/to/mcp-framework-library/server/dist/server.js"],
        "env": {
          "DATABASE_URL": "postgresql://user:pass@localhost:5432/framework_docs",
          "REDIS_URL": "redis://localhost:6379"
        }
      }
    }
  }
}
```

### 8.4 测试调用

```bash
# 启动 MCP 服务
node server/dist/server.js

# 在另一个终端测试 (使用 MCP 客户端)
npx @modelcontextprotocol/inspector
```

---

## 9. 开发计划

### 9.1 里程碑

```
Week 1-2: MVP
├── 基础 MCP 服务搭建
├── 实现 search_api tool
├── 手动录入 FastAPI 50 个核心 API
└── 本地测试

Week 3-4: v0.5
├── 实现 get_example tool
├── 实现 get_best_practice tool
├── 添加 React 框架支持
└── OpenClaw 集成测试

Month 2: v1.0
├── 文档爬虫自动化
├── 支持 10 个框架
├── 向量搜索 (语义检索)
└── 公开测试

Month 3: v2.0
├── 社区贡献系统
├── 自动更新机制
├── 性能优化
└── 正式发布
```

### 9.2 工作量估算

| 阶段 | 内容 | 时间 | 人力 |
|------|------|------|------|
| **MVP** | 1 框架 + 基础搜索 | 1-2 周 | 1 人 |
| **v0.5** | 3 框架 + 完整 tools | 2 周 | 1 人 |
| **v1.0** | 10 框架 + 爬虫 | 1 个月 | 1-2 人 |
| **v2.0** | 全功能 + 优化 | 2 个月 | 2 人 |

---

## 10. 进阶功能

### 10.1 语义搜索

```python
# 使用向量数据库实现语义搜索
from chromadb import Client

client = Client()
collection = client.get_collection('framework_docs')

# 用户问："怎么创建 API 路由？"
results = collection.query(
    query_texts=["如何定义 HTTP 端点"],
    n_results=3,
    where={"framework": "fastapi"}
)

# 返回语义相关的文档，即使用户用词不同
```

### 10.2 版本对比

```json
{
  "api": "FastAPI",
  "changes": [
    {
      "from_version": "0.104.0",
      "to_version": "0.109.0",
      "breaking_changes": [],
      "new_features": [
        "添加 lifespan 事件支持",
        "改进依赖注入性能"
      ],
      "deprecated": []
    }
  ]
}
```

### 10.3 智能推荐

```
当用户请求："写一个用户注册接口"

MCP 自动推荐：
1. FastAPI 路由定义
2. Pydantic 模型验证
3. 密码哈希 (passlib)
4. 数据库操作 (SQLAlchemy)
5. 邮件发送示例
```

### 10.4 代码片段收藏

```
用户可收藏常用模式：
- ⭐ FastAPI JWT 认证
- ⭐ React Hooks 表单验证
- ⭐ Express 中间件链

收藏后可通过快捷命令调用
```

---

## 附录

### A. 相关资源

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [OpenClaw 文档](https://docs.openclaw.ai/)
- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 文档](https://react.dev/)

### B. 联系方式

- GitHub: [待创建]
- Discord: [待创建]
- 邮件: [待创建]

### C. 许可证

MIT License

---

*最后更新：2026-03-25*
