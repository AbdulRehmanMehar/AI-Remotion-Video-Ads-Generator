import OpenAI from 'openai';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text?.trim()) {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // If no OpenAI key, tell the client to fall back to Web Speech API
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ fallback: true });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const mp3 = await client.audio.speech.create({
      model: 'tts-1',
      voice: 'onyx',
      input: text,
      speed: 1.1,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());

    // Save to public/ so both the browser Player AND the Remotion server renderer
    // can access it via a real http:// URL (blob: URLs are browser-only)
    const fileName = `tts-${Date.now()}.mp3`;
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, fileName), buffer);

    return NextResponse.json({ url: `/${fileName}` });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
