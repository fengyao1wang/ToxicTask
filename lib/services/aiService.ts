/**
 * AI 毒舌嘲讽服务
 * 支持多种 AI 提供商，带 Mock 模式和降级策略
 */

// 本地毒舌语录库（降级使用）
const FALLBACK_ROASTS = [
  '又一次证明了你的拖延症无药可救。',
  '说好的deadline呢？哦对，你从来就没当回事。',
  '恭喜你，成功地把"明天再说"变成了"永远不做"。',
  '你的执行力和你的尊严币一样，少得可怜。',
  '别人在努力，你在摆烂。这就是差距。',
  '任务失败了，但你失败的人生还在继续。',
  '你不是在拖延，你是在逃避现实。',
  '押金没了，自尊也没了，还剩什么？',
  '你的计划表就像你的承诺，说说而已。',
  '失败是成功之母，那你已经有无数个妈了。',
];

interface RoastRequest {
  taskTitle: string;
  betAmount: number;
  deadline: string;
}

/**
 * 生成 AI 毒舌评论
 */
export async function generateRoast(request: RoastRequest): Promise<string> {
  const useMock = process.env.EXPO_PUBLIC_USE_MOCK === 'true';

  // Mock 模式：直接返回随机语录
  if (useMock) {
    console.log('[AI][Info] Mock 模式，使用本地语录');
    return getRandomRoast();
  }

  // 尝试调用 AI API
  try {
    const aiUrl = process.env.EXPO_PUBLIC_AI_API_URL;
    const aiKey = process.env.EXPO_PUBLIC_AI_API_KEY;

    if (!aiUrl || !aiKey) {
      console.warn('[AI][Warning] AI API 未配置，使用降级语录');
      return getRandomRoast();
    }

    console.log('[AI][Info] 调用 AI 生成毒舌评论');

    const prompt = buildPrompt(request);
    const roast = await callAI(aiUrl, aiKey, prompt);

    console.log('[AI][Info] AI 生成成功:', roast);
    return roast;
  } catch (error) {
    console.error('[AI][Error] AI 调用失败，使用降级语录:', error);
    return getRandomRoast();
  }
}

/**
 * 构建 AI Prompt
 */
function buildPrompt(request: RoastRequest): string {
  return `你是一个极度毒舌、刻薄但又幽默的监督者。用户设定了一个任务但失败了，你需要狠狠嘲笑他。

任务信息：
- 任务名称：${request.taskTitle}
- 押注金额：${request.betAmount} 尊严币
- 截止时间：${new Date(request.deadline).toLocaleString('zh-CN')}

要求：
1. 不超过 50 个字
2. 不带脏字，但要直戳痛处
3. 阴阳怪气，带点黑色幽默
4. 结合任务内容进行嘲讽

请生成一句毒舌评论：`;
}

/**
 * 调用 AI API
 * 支持 OpenAI 兼容接口
 */
async function callAI(url: string, apiKey: string, prompt: string): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 100,
      temperature: 0.9,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API 返回错误: ${response.status}`);
  }

  const data = await response.json();
  const roast = data.choices?.[0]?.message?.content?.trim();

  if (!roast) {
    throw new Error('AI 返回内容为空');
  }

  return roast;
}

/**
 * 获取随机本地语录
 */
function getRandomRoast(): string {
  const index = Math.floor(Math.random() * FALLBACK_ROASTS.length);
  return FALLBACK_ROASTS[index];
}
