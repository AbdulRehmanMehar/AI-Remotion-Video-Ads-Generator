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

    // Save to /tmp — works in all environments (dev, Docker, serverless-like)
    // Served back via /api/audio/[filename] which reads from /tmp
    const fileName = `tts-${Date.now()}.mp3`;
    fs.writeFileSync(path.join('/tmp', fileName), buffer);

    return NextResponse.json({ url: `/api/audio/${fileName}` });
  } catch (error) {
    console.error('TTS Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
