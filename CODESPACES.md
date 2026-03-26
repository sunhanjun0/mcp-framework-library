# GitHub Codespaces 部署指南

## 🚀 快速开始

### 1. 在 Codespaces 中打开项目

**方法一：从 GitHub 网站**

1. 访问 https://github.com/sunhanjun0/mcp-framework-library
2. 点击 **Code** 按钮（绿色）
3. 切换到 **Codespaces** 标签
4. 点击 **Create codespace on main**
5. 等待 Codespace 启动（约 1-2 分钟）

**方法二：从 VS Code**

1. 打开 VS Code
2. 按 `F1` 打开命令面板
3. 输入 `Codespaces: Create New Codespace`
4. 选择 `sunhanjun0/mcp-framework-library`
5. 选择分支 `main`

**方法三：使用 CLI**

```bash
# 安装 GitHub CLI
gh codespace create --repo sunhanjun0/mcp-framework-library
```

---

## ⚙️ 自动配置

Codespace 启动后会自动执行：

```bash
npm install          # 安装依赖
npm run build        # 构建 TypeScript
npm run init-db      # 初始化数据库
```

完成后你会看到：
```
✅ MCP Framework Library 已就绪！运行 npm start 启动服务
```

---

## 🛠️ 开发环境

### 预装工具

- ✅ Node.js 20
- ✅ npm 9+
- ✅ TypeScript 5
- ✅ Python 3.11
- ✅ GitHub CLI
- ✅ Git

### 预装扩展

- ✅ ESLint
- ✅ Prettier
- ✅ TypeScript
- ✅ Python (Pylance)
- ✅ GitHub Copilot
- ✅ Jupyter
- ✅ Code Spell Checker

---

## 📝 使用方式

### 启动 MCP 服务

```bash
# 在终端运行
npm start
```

### 测试工具调用

打开新终端：

```bash
# 测试搜索 API
echo '{"name":"list_frameworks"}' | node dist/server.js
```

### 运行测试

```bash
# 运行单元测试
npm test

# 代码检查
npm run lint

# 重新构建
npm run build
```

---

## 🔧 配置说明

### devcontainer.json

```json
{
  "name": "MCP Framework Library",
  "image": "mcr.microsoft.com/devcontainers/typescript-node:1-20-bookworm",
  "features": {
    "github-cli": {},
    "python": "3.11"
  },
  "forwardPorts": [3000],
  "postCreateCommand": "npm install && npm run build && npm run init-db"
}
```

### 端口转发

| 端口 | 用途 | 自动转发 |
|------|------|----------|
| 3000 | MCP Server | ✅ |

---

## 💾 持久化存储

Codespace 会保留：

- ✅ `node_modules/` - npm 依赖
- ✅ `data/*.db` - SQLite 数据库
- ✅ 所有源代码文件

**注意：** Codespace 30 天不活动会自动删除。重要代码请推送到 GitHub。

---

## 🔄 更新 Codespace

### 拉取最新代码

```bash
git pull origin main
npm install
npm run build
```

### 重建 Codespace

1. 在 GitHub 上进入你的 Codespace
2. 点击 **...** (更多操作)
3. 选择 **Rebuild container**

---

## 🐛 故障排除

### 问题 1: npm install 失败

```bash
# 清理缓存
npm cache clean --force

# 删除 node_modules
rm -rf node_modules package-lock.json

# 重新安装
npm install
```

### 问题 2: TypeScript 构建错误

```bash
# 清理构建输出
rm -rf dist

# 重新构建
npm run build
```

### 问题 3: 数据库初始化失败

```bash
# 删除旧数据库
rm data/*.db

# 重新初始化
npm run init-db
```

### 问题 4: 端口被占用

```bash
# 查看占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

---

## 📊 资源限制

| 资源 | 限制 |
|------|------|
| CPU | 2 核 |
| 内存 | 4 GB |
| 存储 | 32 GB |
| 超时 | 30 分钟无活动 |

---

## 🔐 安全建议

1. **不要提交敏感信息**
   - 使用 `.env` 文件存储密钥
   - 将 `.env` 添加到 `.gitignore`

2. **定期备份**
   - 推送代码到 GitHub
   - 下载重要数据文件

3. **使用私人 Codespace**
   - 不要共享你的 Codespace
   - 定期删除不用的 Codespace

---

## 💰 费用说明

GitHub Codespaces 免费额度：

- **个人账户：** 每月 60 小时（2 核）
- **Pro 账户：** 每月 120 小时（4 核）
- **企业账户：** 自定义

**本项目消耗：** 约 2 核，在免费额度内

查看使用情况：
https://github.com/settings/billing

---

## 🎯 下一步

1. ✅ 在 Codespace 中打开项目
2. ✅ 等待自动配置完成
3. ✅ 运行 `npm start` 启动服务
4. ✅ 开始开发！

---

## 📚 相关资源

- [GitHub Codespaces 文档](https://docs.github.com/codespaces)
- [devcontainer.json 参考](https://containers.dev/implementors/json_reference/)
- [本项目 GitHub](https://github.com/sunhanjun0/mcp-framework-library)

---

**祝你开发愉快！** 🚀
