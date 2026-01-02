# CentOS 7 兼容性说明

> ⚠️ CentOS 7 系统不支持 Node.js 18+，需要特殊配置

---

## 📋 问题说明

### 现象
在 CentOS 7 上安装 Node.js 18+ 时，宝塔面板提示：
```
操作系统版本过低，该Node版本不兼容此操作系统
```

### 原因
- CentOS 7 基于较老的 glibc 版本
- Node.js 18+ 需要更新的系统库
- CentOS 7 官方已停止维护（EOL: 2024年6月30日）

---

## 🎯 解决方案

### 方案一：降级前端构建工具（推荐）⭐

**适用场景**：必须在 CentOS 7 上部署，无法更换系统

#### 步骤 1：修改前端依赖版本

编辑 `client/package.json`，找到以下部分：

**原版本（需要 Node.js 18+）：**
```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.8"
  }
}
```

**修改为（兼容 Node.js 16）：**
```json
{
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.6.2",
    "vite": "^4.5.3"
  }
}
```

#### 步骤 2：删除锁定文件

```bash
cd client
rm package-lock.json
rm -rf node_modules
```

#### 步骤 3：重新安装依赖

使用 Node.js 16.x：

```bash
# 在宝塔终端或文件管理器的终端中
cd /www/wwwroot/你的目录名/client

# 使用 Node.js 16
/www/server/nodejs/v16.20.2/bin/npm install

# 构建项目
/www/server/nodejs/v16.20.2/bin/npm run build
```

#### 步骤 4：后端使用 Node.js 16

后端项目在 Node 项目管理中配置：
- Node 版本：选择 **v16.20.2**
- 后端代码兼容 Node.js 16，无需修改

---

### 方案二：升级操作系统（推荐生产环境）⭐⭐⭐

**适用场景**：可以更换系统，追求长期稳定

#### 推荐系统

| 系统 | 优势 | 缺点 |
|------|------|------|
| **Rocky Linux 8** | CentOS 的继任者，完全兼容 | 需要重装系统 |
| **AlmaLinux 8** | CentOS 的继任者，完全兼容 | 需要重装系统 |
| **Ubuntu 22.04 LTS** | 长期支持，生态好 | 与 CentOS 命令略有不同 |

#### 迁移步骤

1. **备份数据**
   - 备份数据库
   - 备份项目文件
   - 备份配置文件

2. **重装系统**
   - 选择 Rocky Linux 8 或 Ubuntu 22.04
   - 重新安装宝塔面板

3. **恢复项目**
   - 恢复数据库
   - 上传项目文件
   - 按正常流程安装

---

### 方案三：使用 Docker 部署

**适用场景**：熟悉 Docker，需要隔离环境

#### 优势
- ✅ 不受宿主机系统限制
- ✅ 可以使用最新的 Node.js 版本
- ✅ 环境隔离，更安全

#### 步骤

1. **安装 Docker**
```bash
# CentOS 7 可以安装 Docker
yum install -y docker
systemctl start docker
systemctl enable docker
```

2. **创建 Dockerfile**

在项目根目录创建 `Dockerfile`：

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制项目文件
COPY . .

# 安装后端依赖
WORKDIR /app/server
RUN npm install --production

# 构建前端
WORKDIR /app/client
RUN npm install
RUN npm run build

# 回到后端目录
WORKDIR /app/server

EXPOSE 3000

CMD ["node", "index.js"]
```

3. **构建并运行**

```bash
# 构建镜像
docker build -t notification-system .

# 运行容器
docker run -d \
  --name notification \
  -p 3000:3000 \
  -v /path/to/.env:/app/server/.env \
  notification-system
```

---

## 📊 方案对比

| 方案 | 难度 | 兼容性 | 性能 | 推荐度 |
|------|------|--------|------|--------|
| 降级前端工具 | ⭐ 简单 | ⚠️ 临时方案 | ✅ 正常 | ⭐⭐⭐ |
| 升级操作系统 | ⭐⭐⭐ 较难 | ✅ 完美 | ✅ 最佳 | ⭐⭐⭐⭐⭐ |
| Docker 部署 | ⭐⭐ 中等 | ✅ 很好 | ✅ 良好 | ⭐⭐⭐⭐ |

---

## 🔧 详细配置文件

### 兼容 Node.js 16 的 package.json

完整的 `client/package.json`（兼容版本）：

```json
{
  "name": "notification-client",
  "version": "1.0.0",
  "description": "消息通知系统前端 - 基于Vue3的现代化管理界面",
  "author": "Notification System Contributors",
  "license": "MIT",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.11",
    "vue-router": "^4.2.5",
    "axios": "^1.6.2",
    "element-plus": "^2.5.1",
    "@element-plus/icons-vue": "^2.3.1",
    "pinia": "^2.1.7"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.6.2",
    "vite": "^4.5.3"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
```

---

## ⚠️ 注意事项

### 使用降级方案的限制

1. **功能限制**
   - Vite 4 功能略少于 Vite 5
   - 但对本项目影响不大

2. **长期维护**
   - Vite 4 已停止更新
   - 建议尽快迁移到新系统

3. **安全性**
   - CentOS 7 已停止维护
   - 存在安全风险

### 推荐做法

**短期**：使用降级方案快速部署
**长期**：计划迁移到 Rocky Linux 8 或 Ubuntu 22.04

---

## 📝 常见问题

### Q1: 降级后会影响功能吗？
**A**: 不会。本项目使用的 Vue 3 和 Element Plus 功能，Vite 4 完全支持。

### Q2: 后端也需要降级吗？
**A**: 不需要。后端代码兼容 Node.js 16，无需修改。

### Q3: 什么时候应该升级系统？
**A**: 
- 如果是生产环境，建议尽快升级
- CentOS 7 已停止维护，存在安全风险
- 新系统性能更好，支持更多功能

### Q4: 升级系统会丢失数据吗？
**A**: 
- 重装系统会清空数据
- 升级前务必备份数据库和文件
- 建议使用宝塔的备份功能

---

## 🆘 获取帮助

如果在配置过程中遇到问题：

1. 查看 `宝塔安装详细教程.md`
2. 查看 `README.md` 中的常见问题
3. 在 GitHub 提交 Issue
4. 提供详细的错误信息和系统版本

---

## 📌 总结

- ✅ **临时方案**：降级前端工具，使用 Node.js 16
- ✅ **最佳方案**：升级到 Rocky Linux 8 或 Ubuntu 22.04
- ✅ **替代方案**：使用 Docker 部署

**建议**：先用降级方案快速部署，然后计划系统升级。

---

**更新时间**：2025-01-01
**适用版本**：v1.0.0


