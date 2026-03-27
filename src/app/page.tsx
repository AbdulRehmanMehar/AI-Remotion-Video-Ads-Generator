"use client";

import React, { useState, useCallback } from 'react';
import { VideoAd, ScriptPart, getScriptDurationSecs } from '../remotion/VideoAd';
import { DynamicPlayer } from '../components/DynamicPlayer';

const empty: ScriptPart = { text: '', audioUrl: '' };

async function fetchTTSPart(text: string): Promise<{ audioUrl: string; durationSecs: number } | undefined> {
  if (!text.trim()) return undefined;
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.fallback || data.error || !data.url) return undefined;

    // Measure the actual duration of the audio file using the browser Audio API
    const durationSecs = await new Promise<number>((resolve) => {
      const audio = new window.Audio(data.url);
      audio.addEventListener('loadedmetadata', () => resolve(audio.duration));
      audio.addEventListener('error', () => resolve(estimateDuration(text)));
      audio.load();
    });

    return { audioUrl: data.url, durationSecs };
  } catch {
    return undefined;
  }
}

// Fallback: estimate duration from word count at ~160wpm with rate 1.1
function estimateDuration(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(2, Math.ceil((words / 160) * 60 / 1.1));
}


export default function Home() {
  const [topic, setTopic] = useState('');
  const [hookScript, setHookScript] = useState<ScriptPart>(empty);
  const [bodyScript, setBodyScript] = useState<ScriptPart>(empty);
  const [ctaScript, setCtaScript] = useState<ScriptPart>(empty);
  const [aiProvider, setAiProvider] = useState<string | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);

  const fps = 30;
  const durationInFrames = Math.round(getScriptDurationSecs(hookScript, bodyScript, ctaScript) * fps);

  const handleGenerateScript = useCallback(async () => {
    if (!topic.trim()) {
      alert('Please enter a topic first!');
      return;
    }
    setIsGenerating(true);
    setRenderUrl(null);
    try {
      // 1. Generate scripts from AI
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic }),
      });
      const data = await res.json();
      if (data.error) { alert('AI Error: ' + data.error); return; }

      setAiProvider(data.provider);

      // 2. Fetch TTS audio + measure duration in parallel for all three sections
      const [hookAudio, bodyAudio, ctaAudio] = await Promise.all([
        fetchTTSPart(data.hook.text),
        fetchTTSPart(data.body.text),
        fetchTTSPart(data.cta.text),
      ]);

      setHookScript({ text: data.hook.text, audioUrl: hookAudio?.audioUrl, durationSecs: hookAudio?.durationSecs });
      setBodyScript({ text: data.body.text, audioUrl: bodyAudio?.audioUrl, durationSecs: bodyAudio?.durationSecs });
      setCtaScript({ text: data.cta.text, audioUrl: ctaAudio?.audioUrl, durationSecs: ctaAudio?.durationSecs });

    } catch (err) {
      alert('Error: ' + String(err));
    } finally {
      setIsGenerating(false);
    }
  }, [topic]);

  const handleRender = async () => {
    setIsRendering(true);
    setRenderUrl(null);
    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hookScript, bodyScript, ctaScript }),
      });
      const data = await res.json();
      if (data.url) setRenderUrl(data.url);
      else alert('Render error: ' + (data.error || 'Unknown'));
    } catch (err) {
      alert('Error: ' + String(err));
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white font-sans">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <header className="mb-10">
          <h1 className="text-5xl font-black bg-gradient-to-r from-blue-400 via-violet-400 to-emerald-400 text-transparent bg-clip-text tracking-tight">
            BulkVideo.ai
          </h1>
          <p className="text-neutral-400 mt-2">Programmatic Video Ad Generation — Hook · Body · CTA</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          {/* Left: Config */}
          <div className="space-y-6">

            {/* AI Generator */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">✨ AI Script Generator</h2>
                {aiProvider && (
                  <span className={`text-xs font-mono px-2 py-1 rounded-full border ${aiProvider === 'ollama' ? 'bg-violet-950 text-violet-300 border-violet-700' : 'bg-blue-950 text-blue-300 border-blue-700'}`}>
                    {aiProvider === 'ollama' ? '🦙 Ollama' : '🤖 OpenAI'}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleGenerateScript()}
                  placeholder="e.g. Fitness App, Real Estate, SaaS Tool"
                  className="flex-1 bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-3 outline-none focus:border-blue-500 transition-colors text-sm"
                />
                <button
                  onClick={handleGenerateScript}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold px-6 py-3 rounded-xl transition-all shadow-blue-500/20 shadow-lg text-sm whitespace-nowrap"
                >
                  {isGenerating ? 'Generating…' : 'Generate ⚡'}
                </button>
              </div>
            </div>

            {/* Per-section editors */}
            {([
              { key: 'hook', label: '🎣 Hook', color: '#60a5fa', script: hookScript, set: setHookScript },
              { key: 'body', label: '💡 Body', color: '#34d399', script: bodyScript, set: setBodyScript },
              { key: 'cta', label: '🚀 CTA', color: '#f59e0b', script: ctaScript, set: setCtaScript },
            ] as const).map(({ key, label, color, script, set }) => (
              <div key={key} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ background: color }} />
                  <span className="font-semibold text-sm">{label}</span>
                  {script.audioUrl && (
                    <span className="ml-auto text-xs text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-800">
                      🎤 {script.durationSecs ? `${script.durationSecs.toFixed(1)}s` : 'Audio Ready'}
                    </span>
                  )}
                </div>
                <textarea
                  value={script.text}
                  onChange={e => set({ ...script, text: e.target.value })}
                  placeholder={`${label} script will appear here after generation…`}
                  className="w-full h-20 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm resize-none outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}

            {/* Render button is disabled in POC demo mode */}
          </div>

          {/* Right: Player */}
          <div className="flex flex-col items-center gap-4 sticky top-8">
            <h2 className="text-base font-semibold text-neutral-400 tracking-wide uppercase">Live Preview</h2>
            <div className="w-full rounded-3xl overflow-hidden border-4 border-neutral-800 shadow-2xl shadow-black/60 bg-black aspect-[9/16]">
              <DynamicPlayer
                component={VideoAd as React.FC<any>}
                inputProps={{ hookScript, bodyScript, ctaScript }}
                durationInFrames={durationInFrames}
                fps={fps}
                compositionWidth={1080}
                compositionHeight={1920}
                style={{ width: '100%', height: '100%' }}
                controls
                loop
              />
            </div>
            <p className="text-neutral-600 text-xs text-center">
              {hookScript.audioUrl || bodyScript.audioUrl ? '🎤 TTS audio synced — press play' : 'Generate a script to see the preview with audio'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
