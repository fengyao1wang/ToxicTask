// Supabase Edge Function: 微信小程序登录
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WechatLoginRequest {
  code: string
  nickname?: string
  avatar_url?: string
}

interface WechatSession {
  openid: string
  session_key: string
  unionid?: string
  errcode?: number
  errmsg?: string
}

serve(async (req) => {
  // 处理 CORS 预检请求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 获取环境变量（Supabase 会自动注入这些）
    const WECHAT_APPID = Deno.env.get('WECHAT_APPID')
    const WECHAT_SECRET = Deno.env.get('WECHAT_SECRET')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    console.log('[WechatLogin] 环境变量检查:', {
      hasAppId: !!WECHAT_APPID,
      hasSecret: !!WECHAT_SECRET,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_ROLE_KEY,
    })

    if (!WECHAT_APPID || !WECHAT_SECRET) {
      throw new Error('微信小程序配置缺失')
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase 配置缺失')
    }

    // 解析请求体
    const { code, nickname, avatar_url }: WechatLoginRequest = await req.json()

    if (!code) {
      throw new Error('缺少微信登录 code')
    }

    console.log('[WechatLogin] 开始处理登录请求:', { code: code.substring(0, 10) + '...', nickname })

    // 1. 调用微信 API 换取 openid 和 session_key
    const wechatApiUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`

    const wechatResponse = await fetch(wechatApiUrl)
    const wechatData: WechatSession = await wechatResponse.json()

    console.log('[WechatLogin] 微信 API 响应:', {
      hasOpenid: !!wechatData.openid,
      errcode: wechatData.errcode,
      errmsg: wechatData.errmsg
    })

    if (wechatData.errcode) {
      throw new Error(`微信登录失败: ${wechatData.errmsg} (${wechatData.errcode})`)
    }

    if (!wechatData.openid) {
      throw new Error('未获取到微信 openid')
    }

    // 2. 使用 Service Role Key 创建 Supabase 客户端（绕过 RLS）
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // 3. 查找或创建用户
    const { data: existingUser, error: queryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('openid', wechatData.openid)
      .single()

    if (queryError && queryError.code !== 'PGRST116') {
      // PGRST116 是 "not found" 错误，其他错误需要抛出
      console.error('[WechatLogin] 查询用户失败:', queryError)
      throw new Error('查询用户失败')
    }

    let user

    if (existingUser) {
      // 用户已存在，更新信息
      console.log('[WechatLogin] 用户已存在，更新信息:', existingUser.id)

      const { data: updatedUser, error: updateError } = await supabase
        .from('profiles')
        .update({
          username: nickname || existingUser.username,
          avatar_url: avatar_url || existingUser.avatar_url,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('[WechatLogin] 更新用户失败:', updateError)
        throw new Error('更新用户失败')
      }

      user = updatedUser
    } else {
      // 创建新用户
      console.log('[WechatLogin] 创建新用户')

      const { data: newUser, error: insertError } = await supabase
        .from('profiles')
        .insert({
          openid: wechatData.openid,
          username: nickname || '微信用户',
          avatar_url: avatar_url || '',
          dignity_coins: 100, // 初始尊严币
        })
        .select()
        .single()

      if (insertError) {
        console.error('[WechatLogin] 创建用户失败:', insertError)
        throw new Error('创建用户失败')
      }

      user = newUser
    }

    console.log('[WechatLogin] 登录成功:', user.id)

    // 4. 返回用户信息
    return new Response(
      JSON.stringify({
        user: {
          id: user.id,
          email: `${user.openid}@wechat.toxictask`,
          user_metadata: {
            nickname: user.username,
            avatar_url: user.avatar_url,
            openid: user.openid,
          },
        },
        session_key: wechatData.session_key,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('[WechatLogin] 错误:', error)

    return new Response(
      JSON.stringify({
        error: error.message || '登录失败',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
