# 微信开发者工具配置指南

## AppID 配置

### 方法 1：使用测试号（推荐用于开发）

1. 打开微信开发者工具
2. 导入项目时，AppID 选择 **"测试号"**
3. 项目目录选择：`D:\ToxicTask\ToxicTask-MiniProgram\dist`

### 方法 2：使用真实 AppID

如果你已经注册了小程序账号：

1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 进入"开发" -> "开发管理" -> "开发设置"
3. 复制你的 AppID
4. 修改 `project.config.json`：
   ```json
   {
     "appid": "你的真实AppID"
   }
   ```
5. 重新构建：`npm run build:weapp`

## 域名配置

### 开发阶段（当前配置）

已设置 `"urlCheck": false`，可以跳过域名校验，方便开发测试。

### 正式发布前

需要在微信公众平台配置服务器域名：

1. 登录微信公众平台
2. 进入"开发" -> "开发管理" -> "开发设置" -> "服务器域名"
3. 添加以下域名：

**request 合法域名：**
```
https://jtgiggzizzipxhwgnavx.supabase.co
```

**uploadFile 合法域名：**
```
https://jtgiggzizzipxhwgnavx.supabase.co
```

**downloadFile 合法域名：**
```
https://jtgiggzizzipxhwgnavx.supabase.co
```

## 开发者工具设置

在微信开发者工具中：

1. 点击右上角"详情"
2. 在"本地设置"中勾选：
   - ✅ 不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书
   - ✅ 启用调试

## 常见问题

### Q: "tourist appid" 错误
**A:** 在导入项目时选择"测试号"，或者使用真实的 AppID。

### Q: 网络请求失败
**A:** 
- 开发阶段：确保 `urlCheck: false` 并勾选"不校验合法域名"
- 正式发布：在微信公众平台配置 Supabase 域名

### Q: TabBar 图标不显示
**A:** 已解决，图标文件在 `dist/assets/` 目录中。

### Q: 页面空白
**A:** 
1. 检查控制台是否有错误
2. 确认 Supabase 配置正确（`.env.development`）
3. 检查网络请求是否成功

## 当前配置状态

✅ TabBar 图标已生成  
✅ 域名校验已关闭（开发模式）  
✅ 项目配置已更新  
✅ 构建成功  

## 下一步

1. 在微信开发者工具中导入项目
2. 选择"测试号"
3. 开始测试功能

---

**更新时间**: 2026/04/04
