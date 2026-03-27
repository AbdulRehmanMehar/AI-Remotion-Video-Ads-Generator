import { Composition } from 'remotion';
import { VideoAd, VideoAdProps } from './VideoAd';
import React from 'react';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="VideoAd"
      component={VideoAd as React.FC<any>}
      durationInFrames={16 * 30} // fallback: 4s hook + 8s body + 4s cta
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{
        hookScript: { text: 'Your hook appears here', audioUrl: '' },
        bodyScript: { text: 'Your body copy appears here', audioUrl: '' },
        ctaScript: { text: 'Your call to action here', audioUrl: '' },
      } as VideoAdProps}
    />
  );
};
