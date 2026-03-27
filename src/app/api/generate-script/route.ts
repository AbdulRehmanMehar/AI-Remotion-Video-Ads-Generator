import { NextResponse } from 'next/server';
import OpenAI from 'openai';

function getClient(): { client: OpenAI; model: string; provider: string } {
  const ollamaUrl = process.env.OLLAMA_BASE_URL;
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:7b';

  if (ollamaUrl) {
    return {
      client: new OpenAI({ baseURL: ollamaUrl, apiKey: 'ollama' }),
      model,
      provider: 'ollama',
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      client: new OpenAI({ apiKey: process.env.OPENAI_API_KEY }),
      model: 'gpt-4o-mini',
      provider: 'openai',
    };
  }

  throw new Error('No AI provider configured. Set OLLAMA_BASE_URL or OPENAI_API_KEY in .env.local');
}

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();
    const fallbackTopic = topic?.trim() || 'a new product';

    const { client, model, provider } = getClient();

    const completion = await client.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: `You are an expert short-form video ad copywriter for Facebook and Instagram.
Respond ONLY with a valid JSON object matching this exact structure:
{"hookText": "...", "bodyText": "...", "ctaText": "..."}

Rules:
- hookText: STOP the scroll. Bold, direct, intriguing. Max 10 words.
- bodyText: Core value of the product. Focus on transformation. Max 25 words.
- ctaText: Urgent call to action. Tell them exactly what to do. Max 10 words.
No explanation, no markdown, just the JSON.`,
        },
        {
          role: 'user',
          content: `Write a high-converting video ad script for: "${fallbackTopic}"`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0].message.content || '{}';
    const script = JSON.parse(raw);

    if (!script.hookText || !script.bodyText || !script.ctaText) {
      throw new Error('AI returned incomplete JSON. Raw: ' + raw);
    }

    return NextResponse.json({
      hook: { text: script.hookText },
      body: { text: script.bodyText },
      cta: { text: script.ctaText },
      provider,
    });
  } catch (error) {
    console.error('AI Script Generation Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
