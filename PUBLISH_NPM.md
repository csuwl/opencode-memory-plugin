# 发布到 npm 指南

## 前提条件

- npm 账户（如果没有，请到 https://www.npmjs.com/ 注册）
- 已登录 npm（运行 `npm login`）

## 发布步骤

### 1. 登录 npm

```bash
npm login
```

输入：
- 用户名: `csuwl`
- 密码: `your_password`
- 邮箱: `1105865632@qq.com`

### 2. 确认包名未被占用

```bash
npm view @csuwl/opencode-memory-plugin
```

如果提示 `404 Not Found`，说明包名可用。如果显示包信息，说明包名已被占用，需要更换包名。

### 3. 打包测试（推荐）

```bash
cd opencode-memory-plugin
npm pack
npm install ./csuwl-opencode-memory-plugin-1.0.0.tgz -g
```

检查安装是否成功：
```bash
ls ~/.opencode/memory/
cat ~/.config/opencode/opencode.json | grep memory
```

### 4. 发布到 npm

```bash
cd opencode-memory-plugin
npm publish --access public
```

如果是首次发布作用域包（@csuwl/），必须使用 `--access public` 参数。

### 5. 验证发布

```bash
npm view @csuwl/opencode-memory-plugin
```

应该能看到包的信息。

## 发布后的使用

用户可以通过以下方式安装：

### 方式 1: npm 全局安装（推荐）

```bash
npm install @csuwl/opencode-memory-plugin -g
```

安装后自动配置，无需任何手动操作！

### 方式 2: npm 本地安装

```bash
npm install @csuwl/opencode-memory-plugin
npx opencode-memory-plugin
```

### 方式 3: 从 GitHub 安装

```bash
git clone https://github.com/csuwl/opencode-memory-plugin.git
cd opencode-memory-plugin
bash opencode-memory-plugin/scripts/init.sh
```

## 更新版本

### 修改版本号

编辑 `opencode-memory-plugin/package.json`，更新版本号：
```json
{
  "version": "1.0.1"
}
```

或者使用 npm 命令：
```bash
npm version patch    # 1.0.0 -> 1.0.1
npm version minor    # 1.0.0 -> 1.1.0
npm version major    # 1.0.0 -> 2.0.0
```

### 提交并推送

```bash
git add opencode-memory-plugin/package.json
git commit -m "Bump version to 1.0.1"
git push origin main
```

### 发布新版本

```bash
cd opencode-memory-plugin
npm publish --access public
```

## 常见问题

### Q: 提示 "401 Unauthorized"
A: 需要先登录 npm，运行 `npm login`

### Q: 提示 "403 Forbidden"
A: 包名已被占用，需要更换包名

### Q: 提示 "E404 package not found"
A: 可能是网络问题或 npm registry 配置问题，检查：
```bash
npm config get registry
# 应该显示: https://registry.npmjs.org/
```

### Q: 发布成功但搜索不到
A: 搜索索引可能需要几分钟更新，可以尝试：
```bash
npm view @csuwl/opencode-memory-plugin
```

### Q: 如何撤销已发布的版本？
A: npm 不允许撤销已发布的版本，但可以弃用：
```bash
npm deprecate @csuwl/opencode-memory-plugin@1.0.0 "This version has security issues"
```

## 发布检查清单

发布前请确认：

- [ ] 已登录 npm
- [ ] 包名未被占用
- [ ] package.json 配置正确
- [ ] README.npm.md 文档完整
- [ ] 本地安装测试通过
- [ ] 版本号已更新
- [ ] Git 提交已推送

## 有用的 npm 命令

```bash
# 查看包信息
npm view @csuwl/opencode-memory-plugin

# 查看包的所有版本
npm view @csuwl/opencode-memory-plugin versions

# 查看包的依赖
npm view @csuwl/opencode-memory-plugin dependencies

# 查看已发布的包列表
npm ls --depth=0 -g | grep opencode-memory-plugin

# 卸载包
npm uninstall @csuwl/opencode-memory-plugin -g
```

## 注意事项

1. **作用域包**: `@csuwl/opencode-memory-plugin` 是作用域包，首次发布必须使用 `--access public`
2. **版本号**: 遵循语义化版本规范（semver）
3. **不可撤销**: npm 不允许撤销已发布的版本，发布前请仔细测试
4. **搜索延迟**: 包发布后，搜索索引可能需要几分钟更新

## 成功发布后的操作

发布成功后，可以：

1. 在 npmjs.com 上查看包: https://www.npmjs.com/package/@csuwl/opencode-memory-plugin
2. 分享安装链接: `npm install @csuwl/opencode-memory-plugin -g`
3. 在 GitHub README 中添加 npm badge:
   ```markdown
   [![npm version](https://badge.fury.io/js/@csuwl%2Fopencode-memory-plugin.svg)](https://www.npmjs.com/package/@csuwl/opencode-memory-plugin)
   ```
4. 在 README.md 中添加 npm 安装说明

---

**发布愉快！** 🎉
