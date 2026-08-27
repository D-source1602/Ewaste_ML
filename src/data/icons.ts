/**
 * Icon path data — 24×24 grid, stroke-rendered, no fills.
 *
 * Kept out of the component file so `react/only-export-components` stays quiet
 * and so the paths can be typed against `IconName`: a missing drawing is a
 * compile error, not a blank square in the UI.
 */

import type { IconName } from '../types';

export const ICON_PATHS: Record<IconName, string> = {
  ac: 'M3 5h18v8H3Z M6 9h12 M6.5 16c0 1.6.9 2.6 2.2 3.1 M12 16c0 1.6.9 2.6 2.2 3.1 M17.5 16c0 1.6-.9 2.6-2.2 3.1',
  arrow: 'M4 12h15 M13 6l6 6-6 6',
  building:
    'M4 21V6l7-3v18 M11 10h8v11 M7 9.5h1 M7 13.5h1 M7 17.5h1 M15 14h1 M15 18h1',
  camera:
    'M3 8h4l2-2h6l2 2h4v11H3Z M12 10.5a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  chart: 'M3 20h18 M6.5 20v-5.5 M11 20V8 M15.5 20v-8.5 M20 20V5',
  check: 'M4 12.5 9.5 18 20 6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7.2v5.3l3.4 2',
  close: 'M6 6l12 12 M18 6 6 18',
  coin:
    'M12 4c4.4 0 8 1.6 8 3.5S16.4 11 12 11 4 9.4 4 7.5 7.6 4 12 4Z M4 7.5v9c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5v-9 M4 12c0 1.9 3.6 3.5 8 3.5s8-1.6 8-3.5',
  cpu:
    'M8 8h8v8H8Z M5 5h14v14H5Z M9.5 2v3 M14.5 2v3 M9.5 19v3 M14.5 19v3 M2 9.5h3 M2 14.5h3 M19 9.5h3 M19 14.5h3',
  download: 'M12 4v11 M7.5 10.5 12 15l4.5-4.5 M4 20h16',
  external:
    'M14 4h6v6 M20 4l-8 8 M18 14.5V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4.5',
  eye:
    'M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
  'eye-off':
    'M4 4l16 16 M9.6 9.7A3 3 0 0 0 12 15c.5 0 1-.1 1.4-.4 M6.4 6.6C3.8 8.3 2 12 2 12s3.6 6 10 6c1.8 0 3.3-.4 4.6-1.1 M12 6c6.4 0 10 6 10 6s-.9 1.4-2.4 2.9',
  home: 'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 11v5.2 M12 7.8h.01',
  laptop: 'M5 5h14v10H5Z M2 19h20l-2.2-4H4.2Z',
  leaf: 'M4 20c0-8 6-14 16-16 0 10-6 16-16 16Z M4.5 19.5c4-4.5 8-6.5 12-7.5',
  lock: 'M6 11h12v10H6Z M9 11V8a3 3 0 0 1 6 0v3 M12 15v2.5',
  mail: 'M3 6h18v12H3Z M3.4 6.7 12 13l8.6-6.3',
  map: 'M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2Z M9 4v14 M15 6v14',
  menu: 'M4 7h16 M4 12h16 M4 17h16',
  phone: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z M10 19h4',
  plus: 'M12 5v14 M5 12h14',
  qr:
    'M4 4h6v6H4Z M14 4h6v6h-6Z M4 14h6v6H4Z M14 14h2.2v2.2H14Z M17.8 14H20v2.2h-2.2Z M14 17.8h2.2V20H14Z M17.8 17.8H20V20h-2.2Z',
  recycle:
    'M4.5 9.6A8 8 0 0 1 18 7.2 M19.5 14.4A8 8 0 0 1 6 16.8 M4.5 4.8v4.8H9.3 M19.5 19.2v-4.8H14.7',
  shield: 'M12 3 20 6v6c0 5-3.5 8.2-8 9-4.5-.8-8-4-8-9V6Z M9 12.2l2.3 2.3L15.6 10',
  sparkle:
    'M11 3l1.7 4.9L17.6 9.6l-4.9 1.7L11 16.2 9.3 11.3 4.4 9.6 9.3 7.9Z M18.4 15.6l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7Z',
  star: 'M12 3.5 14.7 9l6 .9-4.3 4.2 1 6-5.4-2.9-5.4 2.9 1-6L3.3 9.9l6-.9Z',
  tablet: 'M5 3h14v18H5Z M10 18.2h4',
  trending: 'M3 17l6-6 4 4 8-8 M21 7h-5 M21 7v5',
  truck:
    'M3 7h11v9H3Z M14 10h4l3 3v3h-7 M7.5 16.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z M17.5 16.3a1.7 1.7 0 1 0 0 3.4 1.7 1.7 0 0 0 0-3.4Z',
  tv: 'M3 6h18v11H3Z M8.5 21h7 M12 17v4',
  upload: 'M12 16V4 M7.5 8.5 12 4l4.5 4.5 M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M4 21c0-4 3.6-6.6 8-6.6s8 2.6 8 6.6',
  world:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M3 12h18 M12 3c3 3.6 3 14.4 0 18 M12 3c-3 3.6-3 14.4 0 18',
  zap: 'M13 2 5 14h6l-1 8 8-12h-6Z',
};
