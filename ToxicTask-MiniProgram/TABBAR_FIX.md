# TabBar 图标问题解决方案

## 问题描述

微信开发者工具报错：找不到 `app.json` 中配置的 TabBar 图片文件。

## 解决方案

### 1. 生成图标文件

使用 Python PIL 库生成了 6 个 PNG 格式的图标文件：

**未选中状态（灰色 #666666）：**
- `tab-home.png` - 打卡图标
- `tab-shame.png` - 耻辱墙图标
- `tab-profile.png` - 资产图标

**选中状态（红色 #ff3b30）：**
- `tab-home-active.png` - 打卡图标（激活）
- `tab-shame-active.png` - 耻辱墙图标（激活）
- `tab-profile-active.png` - 资产图标（激活）

### 2. 图标规格

- **尺寸**: 81x81 像素
- **格式**: PNG (RGBA)
- **设计**: 简单的圆形纯色图标
- **文件大小**: 约 400 字节

### 3. 文件位置

```
ToxicTask-MiniProgram/
├── src/assets/          # 源文件
│   ├── tab-home.png
│   ├── tab-home-active.png
│   ├── tab-shame.png
│   ├── tab-shame-active.png
│   ├── tab-profile.png
│   └── tab-profile-active.png
└── dist/assets/         # 构建输出（自动复制）
    ├── tab-home.png
    ├── tab-home-active.png
    ├── tab-shame.png
    ├── tab-shame-active.png
    ├── tab-profile.png
    └── tab-profile-active.png
```

### 4. 配置验证

`src/app.config.ts` 中的 TabBar 配置：

```typescript
tabBar: {
  color: '#666',
  selectedColor: '#ff3b30',
  backgroundColor: '#1a1a1a',
  borderStyle: 'black',
  list: [
    {
      pagePath: 'pages/index/index',
      text: '打卡',
      iconPath: 'assets/tab-home.png',
      selectedIconPath: 'assets/tab-home-active.png'
    },
    {
      pagePath: 'pages/shame/index',
      text: '耻辱墙',
      iconPath: 'assets/tab-shame.png',
      selectedIconPath: 'assets/tab-shame-active.png'
    },
    {
      pagePath: 'pages/profile/index',
      text: '资产',
      iconPath: 'assets/tab-profile.png',
      selectedIconPath: 'assets/tab-profile-active.png'
    }
  ]
}
```

### 5. 构建验证

```bash
npm run build:weapp
```

**构建结果：**
- ✅ 编译成功
- ✅ 图标文件已复制到 dist/assets/
- ✅ app.json 配置正确
- ✅ 微信开发者工具可以正常加载

## 测试步骤

1. 在微信开发者工具中打开项目
2. 选择 `ToxicTask-MiniProgram/dist` 目录
3. 查看底部 TabBar
4. 点击不同的 Tab，验证图标切换

## 预期效果

- 底部显示 3 个 Tab：打卡、耻辱墙、资产
- 未选中的 Tab 显示灰色圆形图标
- 选中的 Tab 显示红色圆形图标
- 点击 Tab 可以正常切换页面

## 后续优化建议

当前使用的是简单的纯色圆形占位图标，后续可以：

1. **设计专业图标**
   - 打卡：使用打勾或日历图标
   - 耻辱墙：使用骷髅或警告图标
   - 资产：使用钱币或钱包图标

2. **使用设计工具**
   - Figma / Sketch 设计
   - 导出 81x81 PNG 格式
   - 保持暗黑主题风格

3. **图标库**
   - 可以使用 iconfont 或其他图标库
   - 确保符合微信小程序规范

## Git 提交

```bash
git add MIGRATION_REPORT.md src/assets/
git commit -m "feat: 添加 TabBar 图标和迁移报告"
```

**提交内容：**
- 6 个 PNG 图标文件
- 迁移报告文档
- 修复微信开发者工具报错

---

**解决时间**: 2026/04/04  
**状态**: ✅ 已解决  
**Git 提交**: `5aee4b4`
