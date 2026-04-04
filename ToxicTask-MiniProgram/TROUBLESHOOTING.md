# ToxicTask 微信小程序 - 故障排除指南

## 已解决的问题

### ✅ 1. TabBar 图标找不到
**错误**: 找不到 `assets/tab-home.png` 等文件

**解决方案**: 
- 已生成 6 个 PNG 图标
- 位置: `src/assets/` 和 `dist/assets/`
- 详见: `TABBAR_FIX.md`

### ✅ 2. process is not defined
**错误**: `ReferenceError: process is not defined`

**解决方案**:
- 移除 `process.env` 的使用
- 直接在代码中配置 Supabase 凭证
- 详见: `PROCESS_ENV_FIX.md`

### ✅ 3. tourist appid 错误
**错误**: 使用测试 AppID 的提示

**解决方案**:
- 在导入项目时选择"测试号"
- 或使用真实的小程序 AppID
- 详见: `WECHAT_DEVTOOLS_SETUP.md`

## 常见问题

### Q: 页面空白，没有内容显示
**可能原因**:
1. JavaScript 错误导致页面崩溃
2. 网络请求失败
3. 认证失败

**排查步骤**:
1. 打开控制台查看错误信息
2. 检查网络请求是否成功
3. 确认 Supabase 配置正确
4. 查看是否有红色错误提示

### Q: 网络请求失败
**错误**: `request:fail`

**解决方案**:
1. 在"详情" -> "本地设置"中勾选"不校验合法域名"
2. 确认 `project.config.json` 中 `urlCheck: false`
3. 检查网络连接

### Q: 登录/注册失败
**可能原因**:
1. Supabase 配置错误
2. 网络请求被拦截
3. 数据库 RLS 策略问题

**排查步骤**:
1. 检查控制台错误信息
2. 确认 Supabase URL 和 Key 正确
3. 在 Supabase 后台检查 RLS 策略

### Q: TabBar 不显示
**可能原因**:
1. 图标文件缺失
2. 路径配置错误

**解决方案**:
1. 确认 `dist/assets/` 目录下有 6 个 PNG 文件
2. 重新构建: `npm run build:weapp`

### Q: 构建失败
**错误**: `npm run build:weapp` 失败

**解决方案**:
1. 删除 `node_modules` 和 `package-lock.json`
2. 重新安装: `npm install`
3. 再次构建: `npm run build:weapp`

## 调试技巧

### 1. 查看控制台
在微信开发者工具中：
- 点击"调试器"标签
- 查看 Console 面板
- 查看 Network 面板

### 2. 清除缓存
- 点击"清缓存" -> "清除全部缓存"
- 重新编译项目

### 3. 检查基础库版本
- 点击"详情" -> "本地设置"
- 基础库版本建议使用 2.x 或 3.x 稳定版

### 4. 查看日志
在代码中添加日志：
```typescript
console.log('[Debug] 变量值:', value);
console.error('[Error] 错误信息:', error);
```

## 开发建议

### 1. 本地设置
推荐勾选：
- ✅ 不校验合法域名
- ✅ 启用调试
- ✅ 不校验 TLS 版本

### 2. 代码规范
- 使用 TypeScript 严格模式
- 添加错误处理
- 使用 try-catch 包裹异步操作

### 3. 测试流程
1. 先在微信开发者工具中测试
2. 确认功能正常后再真机调试
3. 真机调试前配置合法域名

## 获取帮助

### 文档
- `QUICK_REFERENCE.md` - 快速参考
- `QUICKSTART.md` - 快速开始
- `WECHAT_DEVTOOLS_SETUP.md` - 工具配置
- `COMPLETION_SUMMARY.md` - 完整总结

### 日志位置
- 控制台: 微信开发者工具 -> 调试器 -> Console
- 网络: 微信开发者工具 -> 调试器 -> Network

### 常用命令
```bash
# 重新构建
npm run build:weapp

# 开发模式（监听文件变化）
npm run dev:weapp

# 清理并重新安装
rm -rf node_modules package-lock.json
npm install
```

## 已知限制

1. **小程序环境限制**
   - 不支持 Node.js 的 `process` 对象
   - 不支持某些 Web API
   - 包大小限制（主包 2MB，总包 20MB）

2. **Supabase 限制**
   - 需要配置合法域名才能正式发布
   - 实时订阅功能可能受限

3. **开发工具限制**
   - 游客模式下某些 API 受限
   - 需要真实 AppID 才能真机调试

---

**更新时间**: 2026/04/04  
**状态**: 持续更新
