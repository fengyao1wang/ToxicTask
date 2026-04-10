import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, nickname, avatar_url } = await req.json() as WechatLoginRequest

    if (!code) {
      return new Response(
        JSON.stringify({ error: 'Missing code parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 1. 用 code 换取 openid
    const appid = Deno.env.get('WECHAT_APPID')
    const secret = Deno.env.get('WECHAT_SECRET')

    if (!appid || !secret) {
      return new Response(
        JSON.stringify({ error: 'Missing WeChat credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${appid}&secret=${secret}&js_code=${code}&grant_type=authorization_code`

    const wechatRes = await fetch(wechatUrl)
    const wechatData = await wechatRes.json() as WechatSession

    if (wechatData.errcode) {
      return new Response(
        JSON.stringify({ error: wechatData.errmsg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { openid, session_key } = wechatData

    // 2. 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 3. 查找或创建用户
    const userId = `wx_${openid}`

    // 检查用户是否存在
    const { data: existingProfile, error: profileQueryError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileQueryError) {
      console.error('Query profile error:', profileQueryError)
      return new Response(
        JSON.stringify({ error: 'Failed to query user profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!existingProfile) {
      // 创建新用户
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          username: nickname || '微信用户',
          avatar_url: avatar_url || '',
          dignity_coins: 100,
        })

      if (insertError) {
        console.error('Create profile error:', insertError)
        return new Response(
          JSON.stringify({ error: 'Failed to create user profile' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // 更新用户信息（昵称和头像可能变化）
      if (nickname || avatar_url) {
        await supabase
          .from('profiles')
          .update({
            username: nickname || existingProfile.username,
            avatar_url: avatar_url || existingProfile.avatar_url,
          })
          .eq('id', userId)
      }
    }

    // 4. 返回用户信息和自定义 token
    return new Response(
      JSON.stringify({
        user: {
          id: userId,
          email: `${openid}@wechat.user`,
          user_metadata: {
            nickname: nickname || '微信用户',
            avatar_url: avatar_url || '',
            openid: openid,
          },
        },
        session_key: session_key,
        access_token: `wx_token_${openid}_${Date.now()}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
