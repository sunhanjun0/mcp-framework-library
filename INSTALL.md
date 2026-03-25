# 安装指南

## 系统要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- 支持的平台：macOS, Linux, Windows (WSL2 推荐)

---

## 快速安装

### 1. 克隆仓库

```bash
git clone https://github.com/sunhanjun0/mcp-framework-library.git
cd mcp-framework-library
```

### 2. 安装依赖

```bash
npm install
```

### 3. 初始化数据库

```bash
npm run init-db
```

### 4. 构建项目

```bash
npm run build
```

### 5. 运行服务

```bash
npm start
```

---

## 配置 OpenClaw

在 `openclaw.json` 中添加 MCP 服务器配置：

```json
{
  "mcp": {
    "servers": {
      "framework-library": {
        "command": "node",
        "args": ["/absolute/path/to/mcp-framework-library/dist/server.js"]
      }
    }
  }
}
```

**注意：** 使用绝对路径！

### 获取绝对路径

```bash
# macOS/Linux
pwd

# Windows PowerShell
Get-Location
```

---

## 开发模式

### 监听模式

```bash
# 自动编译 TypeScript
npm run dev
```

### 调试模式

```bash
# 使用 Node.js 调试器
node --inspect dist/server.js
```

然后在 Chrome 中访问 `chrome://inspect`

---

## 测试

### 运行测试

```bash
npm test
```

### 代码检查

```bash
npm run lint
```

---

## 常见问题

### 问题 1: npm install 失败

**错误信息：**
```
npm ERR! node-gyp failed to compile better-sqlite3
```

**解决方案：**

```bash
# 安装构建工具
# macOS
xcode-select --install

# Ubuntu/Debian
sudo apt-get install build-essential

# Windows
npm install --global windows-build-tools
```

### 问题 2: 数据库初始化失败

**错误信息：**
```
Error: ENOENT: no such file or directory
```

**解决方案：**

```bash
# 确保 data 目录存在
mkdir -p data

# 重新运行初始化
npm run init-db
```

### 问题 3: OpenClaw 无法连接

**错误信息：**
```
MCP server connection failed
```

**解决方案：**

1. 检查路径是否正确（使用绝对路径）
2. 确保已构建：`npm run build`
3. 检查 Node.js 版本：`node --version` (需要 >= 18)
4. 查看日志：
   ```bash
   node dist/server.js 2>&1 | tee server.log
   ```

---

## 验证安装

### 测试 MCP 服务

```bash
# 直接运行
node dist/server.js

# 应该看到：
# MCP Framework Library server running on stdio
```

### 测试工具调用

使用 MCP 客户端测试：

```json
{
  "name": "list_frameworks"
}
```

预期返回：
```json
{
  "frameworks": [
    {
      "name": "FastAPI",
      "version": "0.109.0",
      "type": "backend"
    },
    ...
  ]
}
```

---

## 卸载

```bash
# 删除 node_modules
rm -rf node_modules

# 删除构建文件
rm -rf dist

# 删除数据库
rm data/framework_docs.db
```

---

## 升级

```bash
# 拉取最新代码
git pull origin main

# 重新安装依赖
npm install

# 重新构建
npm run build

# 更新数据库（如果有新数据）
npm run init-db
```

---

## 性能优化

### 生产环境建议

1. **使用 PM2 管理进程**
   ```bash
   npm install -g pm2
   pm2 start dist/server.js --name mcp-framework
   ```

2. **启用缓存**
   ```bash
   # 安装 Redis
   brew install redis  # macOS
   sudo systemctl start redis  # Linux
   ```

3. **使用 TypeScript 编译优化**
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "optimizeForProgramSize": true
     }
   }
   ```

---

## 获取帮助

- 📖 [README.md](README.md) - 项目说明
- 📝 [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- 🐛 [GitHub Issues](https://github.com/sunhanjun0/mcp-framework-library/issues) - 问题反馈
- 💬 [GitHub Discussions](https://github.com/sunhanjun0/mcp-framework-library/discussions) - 讨论

---

祝你安装顺利！🎉
