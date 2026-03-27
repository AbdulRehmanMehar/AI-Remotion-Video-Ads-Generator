import { NextResponse } from 'next/server';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';
import os from 'os';
import fs from 'fs';

export async function POST(req: Request) {
  try {
    if (process.env.VERCEL || process.env.NEXT_PUBLIC_VERCEL_ENV) {
      return NextResponse.json({ url: 'preview-error-vercel' });
    }

    const { hookScript, bodyScript, ctaScript } = await req.json();
    
    // Remotion renderer runs in Node.js and needs absolute http:// URLs.
    // The client passes relative paths like "/tts-xxx.mp3" — resolve them.
    const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const resolveAudio = (script: { text: string; audioUrl?: string }) => {
      const url = script.audioUrl;
      // blob: URLs are browser-only — strip them to avoid crashing the server renderer
      if (!url || url.startsWith('blob:')) return { ...script, audioUrl: undefined };
      // Resolve relative paths to absolute http:// URLs
      if (url.startsWith('/')) return { ...script, audioUrl: `${BASE}${url}` };
      return script;
    };
    
    const inputProps = {
      hookScript: resolveAudio(hookScript),
      bodyScript: resolveAudio(bodyScript),
      ctaScript: resolveAudio(ctaScript),
    };

    const entry = path.resolve(process.cwd(), 'src/remotion/index.ts');

    console.log('Bundling…');
    const bundled = await bundle({
      entryPoint: entry,
      webpackOverride: (config) => config,
    });

    console.log('Selecting composition…');
    const composition = await selectComposition({
      serveUrl: bundled,
      id: 'VideoAd',
      inputProps,
    });

    const outputLocation = path.join(os.tmpdir(), `rendered-${Date.now()}.mp4`);
    console.log('Rendering to', outputLocation);

    await renderMedia({
      composition,
      serveUrl: bundled,
      codec: 'h264',
      outputLocation,
      inputProps,
      imageFormat: 'jpeg',
    });

    const publicFileName = `rendered-${Date.now()}.mp4`;
    const publicFolder = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicFolder)) fs.mkdirSync(publicFolder, { recursive: true });
    fs.copyFileSync(outputLocation, path.join(publicFolder, publicFileName));

    return NextResponse.json({ url: `/${publicFileName}` });
  } catch (error) {
    console.error('Render error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
