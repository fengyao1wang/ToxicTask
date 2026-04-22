#!/bin/bash

echo "🚀 开始部署 Supabase Edge Function..."

# 检查是否安装了 Supabase CLI
if ! command -v supabase &> /dev/null
then
    echo "❌ 未安装 Supabase CLI"
    echo "请运行: npm install -g supabase"
    exit 1
fi

echo "✅ Supabase CLI 已安装"

# 检查是否已登录
echo "📝 检查登录状态..."
if ! supabase projects list &> /dev/null
then
    echo "❌ 未登录 Supabase"
    echo "请运行: supabase login"
    exit 1
fi

echo "✅ 已登录 Supabase"

# 链接项目
echo "🔗 链接到 Supabase 项目..."
supabase link --project-ref tjhbzbfireyyuwbdpwwg

# 推送数据库迁移
echo "📊 推送数据库迁移..."
supabase db push

# 部署 Edge Function
echo "🚀 部署 wechat-login Edge Function..."
supabase functions deploy wechat-login

echo ""
echo "✅ 部署完成！"
echo ""
echo "⚠️  重要提醒："
echo "1. 请在 Supabase Dashboard 中设置环境变量："
echo "   - WECHAT_APPID (微信小程序 AppID)"
echo "   - WECHAT_SECRET (微信小程序 AppSecret)"
echo ""
echo "2. 在微信小程序后台添加服务器域名："
echo "   https://tjhbzbfireyyuwbdpwwg.supabase.co"
echo ""
echo "3. 查看部署日志："
echo "   https://supabase.com/dashboard/project/tjhbzbfireyyuwbdpwwg/logs/edge-functions"
echo ""
