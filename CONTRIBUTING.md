# 贡献指南

欢迎贡献 MCP Framework Library！

## 如何贡献

### 1. Fork 项目

```bash
# 在 GitHub 上点击 Fork 按钮
```

### 2. 克隆仓库

```bash
git clone https://github.com/YOUR_USERNAME/mcp-framework-library.git
cd mcp-framework-library
```

### 3. 创建分支

```bash
git checkout -b feature/add-vue-support
```

### 4. 开发

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 运行测试
npm test
```

### 5. 提交代码

```bash
git add .
git commit -m "feat: add Vue 3 framework support"
git push origin feature/add-vue-support
```

### 6. 创建 Pull Request

在 GitHub 上创建 PR，描述你的更改。

---

## 代码规范

### 提交信息格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式
- `refactor`: 重构
- `test`: 测试
- `chore`: 构建/工具

**示例:**
```
feat(fastapi): add JWT authentication examples

- Add complete JWT auth implementation
- Include password hashing with bcrypt
- Add OAuth2 password flow
- Add registration endpoint

Closes #12
```

---

## 添加新框架

### 1. 创建框架文档

在 `data/frameworks/` 目录创建 `<framework>.md`:

```markdown
# <Framework Name>

## API Reference

### <API Name>

- **Type**: class/function/hook
- **Signature**: `<signature>`
- **Description**: 描述
- **Example**: 示例代码
```

### 2. 添加示例代码

在 `data/examples/` 目录创建 `<framework>_examples.md`

### 3. 更新工具实现

在 `src/tools/search_api.ts` 中添加框架支持

### 4. 更新文档

- 更新 `README.md` 的支持框架列表
- 更新 `src/server.ts` 的框架枚举

---

## 测试

```bash
# 运行测试
npm test

# 代码检查
npm run lint

# 构建验证
npm run build
```

---

## 问题报告

发现 Bug？请创建 Issue 并提供：
- 问题描述
- 复现步骤
- 预期行为
- 实际行为
- 环境信息（Node.js 版本、操作系统等）

---

## 问题建议

有新功能想法？请创建 Issue 说明：
- 功能描述
- 使用场景
- 实现建议（可选）

---

## 许可证

贡献即表示同意采用 MIT 许可证。

---

感谢你的贡献！🎉
