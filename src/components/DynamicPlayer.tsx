'use client';
import dynamic from 'next/dynamic';

// Remotion Player must NEVER be server-rendered — it uses frame-based animations
// that produce numeric style values on the client vs CSS strings on the server.
export const DynamicPlayer = dynamic(
  () => import('@remotion/player').then((m) => ({ default: m.Player })),
  { ssr: false, loading: () => <div className="w-full h-full bg-black animate-pulse" /> }
);
