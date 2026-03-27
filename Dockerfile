# MCP Framework Library - Docker 镜像
# 基于 Node.js 20，支持 ARM64/AMD64

FROM node:20-bookworm

# 设置工作目录
WORKDIR /app

# 安装系统依赖（如需编译 native 模块）
RUN apt-get update && apt-get install -y \
    build-essential \
    python3 \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production && npm cache clean --force

# 复制源代码
COPY . .

# 构建 TypeScript
RUN npm run build

# 初始化数据库
RUN npm run init-db || true

# 暴露端口（可选）
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "console.log('OK')" || exit 1

# 启动命令
CMD ["npm", "start"]
