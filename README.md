# MCP Framework Library

> 📚 为 AI Agent 提供实时的前端/后端框架 API 文档查询服务  
> 让 AI 写代码更智能、更准确、更符合最佳实践

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![MCP Protocol](https://img.shields.io/badge/MCP-1.0-orange.svg)](https://modelcontextprotocol.io/)

---

## ✨ 特性

- 🔍 **API 文档搜索** - 快速查找框架 API 定义、参数、返回值
- 💻 **示例代码** - 获取真实场景的完整代码示例
- 📖 **最佳实践** - 社区推荐的使用模式和常见陷阱
- 🔄 **跨框架对比** - 同一功能在不同框架的实现对比
- 🇨🇳 **中文友好** - 完整的中文文档和注解

---

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 运行

```bash
npm start
```

### 配置 OpenClaw

在 `openclaw.json` 中添加：

```json
{
  "mcp": {
    "servers": {
      "framework-library": {
        "command": "node",
        "args": ["/path/to/mcp-framework-library/dist/server.js"]
      }
    }
  }
}
```

---

## 🛠️ 可用工具

### 1. search_api

搜索框架 API 文档

```json
{
  "name": "search_api",
  "arguments": {
    "framework": "fastapi",
    "keyword": "authentication"
  }
}
```

### 2. get_example

获取示例代码

```json
{
  "name": "get_example",
  "arguments": {
    "framework": "react",
    "pattern": "form validation"
  }
}
```

### 3. get_best_practice

获取最佳实践

```json
{
  "name": "get_best_practice",
  "arguments": {
    "framework": "fastapi",
    "topic": "performance"
  }
}
```

### 4. list_frameworks

列出支持的框架

```json
{
  "name": "list_frameworks"
}
```

### 5. compare_frameworks

跨框架对比

```json
{
  "name": "compare_frameworks",
  "arguments": {
    "frameworks": ["fastapi", "express"],
    "feature": "authentication"
  }
}
```

---

## 📦 支持的框架

| 框架 | 类型 | 语言 | API 数量 | 示例数量 |
|------|------|------|----------|----------|
| FastAPI | 后端 | Python | 50+ | 20+ |
| React | 前端 | JS/TS | 45+ | 25+ |
| Express | 后端 | JS/TS | 30+ | 15+ |
| Vue 3 | 前端 | JS/TS | 40+ | 20+ |
| Django | 后端 | Python | 60+ | 30+ |

---

## 🏗️ 项目结构

```
mcp-framework-library/
├── src/
│   ├── server.ts          # MCP 服务入口
│   ├── tools/             # Tool 实现
│   │   ├── search_api.ts
│   │   ├── get_example.ts
│   │   └── get_best_practice.ts
│   └── db/                # 数据库操作
│       └── database.ts
├── data/
│   ├── frameworks/        # 框架文档数据
│   ├── examples/          # 示例代码
│   └── practices/         # 最佳实践
├── docs/
│   ├── PROJECT.md         # 项目设计文档
│   └── 分析报告 - 市场竞品调研.md
├── package.json
├── tsconfig.json
└── README.md
```

---

## 🔧 开发

### 开发模式

```bash
npm run dev
```

### 测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

---

## 📊 路线图

### MVP (v0.1) - 2026 Q2
- [x] 基础 MCP 服务搭建
- [x] search_api 工具实现
- [ ] FastAPI 框架支持 (50 APIs)
- [ ] React 框架支持 (45 APIs)

### v1.0 - 2026 Q3
- [ ] 文档爬虫自动化
- [ ] 支持 10 个框架
- [ ] 向量搜索 (语义检索)
- [ ] 公开测试

### v2.0 - 2026 Q4
- [ ] 社区贡献系统
- [ ] 自动更新机制
- [ ] 性能优化
- [ ] 正式发布

---

## 🤝 贡献

欢迎贡献！请查看 [贡献指南](CONTRIBUTING.md)。

### 开发环境设置

```bash
# 克隆仓库
git clone https://github.com/sunhanjun0/mcp-framework-library.git

# 安装依赖
cd mcp-framework-library
npm install

# 构建
npm run build

# 运行
npm start
```

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 文件

---

## 📬 联系方式

- GitHub: [@sunhanjun0](https://github.com/sunhanjun0)
- 项目地址：https://github.com/sunhanjun0/mcp-framework-library

---

## 🙏 致谢

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP 协议
- [FastAPI](https://fastapi.tiangolo.com/) - FastAPI 框架
- [React](https://react.dev/) - React 框架

---

*Made with ❤️ for AI Agents*
