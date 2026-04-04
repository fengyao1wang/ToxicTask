# 🚀 ToxicTask 微信小程序 - 快速参考

## ✅ 当前状态
- **项目**: 已完成迁移，可以运行
- **构建**: ✅ 成功
- **图标**: ✅ 已生成
- **配置**: ✅ 已完成

## 📱 在微信开发者工具中运行

### 一键启动
```bash
cd ToxicTask-MiniProgram
npm run build:weapp
```

### 导入项目
1. 打开微信开发者工具
2. 导入项目 → 选择 `dist` 目录
3. AppID → 选择"测试号"
4. 勾选"不校验合法域名"

## 📂 关键文件

| 文件 | 说明 |
|------|------|
| `dist/` | 构建输出（在微信开发者工具中打开这个目录） |
| `src/` | 源代码 |
| `QUICKSTART.md` | 快速开始指南 |
| `WECHAT_DEVTOOLS_SETUP.md` | 微信开发者工具配置 |
| `COMPLETION_SUMMARY.md` | 完整总结 |

## 🔧 常用命令

```bash
# 开发模式（监听文件变化）
npm run dev:weapp

# 生产构建
npm run build:weapp

# 安装依赖
npm install
```

## 🎨 已完成的页面

- ✅ 登录/注册 (`pages/auth`)
- ✅ 任务列表 (`pages/index`)
- ✅ 创建任务 (`pages/tasks/create`)
- ✅ 耻辱墙 (`pages/shame`)
- ✅ 个人资产 (`pages/profile`)

## 🔑 环境变量

`.env.development`:
```
TARO_APP_SUPABASE_URL=https://jtgiggzizzipxhwgnavx.supabase.co
TARO_APP_SUPABASE_ANON_KEY=sb_publishable_XAO3ZvtPxZ8ZdaZmsppkgA_4Pko-mrK
TARO_APP_USE_MOCK=true
```

## 📊 Git 状态

```bash
# 本地提交（待推送）
29710cb fix: 配置微信开发者工具设置
5aee4b4 feat: 添加 TabBar 图标和迁移报告
5b26643 feat: 完成微信小程序版本迁移

# 推送到远程
git push
```

## ⚠️ 常见问题

| 问题 | 解决方案 |
|------|----------|
| 图标不显示 | 已修复，重新构建即可 |
| tourist appid | 选择"测试号" |
| 网络请求失败 | 勾选"不校验合法域名" |
| 页面空白 | 检查控制台错误 |

## 📞 技术支持

查看详细文档：
- `QUICKSTART.md` - 快速开始
- `WECHAT_DEVTOOLS_SETUP.md` - 工具配置
- `TABBAR_FIX.md` - 图标问题
- `COMPLETION_SUMMARY.md` - 完整总结

---

**状态**: ✅ 可以运行  
**更新**: 2026/04/04
