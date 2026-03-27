export interface VideoAsset {
  id: string;
  url: string;
  name: string;
  durationInSeconds: number;
}

// Using some public sample videos for the POC.
// We'll set arbitrary durations to simulate cutting.
export const H_ASSETS: VideoAsset[] = [
  {
    id: 'h1',
    name: 'Hook 1 - Fast Zoom',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    durationInSeconds: 3,
  },
  {
    id: 'h2',
    name: 'Hook 2 - Person Talking',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    durationInSeconds: 4,
  },
];

export const B_ASSETS: VideoAsset[] = [
  {
    id: 'b1',
    name: 'Body 1 - Product Showcase',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    durationInSeconds: 10,
  },
  {
    id: 'b2',
    name: 'Body 2 - Testimonial',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    durationInSeconds: 15,
  },
];

export const C_ASSETS: VideoAsset[] = [
  {
    id: 'c1',
    name: 'CTA 1 - Swipe Up',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    durationInSeconds: 3,
  },
  {
    id: 'c2',
    name: 'CTA 2 - Link in Bio',
    url: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    durationInSeconds: 4,
  },
];
