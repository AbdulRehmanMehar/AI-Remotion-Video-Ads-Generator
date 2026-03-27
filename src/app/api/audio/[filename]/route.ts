import fs from 'fs';
import path from 'path';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const { filename } = await params;

  // Only allow valid tts-xxx.mp3 filenames to prevent path traversal
  if (!/^tts-\d+\.mp3$/.test(filename)) {
    return new Response('Not found', { status: 404 });
  }

  const filePath = path.join('/tmp', filename);

  if (!fs.existsSync(filePath)) {
    return new Response('Audio file not found', { status: 404 });
  }

  const buffer = fs.readFileSync(filePath);

  return new Response(buffer, {
    headers: {
      'Content-Type': 'audio/mpeg',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
