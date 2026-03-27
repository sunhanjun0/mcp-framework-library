# Docker 部署指南

## 🚀 快速开始

### 1. 构建镜像

```bash
# 克隆项目
git clone https://github.com/sunhanjun0/mcp-framework-library.git
cd mcp-framework-library

# 构建 Docker 镜像
docker build -t mcp-framework-library .
```

### 2. 运行容器

**方法 1: 使用 docker run**

```bash
docker run -d \
  --name mcp-framework \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -e NODE_ENV=production \
  mcp-framework-library
```

**方法 2: 使用 docker-compose（推荐）**

```bash
docker-compose up -d
```

### 3. 验证运行

```bash
# 查看日志
docker logs -f mcp-framework

# 或
docker-compose logs -f

# 检查容器状态
docker ps

# 测试服务
echo '{"name":"list_frameworks"}' | docker exec -i mcp-framework node dist/server.js
```

---

## 📋 配置说明

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `NODE_ENV` | production | 运行环境 |
| `MCP_PORT` | 3000 | 服务端口 |

### 数据卷

| 路径 | 说明 |
|------|------|
| `./data` | SQLite 数据库文件 |
| `./logs` | 日志文件（可选） |

### 端口映射

| 容器端口 | 主机端口 | 说明 |
|----------|----------|------|
| 3000 | 3000 | MCP 服务 |

---

## 🔧 常用命令

### 容器管理

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 重启
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 进入容器
docker-compose exec mcp-framework bash
```

### 数据管理

```bash
# 备份数据库
docker cp mcp-framework:/app/data/framework_docs.db ./backup.db

# 恢复数据库
docker cp ./backup.db mcp-framework:/app/data/framework_docs.db
docker-compose restart

# 重置数据库
docker-compose exec mcp-framework npm run init-db
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并重启
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 🐛 故障排除

### 问题 1: 容器启动失败

```bash
# 查看详细日志
docker-compose logs mcp-framework

# 检查端口占用
lsof -i :3000

# 检查 Docker 状态
docker info
```

### 问题 2: 数据库初始化失败

```bash
# 进入容器
docker-compose exec mcp-framework bash

# 手动初始化
npm run init-db

# 检查权限
ls -la data/
```

### 问题 3: 内存不足

```bash
# 限制容器内存
docker-compose up -d --build

# 在 docker-compose.yml 中添加：
# services:
#   mcp-framework:
#     deploy:
#       resources:
#         limits:
#           memory: 512M
```

### 问题 4: ARM64 架构问题

```bash
# 指定平台构建
docker build --platform linux/arm64 -t mcp-framework-library .

# 或使用多架构镜像
docker buildx build --platform linux/amd64,linux/arm64 -t mcp-framework-library .
```

---

## 📊 性能优化

### 1. 使用多阶段构建

```dockerfile
# 开发环境使用完整镜像
FROM node:20-bookworm AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

# 生产环境使用精简镜像
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/data ./data
RUN npm ci --only=production
CMD ["npm", "start"]
```

### 2. 添加 Redis 缓存

取消 `docker-compose.yml` 中 Redis 服务的注释：

```yaml
services:
  redis:
    image: redis:7-alpine
    volumes:
      - redis-data:/data
```

### 3. 日志轮转

创建 `docker-compose.override.yml`：

```yaml
version: '3.8'

services:
  mcp-framework:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

---

## 🔐 安全建议

### 1. 非 root 用户运行

在 `Dockerfile` 中添加：

```dockerfile
# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs
```

### 2. 只读文件系统

```yaml
services:
  mcp-framework:
    read_only: true
    tmpfs:
      - /tmp
    volumes:
      - ./data:/app/data
```

### 3. 网络隔离

```yaml
networks:
  mcp-network:
    driver: bridge
    internal: true  # 禁止外网访问
```

---

## 📈 监控

### Prometheus + Grafana

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
```

### 健康检查

```bash
# 定期检查容器健康
docker inspect --format='{{.State.Health.Status}}' mcp-framework

# 或使用 docker-compose
docker-compose ps
```

---

## 💾 备份与恢复

### 备份

```bash
# 备份整个数据目录
tar -czf mcp-backup-$(date +%Y%m%d).tar.gz ./data

# 备份到远程
scp ./data/framework_docs.db user@remote:/backup/
```

### 恢复

```bash
# 解压备份
tar -xzf mcp-backup-20260326.tar.gz

# 重启容器
docker-compose restart
```

---

## 🎯 生产环境部署

### Kubernetes

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mcp-framework
spec:
  replicas: 3
  selector:
    matchLabels:
      app: mcp-framework
  template:
    metadata:
      labels:
        app: mcp-framework
    spec:
      containers:
      - name: mcp-framework
        image: sunhanjun0/mcp-framework-library:latest
        ports:
        - containerPort: 3000
        volumeMounts:
        - name: data
          mountPath: /app/data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: mcp-data-pvc
```

### Docker Swarm

```bash
# 初始化 Swarm
docker swarm init

# 部署服务
docker service create \
  --name mcp-framework \
  --replicas 3 \
  -p 3000:3000 \
  --mount type=volume,source=mcp-data,target=/app/data \
  mcp-framework-library
```

---

## 📚 相关资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 参考](https://docs.docker.com/compose/)
- [本项目 GitHub](https://github.com/sunhanjun0/mcp-framework-library)

---

**祝你部署顺利！** 🚀
