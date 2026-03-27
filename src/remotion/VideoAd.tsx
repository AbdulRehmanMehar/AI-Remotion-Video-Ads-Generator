import {
  Sequence,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  AbsoluteFill,
  interpolate,
  spring,
} from 'remotion';
import React from 'react';

export interface ScriptPart {
  text: string;
  audioUrl?: string;
  durationSecs?: number; // actual TTS audio length — drives the Sequence duration
}

export interface VideoAdProps {
  hookScript: ScriptPart;
  bodyScript: ScriptPart;
  ctaScript: ScriptPart;
}

// Fallback durations when no audio is available yet
const FALLBACK_SECS = { hook: 4, body: 8, cta: 4 };

export function getScriptDurationSecs(
  hookScript: ScriptPart,
  bodyScript: ScriptPart,
  ctaScript: ScriptPart,
) {
  return (
    (hookScript.durationSecs ?? FALLBACK_SECS.hook) +
    (bodyScript.durationSecs ?? FALLBACK_SECS.body) +
    (ctaScript.durationSecs ?? FALLBACK_SECS.cta)
  );
}

// ─── Visual constants ────────────────────────────────────────────────────────
type SectionVariant = 'hook' | 'body' | 'cta';

const GRADIENTS: Record<SectionVariant, [string, string]> = {
  hook: ['#0f0c29', '#302b63'],
  body: ['#0f2027', '#203a43'],
  cta: ['#1a1a2e', '#16213e'],
};
const ACCENT: Record<SectionVariant, string> = {
  hook: '#60a5fa',
  body: '#34d399',
  cta: '#f59e0b',
};
const LABEL: Record<SectionVariant, string> = {
  hook: '🎣  HOOK',
  body: '💡  BODY',
  cta: '🚀  CALL TO ACTION',
};

// ─── One animated slide ──────────────────────────────────────────────────────
function Section({
  text,
  audioUrl,
  variant,
}: {
  text: string;
  audioUrl?: string;
  variant: SectionVariant;
}) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const [from, to] = GRADIENTS[variant];
  const accent = ACCENT[variant];

  const labelY   = spring({ frame, fps, config: { damping: 14, stiffness: 120 } });
  const labelOp  = interpolate(frame, [0, 8],  [0, 1], { extrapolateRight: 'clamp' });
  const textY    = spring({ frame: Math.max(0, frame - 6), fps, config: { damping: 16, stiffness: 100 } });
  const textOp   = interpolate(frame, [6, 18], [0, 1], { extrapolateRight: 'clamp' });
  const glowOp   = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.5);
  const progress = interpolate(frame, [0, durationInFrames], [0, 100], { extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${from} 0%, ${to} 100%)`,
        fontFamily: 'Inter, system-ui, sans-serif',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        padding: '80px 80px',
      }}
    >
      {audioUrl && <Audio src={audioUrl} />}

      {/* Section label */}
      <div style={{
        opacity: labelOp,
        transform: `translateY(${interpolate(1 - labelY, [0, 1], [0, -30])}px)`,
        position: 'absolute', top: 80, left: 0, right: 0,
        display: 'flex', justifyContent: 'center',
      }}>
        <span style={{ color: accent, fontSize: 36, fontWeight: 700, letterSpacing: '0.15em' }}>
          {LABEL[variant]}
        </span>
      </div>

      {/* Glow accent bar */}
      <div style={{
        width: 6, height: 120, borderRadius: 4,
        background: accent,
        boxShadow: `0 0 ${20 * glowOp}px ${accent}`,
        position: 'absolute', left: 60, top: '50%', transform: 'translateY(-50%)',
      }} />

      {/* Main text */}
      <div style={{
        opacity: textOp,
        transform: `translateY(${interpolate(1 - textY, [0, 1], [0, 60])}px)`,
        textAlign: 'center', maxWidth: 900, paddingLeft: 60,
      }}>
        <p style={{
          color: '#ffffff',
          fontSize: variant === 'body' ? 72 : 88,
          fontWeight: 900,
          lineHeight: 1.15,
          margin: 0,
          letterSpacing: '-1px',
          textShadow: `0 0 80px ${accent}44`,
        }}>
          {text || '…'}
        </p>
      </div>

      {/* Progress bar — tracks THIS section's duration */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${accent}, ${accent}88)`,
        }} />
      </div>
    </AbsoluteFill>
  );
}

// ─── Root composition ────────────────────────────────────────────────────────
export const VideoAd: React.FC<VideoAdProps> = ({ hookScript, bodyScript, ctaScript }) => {
  const { fps } = useVideoConfig();

  const hookFrames = Math.round((hookScript.durationSecs ?? FALLBACK_SECS.hook) * fps);
  const bodyFrames = Math.round((bodyScript.durationSecs ?? FALLBACK_SECS.body) * fps);
  const ctaFrames  = Math.round((ctaScript.durationSecs  ?? FALLBACK_SECS.cta)  * fps);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <Sequence from={0}                           durationInFrames={hookFrames}>
        <Section text={hookScript.text} audioUrl={hookScript.audioUrl} variant="hook" />
      </Sequence>
      <Sequence from={hookFrames}                  durationInFrames={bodyFrames}>
        <Section text={bodyScript.text} audioUrl={bodyScript.audioUrl} variant="body" />
      </Sequence>
      <Sequence from={hookFrames + bodyFrames}     durationInFrames={ctaFrames}>
        <Section text={ctaScript.text}  audioUrl={ctaScript.audioUrl}  variant="cta" />
      </Sequence>
    </AbsoluteFill>
  );
};
