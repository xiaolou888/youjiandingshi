# 贡献指南

感谢你考虑为消息通知系统做出贡献！我们欢迎任何形式的贡献。

## 📋 贡献方式

### 🐛 报告Bug

如果你发现了bug，请通过以下步骤报告：

1. 在 [Issues](https://github.com/xiaolou888/dingshitongzhi/issues) 中搜索，确保该bug未被报告
2. 如果没有找到相关issue，创建新的issue
3. 提供以下信息：
   - Bug的详细描述
   - 复现步骤
   - 期望的行为
   - 实际的行为
   - 截图（如适用）
   - 环境信息（操作系统、Node.js版本、浏览器等）

### 💡 功能建议

我们欢迎新功能的建议：

1. 在 [Issues](https://github.com/xiaolou888/dingshitongzhi/issues) 中搜索，确保该功能未被提出
2. 创建新的issue，标记为 `enhancement`
3. 详细描述：
   - 功能的用途和场景
   - 期望的实现方式
   - 可能的替代方案

### 💻 提交代码

#### 开发流程

1. **Fork 项目**
   ```bash
   # 在GitHub上点击Fork按钮
   ```

2. **克隆到本地**
   ```bash
   git clone https://github.com/your-username/dingshitongzhi.git
   cd dingshitongzhi
   ```

3. **创建特性分支**
   ```bash
   git checkout -b feature/your-feature-name
   # 或
   git checkout -b fix/your-bug-fix
   ```

4. **安装依赖**
   ```bash
   # 后端
   cd server
   npm install
   
   # 前端
   cd ../client
   npm install
   ```

5. **进行开发**
   - 遵循现有的代码风格
   - 添加必要的注释
   - 确保代码可读性

6. **测试你的更改**
   - 测试所有相关功能
   - 确保没有破坏现有功能

7. **提交更改**
   ```bash
   git add .
   git commit -m "feat: 添加某某功能"
   # 或
   git commit -m "fix: 修复某某bug"
   ```

8. **推送到GitHub**
   ```bash
   git push origin feature/your-feature-name
   ```

9. **创建 Pull Request**
   - 在GitHub上创建Pull Request
   - 详细描述你的更改
   - 关联相关的issue（如有）

## 📝 代码规范

### Git Commit 规范

我们使用语义化的commit message：

- `feat`: 新功能
- `fix`: Bug修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```bash
feat: 添加每季度通知功能
fix: 修复邮件发送失败的问题
docs: 更新部署文档
```

### 代码风格

#### JavaScript/Vue
- 使用2空格缩进
- 使用单引号
- 行末不加分号（除非必要）
- 变量命名使用驼峰命名法
- 组件命名使用帕斯卡命名法

#### 注释
- 为复杂逻辑添加注释
- 公共函数添加JSDoc注释
- 注释使用中文

```javascript
/**
 * 计算下次执行时间
 * @param {string} type - 通知类型
 * @param {Date} date - 基准日期
 * @returns {Date} 下次执行时间
 */
function calculateNextTime(type, date) {
  // 实现逻辑...
}
```

## 🔍 代码审查

所有的Pull Request都需要经过代码审查：

- 代码符合规范
- 功能正常工作
- 没有引入新的bug
- 文档已更新（如需要）

## 📚 文档

如果你的更改涉及到用户可见的功能，请更新相关文档：

- `README.md` - 主要说明
- `使用手册.md` - 使用说明
- `宝塔部署文档.md` - 部署指南
- 其他相关文档

## 🌍 翻译

我们欢迎将文档翻译成其他语言：

1. 在 `docs/` 目录下创建语言文件夹（如 `docs/en/`）
2. 翻译相关文档
3. 在 `README.md` 中添加语言链接

## 💬 讨论

有任何问题或想法，欢迎：

- 在 [Issues](https://github.com/xiaolou888/dingshitongzhi/issues) 中提问
- 在 [Discussions](https://github.com/xiaolou888/dingshitongzhi/discussions) 中讨论

## ⚖️ 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](./LICENSE) 下发布。

## 🙏 感谢

感谢你的贡献！每一个贡献都让这个项目变得更好。

