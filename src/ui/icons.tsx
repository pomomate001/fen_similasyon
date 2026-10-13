/** Satır içi, bağımlılıksız simgeler (stroke: currentColor). */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

export const IconNext = () => (
  <svg {...base}>
    <path d="M5 12h13M13 6l6 6-6 6" />
  </svg>
);
export const IconPrev = () => (
  <svg {...base}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);
export const IconPause = () => (
  <svg {...base}>
    <path d="M8 5v14M16 5v14" />
  </svg>
);
export const IconPlay = () => (
  <svg {...base}>
    <path d="M7 4.5v15l12-7.5z" fill="currentColor" />
  </svg>
);
export const IconReplay = () => (
  <svg {...base}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4v4.5h4.5" />
    <path d="M11 9.5v5l3.5-2.5z" fill="currentColor" strokeWidth={1.5} />
  </svg>
);
export const IconSound = () => (
  <svg {...base}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11" />
  </svg>
);
export const IconMute = () => (
  <svg {...base}>
    <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
    <path d="M16 9.5l5 5M21 9.5l-5 5" />
  </svg>
);
export const IconRestart = () => (
  <svg {...base}>
    <path d="M20 12a8 8 0 1 1-2.4-5.7" />
    <path d="M20 4v4.5h-4.5" />
  </svg>
);
export const IconHome = () => (
  <svg {...base}>
    <path d="M4 11l8-7 8 7" />
    <path d="M6 9.5V20h12V9.5" />
  </svg>
);
export const IconInfo = () => (
  <svg {...base}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v6M12 7.5v.2" />
  </svg>
);
export const IconCheck = () => (
  <svg {...base}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);
export const IconBulb = () => (
  <svg {...base}>
    <path d="M9 18h6M10 21h4" />
    <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
  </svg>
);
export const IconSwap = () => (
  <svg {...base}>
    <path d="M7 7h12l-3-3M17 17H5l3 3" />
  </svg>
);
export const IconLock = () => (
  <svg {...base}>
    <rect x="5" y="11" width="14" height="9" rx="2" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
